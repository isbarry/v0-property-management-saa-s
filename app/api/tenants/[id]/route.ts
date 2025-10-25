// Tenants API - Get, Update, Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Tenant } from "@/lib/types/database"

// GET /api/tenants/[id] - Get a single tenant
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenants = await query<Tenant>("SELECT * FROM tenants WHERE id = $1 AND user_id = $2", [params.id, user.id])

    if (tenants.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ tenant: tenants[0] })
  } catch (error) {
    console.error("[v0] Get tenant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/tenants/[id] - Update a tenant
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify tenant ownership
    const existingTenants = await query<Tenant>("SELECT * FROM tenants WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (existingTenants.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      "property_id",
      "first_name",
      "last_name",
      "email",
      "phone",
      "emergency_contact_name",
      "emergency_contact_phone",
      "date_of_birth",
      "identification_type",
      "identification_number",
      "status",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`)
        values.push(body[field])
        paramCount++
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    values.push(params.id, user.id)
    const tenants = await query<Tenant>(
      `UPDATE tenants SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values,
    )

    return NextResponse.json({ tenant: tenants[0] })
  } catch (error) {
    console.error("[v0] Update tenant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tenants/[id] - Delete a tenant
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM tenants WHERE id = $1 AND user_id = $2 RETURNING id", [params.id, user.id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete tenant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
