import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching dashboard metrics...")

    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total properties
    const propertiesResult = await sql`
      SELECT COUNT(*) as total FROM public.properties WHERE user_id = ${user.id}
    `
    const totalProperties = Number(propertiesResult[0].total)

    const occupiedResult = await sql`
      SELECT COUNT(DISTINCT property_id) as count 
      FROM public.reservations 
      WHERE user_id = ${user.id} 
        AND check_in <= CURRENT_DATE 
        AND check_out >= CURRENT_DATE
        AND status IN ('confirmed', 'checked-in')
    `
    const occupied = Number(occupiedResult[0].count)

    const vacant = totalProperties - occupied

    const revenueResult = await sql`
      SELECT COALESCE(SUM(paid_amount), 0) as revenue
      FROM public.reservations
      WHERE user_id = ${user.id}
        AND EXTRACT(YEAR FROM check_in) = EXTRACT(YEAR FROM CURRENT_DATE)
    `
    const ytdRealizedRevenue = Number(revenueResult[0].revenue)

    // Calculate occupancy rate
    const occupancyRate = totalProperties > 0 ? Math.round((occupied / totalProperties) * 100) : 0

    const metrics = {
      totalProperties,
      occupied,
      vacant,
      ytdRealizedRevenue,
      occupancyRate,
    }

    console.log("[v0] Dashboard metrics:", metrics)

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("[v0] Error fetching dashboard metrics:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 })
  }
}
