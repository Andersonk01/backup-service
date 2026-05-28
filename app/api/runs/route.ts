import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action, runId } = body

    if (action === 'cleanup-stuck') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      const stuckRuns = await prisma.backupRun.findMany({
        where: {
          status: 'running',
          startedAt: { lt: fiveMinutesAgo },
        },
      })

      for (const run of stuckRuns) {
        await prisma.backupRun.update({
          where: { id: run.id },
          data: {
            status: 'failed',
            error: 'Timeout - backup não respondeu em 5 minutos',
            finishedAt: new Date(),
          },
        })
      }

      return NextResponse.json({ 
        cleaned: stuckRuns.length, 
        runs: stuckRuns.map(r => r.id) 
      })
    }

    if (action === 'cleanup-missing-files') {
      const runs = await prisma.backupRun.findMany({
        where: {
          status: { in: ['success', 'failed'] },
          filePath: { not: null },
        },
      })

      const fs = await import('fs/promises')
      let cleaned = 0

      for (const run of runs) {
        if (!run.filePath) continue
        const isRemotePath = run.filePath.includes(':')
        if (isRemotePath) continue

        try {
          await fs.access(run.filePath)
        } catch {
          await prisma.backupRun.update({
            where: { id: run.id },
            data: {
              status: 'failed',
              filePath: null,
              size: null,
              error: 'Arquivo de backup não encontrado no disco',
              finishedAt: run.finishedAt || new Date(),
            },
          })
          cleaned++
        }
      }

      return NextResponse.json({ cleaned })
    }

    if (action === 'fix-broken-runs') {
      const runs = await prisma.backupRun.findMany({
        where: {
          status: 'success',
          error: { not: null },
        },
      })

      let fixed = 0
      for (const run of runs) {
        await prisma.backupRun.update({
          where: { id: run.id },
          data: { status: 'failed' },
        })
        fixed++
      }

      return NextResponse.json({ fixed })
    }

    if (action === 'delete-old' && runId) {
      await prisma.backupRun.delete({ where: { id: runId } })
      return NextResponse.json({ success: true })
    }

    if (action === 'retry' && runId) {
      const run = await prisma.backupRun.findUnique({ where: { id: runId } })
      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 })
      }

      const updated = await prisma.backupRun.update({
        where: { id: runId },
        data: {
          status: 'running',
          startedAt: new Date(),
          finishedAt: null,
          error: null,
          filePath: null,
          size: null,
          duration: null,
        },
      })

      runBackupWorker(run.id, run.databaseId)
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in PATCH:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const runs = await prisma.backupRun.findMany({
      orderBy: { startedAt: 'desc' },
      include: { database: true },
    })
    
    const formattedRuns = runs.map(run => ({
      id: run.id,
      databaseId: run.databaseId,
      databaseName: run.database?.name || 'Desconhecido',
      status: run.status,
      filePath: run.filePath,
      size: run.size,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      error: run.error,
      duration: run.duration,
    }))
    
    return NextResponse.json(formattedRuns)
  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}

async function runBackupWorker(runId: string, databaseId: string) {
  try {
    const { spawn } = await import('child_process')
    
    const workerPath = process.cwd() + '/scripts/backup-worker.ts'
    
    const worker = spawn('npx', ['tsx', workerPath, '--run', runId], {
      stdio: 'inherit',
      shell: true,
    })

    worker.on('error', (error) => {
      console.error('Worker error:', error)
    })

    worker.on('exit', (code) => {
      console.log(`Worker exited with code ${code}`)
    })
  } catch (error) {
    console.error('Error starting worker:', error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { databaseId, skipRetention } = body

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
    })

    if (!database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    const run = await prisma.backupRun.create({
      data: {
        databaseId,
        databaseName: database.name,
        status: 'running',
        startedAt: new Date(),
      },
    })

    runBackupWorker(run.id, databaseId)

    return NextResponse.json(run, { status: 201 })
  } catch (error) {
    console.error('Error creating run:', error)
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }
}