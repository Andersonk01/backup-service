import { NextResponse } from "next/server"
import { getRemote, updateRemote, deleteRemote } from "@/lib/rclone"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  try {
    const remote = await getRemote(name)
    if (!remote) {
      return NextResponse.json(
        { error: `Remote "${name}" not found` },
        { status: 404 }
      )
    }
    return NextResponse.json(remote)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get remote" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  try {
    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json(
        { error: "config is required" },
        { status: 400 }
      )
    }

    await updateRemote(name, config)
    return NextResponse.json({ success: true, name })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update remote" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  try {
    await deleteRemote(name)
    return NextResponse.json({ success: true, name })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete remote" },
      { status: 500 }
    )
  }
}
