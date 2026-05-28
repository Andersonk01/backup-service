import { NextResponse } from "next/server"
import {
  listRemotes,
  createRemote,
  getProviders,
} from "@/lib/rclone"

export async function GET() {
  try {
    const [remotes, providers] = await Promise.all([
      listRemotes(),
      getProviders(),
    ])
    return NextResponse.json({ remotes, providers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list remotes" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      )
    }

    await createRemote(name, type, config || {})
    return NextResponse.json({ success: true, name, type })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create remote" },
      { status: 500 }
    )
  }
}
