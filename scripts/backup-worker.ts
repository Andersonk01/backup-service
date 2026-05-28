import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { promisify } from 'util'
import { uploadFile, listRemotes } from '../lib/rclone'

const execAsync = promisify(exec)

interface BackupOptions {
  runId: string
  databaseId: string
}

async function runBackup({ runId, databaseId }: BackupOptions) {
  console.log(`[${new Date().toISOString()}] Starting backup for database: ${databaseId}`)

  try {
    const run = await prisma.backupRun.findUnique({
      where: { id: runId },
    })
    if (!run) {
      throw new Error(`Run not found: ${runId}`)
    }

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
    })

    if (!database) {
      throw new Error(`Database not found: ${databaseId}`)
    }

    console.log(`[${new Date().toISOString()}] Database: ${database.name} (${database.type})`)
    console.log(`[${new Date().toISOString()}] Connection: ${database.connectionUrl.replace(/:[^:]+@/, ':****@')}`)

    // Lookup the job to determine destination
    const job = await prisma.backupJob.findFirst({
      where: { databaseId, isActive: true },
    })
    const destination = job?.destination || 'remote'

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = path.join(process.cwd(), 'backups', database.name.replace(/[^a-zA-Z0-9]/g, '_'))
    const backupFile = path.join(backupDir, `backup-${timestamp}.dump`)

    await fs.mkdir(backupDir, { recursive: true })

    if (database.type === 'postgres') {
      await runPostgresBackup(database.connectionUrl, backupFile)
    } else {
      throw new Error(`Database type not supported: ${database.type}`)
    }

    const stats = await fs.stat(backupFile)
    const fileSize = stats.size

    console.log(`[${new Date().toISOString()}] Backup completed: ${backupFile} (${formatBytes(fileSize)})`)

    let finalPath: string | undefined
    let uploadedRemote: string | undefined

    // Upload to cloud storage if destination is remote or both
    if (destination === 'remote' || destination === 'both') {
      try {
        const remotes = await listRemotes()
        const defaultRemote = process.env.DEFAULT_RCLONE_REMOTE || remotes.find(r => r.type === 'drive')?.name
        uploadedRemote = defaultRemote

        if (defaultRemote) {
          const storagePath = process.env.STORAGE_BACKUP_PATH || '/backups'
          const destPath = `${storagePath}/${database.name.replace(/[^a-zA-Z0-9]/g, '_')}/${path.basename(backupFile)}`

          console.log(`[${new Date().toISOString()}] Uploading to ${defaultRemote}:${destPath}...`)

          const uploadResult = await uploadFile(backupFile, defaultRemote, destPath)

          if (uploadResult.success) {
            finalPath = `${defaultRemote}:${destPath}`
            console.log(`[${new Date().toISOString()}] Upload completed: ${finalPath}`)
          } else {
            console.error(`[${new Date().toISOString()}] Upload failed: ${uploadResult.error}`)
          }
        } else {
          console.log(`[${new Date().toISOString()}] No remote configured for upload, skipping`)
        }
      } catch (uploadError) {
        console.error(`[${new Date().toISOString()}] Upload error:`, uploadError)
      }
    }

    // If destination is local only or upload wasn't configured, keep local path
    if (!finalPath) {
      finalPath = backupFile
    }

    // Clean up local file if uploaded successfully and destination is not 'both'
    if (destination === 'remote' && uploadedRemote && finalPath?.startsWith(`${uploadedRemote}:`)) {
      try {
        await fs.unlink(backupFile)
        console.log(`[${new Date().toISOString()}] Local file cleaned up: ${backupFile}`)
      } catch { /* best effort */ }
    }

    await prisma.backupRun.update({
      where: { id: runId },
      data: {
        status: 'success',
        filePath: finalPath,
        size: fileSize,
        finishedAt: new Date(),
        duration: Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000),
      },
    })

    await prisma.database.update({
      where: { id: databaseId },
      data: {
        lastBackup: new Date(),
      },
    })

    console.log(`[${new Date().toISOString()}] Backup finished successfully!`)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Backup failed:`, error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await prisma.backupRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        error: errorMessage,
        finishedAt: new Date(),
      },
    })

    console.error(`[${new Date().toISOString()}] Backup marked as FAILED in database`)
  }
}

async function runPostgresBackup(connectionUrl: string, outputFile: string) {
  const { stdout, stderr } = await execAsync(
    `pg_dump -Fc -f "${outputFile}" "${connectionUrl}"`,
    { timeout: 300000 }
  )

  if (stderr && !stderr.includes('WARNING')) {
    console.warn('pg_dump stderr:', stderr)
  }

  console.log('pg_dump completed')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function processPendingRuns() {
  const pendingRuns = await prisma.backupRun.findMany({
    where: { status: 'running' },
  })

  console.log(`Found ${pendingRuns.length} running backup(s)`)

  for (const run of pendingRuns) {
    console.log(`Processing backup run: ${run.id}`)
    await runBackup({ runId: run.id, databaseId: run.databaseId })
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('No arguments provided. Checking for pending runs...')
    await processPendingRuns()
    return
  }

  if (args[0] === '--run' && args[1]) {
    const runId = args[1]
    console.log(`Running backup for run ID: ${runId}`)

    const run = await prisma.backupRun.findUnique({
      where: { id: runId },
    })

    if (!run) {
      console.error(`Run not found: ${runId}`)
      process.exit(1)
    }

    await runBackup({ runId: run.id, databaseId: run.databaseId })
    return
  }

  if (args[0] === '--database' && args[1]) {
    const databaseId = args[1]
    console.log(`Creating new backup for database ID: ${databaseId}`)

    const run = await prisma.backupRun.create({
      data: {
        databaseId,
        databaseName: (await prisma.database.findUnique({ where: { id: databaseId } }))?.name,
        status: 'running',
        startedAt: new Date(),
      },
    })

    await runBackup({ runId: run.id, databaseId })
    return
  }

  console.log('Usage:')
  console.log('  npx tsx scripts/backup-worker.ts                    # Process pending runs')
  console.log('  npx tsx scripts/backup-worker.ts --run <run-id>     # Run specific backup')
  console.log('  npx tsx scripts/backup-worker.ts --database <id>    # Create new backup for database')
}

main().catch(console.error)