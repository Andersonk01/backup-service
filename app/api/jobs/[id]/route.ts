import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 })
    }

    const job = await prisma.backupJob.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({
      id: job.id,
      databaseId: job.databaseId,
      frequency: job.frequency,
      time: job.time,
      retentionDays: job.retentionDays,
      isActive: job.isActive,
      nextRun: job.nextRun,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("RecordNotFound")) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await prisma.backupJob.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("RecordNotFound")) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}
