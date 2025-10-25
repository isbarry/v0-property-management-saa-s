// Locations API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Location } from "@/lib/types/database"

// GET /api/locations - List all locations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const locations = await query<Location>("SELECT * FROM locations WHERE user_id = $1 ORDER BY name ASC", [user.id])

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("[v0] Get locations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check if location already exists for this user
    const existing = await query<Location>("SELECT * FROM locations WHERE user_id = $1 AND name = $2", [
      user.id,
      trimmedName,
    ])

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Location already exists" }, { status: 409 })
    }

    const locations = await query<Location>("INSERT INTO locations (user_id, name) VALUES ($1, $2) RETURNING *", [
      user.id,
      trimmedName,
    ])

    if (!locations || locations.length === 0) {
      return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
    }

    return NextResponse.json({ location: locations[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create location error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
