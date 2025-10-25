// Blocked Dates API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { BlockedDate } from "@/lib/types/database"

// GET /api/blocked-dates - List blocked dates
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")

    let queryText = "SELECT * FROM blocked_dates WHERE user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      queryText += ` AND property_id = $${params.length}`
    }

    queryText += " ORDER BY start_date ASC"

    const blockedDates = await query<BlockedDate>(queryText, params)

    return NextResponse.json({ blocked_dates: blockedDates })
  } catch (error) {
    console.error("[v0] Get blocked dates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/blocked-dates - Create blocked date
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { property_id, start_date, end_date, reason } = body

    if (!property_id || !start_date || !end_date) {
      return NextResponse.json({ error: "property_id, start_date, and end_date are required" }, { status: 400 })
    }

    // Verify property ownership
    const properties = await query("SELECT id FROM properties WHERE id = $1 AND user_id = $2", [property_id, user.id])

    if (properties.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const blockedDates = await query<BlockedDate>(
      `INSERT INTO blocked_dates (user_id, property_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, property_id, start_date, end_date, reason],
    )

    return NextResponse.json({ blocked_date: blockedDates[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create blocked date error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
