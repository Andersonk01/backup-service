import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const databases = await prisma.database.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(databases)
  } catch (error) {
    console.error('Error fetching databases:', error)
    return NextResponse.json({ error: 'Failed to fetch databases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, connectionUrl, host, port, database, username, password } = body

    const fullConnectionUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`

    const db = await prisma.database.create({
      data: {
        name,
        type,
        connectionUrl: fullConnectionUrl,
        isActive: true,
        successRate: 100,
      },
    })

    return NextResponse.json(db, { status: 201 })
  } catch (error) {
    console.error('Error creating database:', error)
    return NextResponse.json({ error: 'Failed to create database' }, { status: 500 })
  }
}