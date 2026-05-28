import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/settings"

export async function GET() {
  const settings = getSettings()
  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { defaultRemote, storageBackupPath } = body
    const settings = saveSettings({ defaultRemote, storageBackupPath })
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    )
  }
}
