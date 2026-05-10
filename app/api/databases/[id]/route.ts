import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await prisma.database.findUnique({
      where: { id },
    })
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }
    return NextResponse.json(db)
  } catch (error) {
    console.error('Error fetching database:', error)
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const db = await prisma.database.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(db)
  } catch (error) {
    console.error('Error updating database:', error)
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.database.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting database:', error)
    return NextResponse.json({ error: 'Failed to delete database' }, { status: 500 })
  }
}