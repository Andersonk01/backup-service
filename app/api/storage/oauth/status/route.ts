import { NextRequest, NextResponse } from "next/server"
import { checkOAuthStatus } from "@/lib/google-oauth"

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state")
  if (!state) {
    return NextResponse.json({ error: "state é obrigatório" }, { status: 400 })
  }

  const result = checkOAuthStatus(state)
  return NextResponse.json(result)
}
