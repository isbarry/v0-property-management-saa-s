import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const buildings = await query(
      `SELECT b.*, l.name as location_name 
       FROM buildings b
       LEFT JOIN locations l ON b.location_id = l.id
       WHERE b.user_id = $1 
       ORDER BY b.name`,
      [user.id],
    )

    return NextResponse.json({ buildings })
  } catch (error) {
    console.error("[v0] Get buildings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, location_id } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Building name is required" }, { status: 400 })
    }

    // Check if building already exists for this user
    const existing = await query("SELECT id FROM buildings WHERE user_id = $1 AND name = $2", [user.id, name.trim()])

    if (existing.length > 0) {
      return NextResponse.json({ error: "Building already exists" }, { status: 400 })
    }

    const result = await query("INSERT INTO buildings (user_id, name, location_id) VALUES ($1, $2, $3) RETURNING *", [
      user.id,
      name.trim(),
      location_id || null,
    ])

    return NextResponse.json({ building: result[0] })
  } catch (error) {
    console.error("[v0] Create building error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
