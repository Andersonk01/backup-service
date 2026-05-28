import { NextResponse } from "next/server"
import { testRemote } from "@/lib/rclone"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  try {
    const result = await testRemote(name)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 }
    )
  }
}
