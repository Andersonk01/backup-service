import { NextResponse } from "next/server"
import { uploadFile } from "@/lib/rclone"
import { promises as fs } from "fs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { localPath, remote, remotePath } = body

    if (!localPath || !remote) {
      return NextResponse.json(
        { error: "localPath and remote are required" },
        { status: 400 }
      )
    }

    const exists = await fs
      .access(localPath)
      .then(() => true)
      .catch(() => false)

    if (!exists) {
      return NextResponse.json(
        { error: `File not found: ${localPath}` },
        { status: 404 }
      )
    }

    const result = await uploadFile(localPath, remote, remotePath || "")
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
