import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const propertyId = searchParams.get("property_id")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    let query = `
      SELECT 
        mr.*,
        p.name as property_name,
        p.address as property_address,
        t.first_name as tenant_first_name,
        t.last_name as tenant_last_name
      FROM maintenance_requests mr
      LEFT JOIN properties p ON mr.property_id = p.id
      LEFT JOIN tenants t ON mr.tenant_id = t.id
      WHERE mr.user_id = $1
    `
    const params: any[] = [userId]
    let paramIndex = 2

    if (propertyId) {
      query += ` AND mr.property_id = $${paramIndex}`
      params.push(Number.parseInt(propertyId))
      paramIndex++
    }

    if (status) {
      query += ` AND mr.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (priority) {
      query += ` AND mr.priority = $${paramIndex}`
      params.push(priority)
      paramIndex++
    }

    query += ` ORDER BY 
      CASE mr.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      mr.created_at DESC
    `

    const requests = await sql(query, params)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[v0] Error fetching maintenance requests:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { property_id, tenant_id, title, description, category, priority = "medium", images = [], notes } = body

    // Validation
    if (!property_id || !title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const validCategories = [
      "plumbing",
      "electrical",
      "hvac",
      "appliance",
      "structural",
      "pest_control",
      "landscaping",
      "cleaning",
      "security",
      "other",
    ]
    const validPriorities = ["low", "medium", "high", "urgent"]

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO maintenance_requests (
        user_id, property_id, tenant_id, title, description, 
        category, priority, status, images, notes
      )
      VALUES (
        ${userId}, ${property_id}, ${tenant_id || null}, ${title}, ${description},
        ${category}, ${priority}, 'open', ${JSON.stringify(images)}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json({ request: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating maintenance request:", error)
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 })
  }
}
