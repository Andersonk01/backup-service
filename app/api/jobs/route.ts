import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jobs = await prisma.backupJob.findMany({
      include: { database: true },
    })
    
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      databaseId: job.databaseId,
      frequency: job.frequency,
      time: job.time,
      retentionDays: job.retentionDays,
      isActive: job.isActive,
      nextRun: job.nextRun,
      destination: job.destination,
    }))
    
    return NextResponse.json(formattedJobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { databaseId, frequency, time, retentionDays, isActive, destination } = body

    const job = await prisma.backupJob.create({
      data: {
        databaseId,
        frequency,
        time,
        retentionDays: retentionDays || 7,
        isActive: isActive ?? true,
        destination: destination || 'remote',
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}