import { NextResponse } from "next/server"
import { getStorageUsage, listRemotes } from "@/lib/rclone"

export async function GET() {
  try {
    const remotes = await listRemotes()
    const driveRemotes = remotes.filter((r) => r.type === "drive")

    if (driveRemotes.length === 0) {
      return NextResponse.json({ used: 0, total: 0, free: 0, remotes: driveRemotes })
    }

    const usageResults = await Promise.allSettled(
      driveRemotes.map((r) => getStorageUsage(r.name))
    )

    const totalUsage = usageResults.reduce(
      (acc, result) => {
        if (result.status === "fulfilled" && result.value) {
          acc.used += result.value.used
          acc.total += result.value.total
          acc.free += result.value.free
        }
        return acc
      },
      { used: 0, total: 0, free: 0 }
    )

    return NextResponse.json({
      ...totalUsage,
      remotes: driveRemotes,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get storage usage" },
      { status: 500 }
    )
  }
}
