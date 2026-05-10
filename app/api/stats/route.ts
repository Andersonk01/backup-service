import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalDatabases, activeDatabases, runs] = await Promise.all([
      prisma.database.count(),
      prisma.database.count({ where: { isActive: true } }),
      prisma.backupRun.findMany(),
    ])

    const totalBackups = runs.length
    const successfulBackups = runs.filter(r => r.status === 'success').length
    const failedBackups = runs.filter(r => r.status === 'failed').length
    const totalStorage = runs.reduce((acc, r) => acc + (r.size || 0), 0)
    
    const completedRuns = runs.filter(r => r.duration)
    const averageBackupTime = completedRuns.length > 0
      ? completedRuns.reduce((acc, r) => acc + (r.duration || 0), 0) / completedRuns.length
      : 0

    const lastBackupTime = runs
      .filter(r => r.status === 'success' && r.finishedAt)
      .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())[0]?.finishedAt

    const stats = {
      totalDatabases,
      activeDatabases,
      totalBackups,
      successfulBackups,
      failedBackups,
      totalStorage,
      averageBackupTime: Math.round(averageBackupTime),
      lastBackupTime: lastBackupTime || null,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}