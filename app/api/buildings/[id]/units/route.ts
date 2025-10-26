import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET /api/buildings/[id]/units - Get all units for a specific building
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const buildingId = params.id

    // Handle special case for uncategorized properties (building_id = 0)
    let queryText: string
    let queryParams: any[]

    if (buildingId === "0") {
      // Get properties without a building_id
      queryText = `
        SELECT 
          p.*,
          COALESCE(l.name, p.location) as location_name
        FROM properties p
        LEFT JOIN locations l ON p.location_id = l.id
        WHERE p.user_id = $1 AND (p.building_id IS NULL OR p.building_id = 0)
        ORDER BY p.unit_name
      `
      queryParams = [user.id]
    } else {
      // Get properties for specific building
      queryText = `
        SELECT 
          p.*,
          COALESCE(l.name, p.location) as location_name
        FROM properties p
        LEFT JOIN locations l ON p.location_id = l.id
        WHERE p.user_id = $1 AND p.building_id = $2
        ORDER BY p.unit_name
      `
      queryParams = [user.id, Number(buildingId)]
    }

    const units = await query(queryText, queryParams)

    console.log(`[v0] Found ${units.length} units for building ${buildingId}`)

    return NextResponse.json({ units })
  } catch (error) {
    console.error("[v0] Get building units error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
