// Logout endpoint
import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    await deleteSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
