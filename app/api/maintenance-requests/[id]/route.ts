import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      SELECT 
        mr.*,
        p.name as property_name,
        p.address as property_address,
        t.first_name as tenant_first_name,
        t.last_name as tenant_last_name,
        t.email as tenant_email,
        t.phone as tenant_phone
      FROM maintenance_requests mr
      LEFT JOIN properties p ON mr.property_id = p.id
      LEFT JOIN tenants t ON mr.tenant_id = t.id
      WHERE mr.id = ${params.id} AND mr.user_id = ${userId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 })
    }

    return NextResponse.json({ request: result[0] })
  } catch (error) {
    console.error("[v0] Error fetching maintenance request:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance request" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      priority,
      assigned_to,
      estimated_cost,
      actual_cost,
      scheduled_date,
      completed_date,
      notes,
      images,
    } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "completed", "cancelled"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updates.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high", "urgent"]
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
      }
      updates.push(`priority = $${paramIndex}`)
      values.push(priority)
      paramIndex++
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`)
      values.push(assigned_to)
      paramIndex++
    }

    if (estimated_cost !== undefined) {
      updates.push(`estimated_cost = $${paramIndex}`)
      values.push(estimated_cost)
      paramIndex++
    }

    if (actual_cost !== undefined) {
      updates.push(`actual_cost = $${paramIndex}`)
      values.push(actual_cost)
      paramIndex++
    }

    if (scheduled_date !== undefined) {
      updates.push(`scheduled_date = $${paramIndex}`)
      values.push(scheduled_date)
      paramIndex++
    }

    if (completed_date !== undefined) {
      updates.push(`completed_date = $${paramIndex}`)
      values.push(completed_date)
      paramIndex++
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(notes)
      paramIndex++
    }

    if (images !== undefined) {
      updates.push(`images = $${paramIndex}`)
      values.push(JSON.stringify(images))
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id, userId)

    const query = `
      UPDATE maintenance_requests 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `

    const result = await sql(query, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 })
    }

    return NextResponse.json({ request: result[0] })
  } catch (error) {
    console.error("[v0] Error updating maintenance request:", error)
    return NextResponse.json({ error: "Failed to update maintenance request" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      DELETE FROM maintenance_requests 
      WHERE id = ${params.id} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Maintenance request deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting maintenance request:", error)
    return NextResponse.json({ error: "Failed to delete maintenance request" }, { status: 500 })
  }
}
