import { NextResponse } from "next/server"
import { getProviders } from "@/lib/rclone"

export async function GET() {
  try {
    const providers = await getProviders()
    return NextResponse.json(providers)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list providers" },
      { status: 500 }
    )
  }
}
