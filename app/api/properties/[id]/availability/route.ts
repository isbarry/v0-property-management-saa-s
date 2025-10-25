// Property Availability API - Check availability for a property
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET /api/properties/[id]/availability - Check property availability
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 })
    }

    // Check for overlapping reservations
    const reservations = await query(
      `SELECT * FROM reservations 
       WHERE property_id = $1 
       AND status NOT IN ('cancelled')
       AND (
         (check_in <= $2 AND check_out >= $2) OR
         (check_in <= $3 AND check_out >= $3) OR
         (check_in >= $2 AND check_out <= $3)
       )`,
      [params.id, startDate, endDate],
    )

    // Check for blocked dates
    const blockedDates = await query(
      `SELECT * FROM blocked_dates 
       WHERE property_id = $1 
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [params.id, startDate, endDate],
    )

    const isAvailable = reservations.length === 0 && blockedDates.length === 0

    return NextResponse.json({
      available: isAvailable,
      conflicts: {
        reservations: reservations.length,
        blocked_dates: blockedDates.length,
      },
    })
  } catch (error) {
    console.error("[v0] Check availability error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
