// Tenants API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Tenant } from "@/lib/types/database"

// GET /api/tenants - List all tenants
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")
    const status = searchParams.get("status")

    let queryText = "SELECT * FROM tenants WHERE user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      queryText += ` AND property_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      queryText += ` AND status = $${params.length}`
    }

    queryText += " ORDER BY created_at DESC"

    const tenants = await query<Tenant>(queryText, params)

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error("[v0] Get tenants error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      property_id,
      first_name,
      last_name,
      email,
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      date_of_birth,
      identification_type,
      identification_number,
      status,
    } = body

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "first_name, last_name, and email are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // If property_id is provided, verify ownership
    if (property_id) {
      const properties = await query("SELECT id FROM properties WHERE id = $1 AND user_id = $2", [property_id, user.id])

      if (properties.length === 0) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 })
      }
    }

    const tenants = await query<Tenant>(
      `INSERT INTO tenants (
        user_id, property_id, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone, date_of_birth,
        identification_type, identification_number, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user.id,
        property_id || null,
        first_name,
        last_name,
        email,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        date_of_birth,
        identification_type,
        identification_number,
        status || "active",
      ],
    )

    return NextResponse.json({ tenant: tenants[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create tenant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
