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
    
    // Protect against Mass-Assignment: Destructure only allowed properties
    const { name, type, isActive, connectionUrl, host, port, database, username, password } = body
    
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (isActive !== undefined) updateData.isActive = isActive
    
    // If specific connection fields are provided, rebuild the connectionUrl securely.
    // Otherwise, if connectionUrl is supplied directly, we perform a validation to avoid injecting
    // malicious parameters.
    if (username !== undefined && password !== undefined && host !== undefined && port !== undefined && database !== undefined) {
      updateData.connectionUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`
    } else if (connectionUrl !== undefined) {
      // Allow connectionUrl directly only if it's a valid URI structure
      if (typeof connectionUrl === 'string' && connectionUrl.startsWith('postgresql://')) {
        updateData.connectionUrl = connectionUrl
      } else {
        return NextResponse.json({ error: 'Invalid connectionUrl structure' }, { status: 400 })
      }
    }

    const db = await prisma.database.update({
      where: { id },
      data: updateData,
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