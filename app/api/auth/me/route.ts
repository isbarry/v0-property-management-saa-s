// Get current user endpoint
import { type NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
