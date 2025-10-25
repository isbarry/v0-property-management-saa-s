// Properties API - Get, Update, Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Property } from "@/lib/types/database"

// GET /api/properties/[id] - Get a single property
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const properties = await query<Property>(
      `SELECT 
        p.*,
        COALESCE(b.name, p.unit_name) as property_name
      FROM properties p
      LEFT JOIN buildings b ON p.building_id = b.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [params.id, user.id],
    )

    if (properties.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ property: properties[0] })
  } catch (error) {
    console.error("[v0] Get property error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/properties/[id] - Update a property
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify property ownership
    const existingProperties = await query<Property>("SELECT * FROM properties WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (existingProperties.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      "unit_name",
      "location",
      "location_id",
      "building_id",
      "property_type",
      "rental_type",
      "bedrooms",
      "bathrooms",
      "square_feet",
      "max_guests",
      "description",
      "amenities",
      "images",
      "status",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`)
        values.push(field === "amenities" || field === "images" ? JSON.stringify(body[field]) : body[field])
        paramCount++
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    values.push(params.id, user.id)

    const updateQuery = `UPDATE properties SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`

    let properties: Property[] = []

    // If documents are provided, try to include them in the update
    if (body.documents !== undefined) {
      try {
        const documentsUpdates = [...updates, `documents = $${paramCount}`]
        const documentsValues = [...values.slice(0, -2), JSON.stringify(body.documents), ...values.slice(-2)]

        properties = await query<Property>(
          `UPDATE properties SET ${documentsUpdates.join(", ")} 
           WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
           RETURNING *`,
          documentsValues,
        )
      } catch (error: any) {
        // If documents column doesn't exist, fall back to update without documents
        if (error?.message?.includes('column "documents"') || error?.code === "42703") {
          console.log(
            "[v0] Documents column doesn't exist yet. Run add-documents-column.sql migration to enable document uploads.",
          )
          // Retry without documents
          properties = await query<Property>(updateQuery, values)
        } else {
          // Re-throw other errors
          throw error
        }
      }
    } else {
      // No documents provided, just update normally
      properties = await query<Property>(updateQuery, values)
    }

    // Ensure we have a valid property result
    if (!properties || properties.length === 0) {
      return NextResponse.json({ error: "Failed to update property" }, { status: 500 })
    }

    const updatedProperty = await query(
      `SELECT 
        p.*,
        COALESCE(b.name, p.unit_name) as property_name
      FROM properties p
      LEFT JOIN buildings b ON p.building_id = b.id
      WHERE p.id = $1`,
      [properties[0].id],
    )

    return NextResponse.json({ property: updatedProperty[0] })
  } catch (error) {
    console.error("[v0] Update property error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/properties/[id] - Update a property (matches PATCH functionality)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params })
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING id", [
      params.id,
      user.id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete property error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
