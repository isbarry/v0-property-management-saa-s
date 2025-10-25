// Properties API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Property } from "@/lib/types/database"

// GET /api/properties - List all properties for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const propertyType = searchParams.get("property_type")
    const locationId = searchParams.get("location_id")

    let queryText = `
      SELECT 
        p.*,
        COALESCE(b.name, p.unit_name) as name,
        b.name as building_name,
        COALESCE(l.name, p.location) as location_name
      FROM properties p
      LEFT JOIN buildings b ON p.building_id = b.id
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.user_id = $1
    `
    const params: any[] = [user.id]

    if (status) {
      params.push(status)
      queryText += ` AND p.status = $${params.length}`
    }

    if (propertyType) {
      params.push(propertyType)
      queryText += ` AND p.property_type = $${params.length}`
    }

    if (locationId) {
      params.push(Number(locationId))
      queryText += ` AND p.location_id = $${params.length}`
    }

    queryText += " ORDER BY p.created_at DESC"

    const properties = await query<Property>(queryText, params)

    return NextResponse.json({ properties })
  } catch (error) {
    console.error("[v0] Get properties error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Received property data:", body)

    const {
      unit_name,
      location,
      location_id,
      building_id,
      property_type,
      rental_type,
      bedrooms,
      bathrooms,
      square_feet,
      max_guests,
      description,
      amenities,
      images,
      documents, // Added documents field
      status,
    } = body

    if (!unit_name || !property_type || (!location && !location_id)) {
      console.error("[v0] Missing required fields:", { unit_name, location, location_id, property_type })
      return NextResponse.json(
        { error: "Missing required fields: unit_name, property_type, and either location or location_id" },
        { status: 400 },
      )
    }

    const validPropertyTypes = ["apartment", "house", "condo", "villa", "studio", "other"]
    if (!validPropertyTypes.includes(property_type)) {
      console.error("[v0] Invalid property_type:", property_type)
      return NextResponse.json({ error: "Invalid property_type" }, { status: 400 })
    }

    console.log("[v0] Creating property with user_id:", user.id)

    const finalBuildingId = building_id && building_id !== null ? building_id : null

    const properties = await query<Property>(
      `INSERT INTO properties (
        user_id, unit_name, location, location_id, building_id,
        property_type, rental_type, bedrooms, bathrooms, square_feet,
        max_guests, description, amenities, images, documents, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        user.id,
        unit_name,
        location || null,
        location_id || null,
        finalBuildingId,
        property_type,
        rental_type || null,
        bedrooms || 1,
        bathrooms || 1,
        square_feet || null,
        max_guests || null,
        description || null,
        JSON.stringify(amenities || []),
        JSON.stringify(images || []),
        JSON.stringify(documents || []), // Added documents parameter
        status || "active",
      ],
    )

    if (!properties || properties.length === 0) {
      console.error("[v0] No property returned from INSERT query")
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
    }

    const propertyWithBuilding = await query(
      `SELECT 
        p.*,
        COALESCE(b.name, p.unit_name) as name,
        b.name as building_name,
        COALESCE(l.name, p.location) as location_name
      FROM properties p
      LEFT JOIN buildings b ON p.building_id = b.id
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = $1`,
      [properties[0].id],
    )

    console.log("[v0] Property created successfully:", propertyWithBuilding[0])

    return NextResponse.json({ property: propertyWithBuilding[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create property error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
