import { NextResponse } from "next/server"
import { startOAuth } from "@/lib/google-oauth"

export async function POST() {
  try {
    const result = await startOAuth()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar OAuth"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
