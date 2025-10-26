import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET /api/buildings/aggregated - Get building-level aggregated data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("location_id")
    const propertyType = searchParams.get("property_type")

    // Get all buildings with aggregated unit data
    let queryText = `
      WITH building_stats AS (
        SELECT 
          COALESCE(p.building_id, 0) as building_id,
          COALESCE(p.building_name, p.property_name, 'Uncategorized') as building_name,
          COALESCE(l.name, p.location, 'Unknown') as location,
          p.property_type,
          COUNT(p.id) as total_units,
          COUNT(CASE WHEN p.status = 'occupied' THEN 1 END) as occupied_units,
          COALESCE(SUM(r.paid_amount), 0) as total_revenue
        FROM properties p
        LEFT JOIN locations l ON p.location_id = l.id
        LEFT JOIN reservations r ON r.property_id = p.id AND r.status IN ('confirmed', 'checked-in', 'checked-out')
        WHERE p.user_id = $1
    `

    const params: any[] = [user.id]

    if (locationId && locationId !== "all") {
      params.push(Number(locationId))
      queryText += ` AND p.location_id = $${params.length}`
    }

    if (propertyType && propertyType !== "all") {
      params.push(propertyType)
      queryText += ` AND p.property_type = $${params.length}`
    }

    queryText += `
        GROUP BY p.building_id, p.building_name, p.property_name, l.name, p.location, p.property_type
      )
      SELECT 
        building_id as id,
        building_name as name,
        location,
        property_type,
        total_units,
        occupied_units,
        total_revenue,
        CASE 
          WHEN total_units > 0 THEN CAST(occupied_units AS FLOAT) / total_units
          ELSE 0
        END as occupancy_rate
      FROM building_stats
      WHERE total_units > 0
      ORDER BY building_name
    `

    console.log("[v0] Building aggregation query:", queryText)
    console.log("[v0] Building aggregation params:", params)

    const results = await query(queryText, params)

    console.log(`[v0] Found ${results.length} buildings with aggregated data`)

    const buildings = results.map((building: any) => ({
      id: building.id,
      name: building.name,
      location: building.location,
      property_type: building.property_type,
      totalUnits: building.total_units,
      occupiedUnits: building.occupied_units,
      totalRevenue: Number(building.total_revenue) || 0,
      occupancyRate: Number(building.occupancy_rate) || 0,
    }))

    return NextResponse.json({ buildings })
  } catch (error) {
    console.error("[v0] Get aggregated buildings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
