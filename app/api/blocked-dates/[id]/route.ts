// Blocked Dates API - Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// DELETE /api/blocked-dates/[id] - Delete a blocked date
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM blocked_dates WHERE id = $1 AND user_id = $2 RETURNING id", [
      params.id,
      user.id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: "Blocked date not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete blocked date error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
