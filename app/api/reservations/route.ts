// Reservations API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Reservation, Tenant } from "@/lib/types/database"

// GET /api/reservations - List all reservations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let queryText = "SELECT * FROM reservations WHERE user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      queryText += ` AND property_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      queryText += ` AND status = $${params.length}`
    }

    if (startDate) {
      params.push(startDate)
      queryText += ` AND check_out >= $${params.length}`
    }

    if (endDate) {
      params.push(endDate)
      queryText += ` AND check_in <= $${params.length}`
    }

    queryText += " ORDER BY check_in DESC"

    const reservations = await query<Reservation>(queryText, params)

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error("[v0] Get reservations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/reservations - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Received reservation data:", body)

    const {
      property_id,
      tenant_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      number_of_guests,
      reservation_type,
      total_amount,
      paid_amount,
      status,
      notes,
    } = body

    // Validate required fields - check for undefined/null instead of falsy values
    if (
      property_id === undefined ||
      property_id === null ||
      !guest_name ||
      !guest_email ||
      !guest_phone ||
      !check_in ||
      !check_out ||
      total_amount === undefined ||
      total_amount === null
    ) {
      console.error("[v0] Missing required fields:", {
        property_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        total_amount,
      })
      return NextResponse.json(
        {
          error:
            "property_id, guest_name, guest_email, guest_phone, check_in, check_out, and total_amount are required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Verifying property ownership...")
    // Verify property ownership
    const properties = await query("SELECT id FROM properties WHERE id = $1 AND user_id = $2", [property_id, user.id])

    if (properties.length === 0) {
      console.error("[v0] Property not found or not owned by user")
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    console.log("[v0] Checking for existing tenant with phone:", guest_phone)
    let finalTenantId = tenant_id

    if (!finalTenantId && guest_phone) {
      const existingTenants = await query<Tenant>("SELECT * FROM tenants WHERE user_id = $1 AND phone = $2 LIMIT 1", [
        user.id,
        guest_phone,
      ])

      if (existingTenants.length > 0) {
        // Tenant exists, use their ID
        finalTenantId = existingTenants[0].id
        console.log("[v0] Found existing tenant with ID:", finalTenantId)
      } else {
        // Create new tenant
        console.log("[v0] Creating new tenant record...")

        // Split guest_name into first_name and last_name
        const nameParts = guest_name.trim().split(/\s+/)
        const first_name = nameParts[0] || guest_name
        const last_name = nameParts.slice(1).join(" ") || ""

        const newTenants = await query<Tenant>(
          `INSERT INTO tenants (
            user_id, property_id, first_name, last_name, email, phone, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [user.id, property_id, first_name, last_name, guest_email, guest_phone, "active"],
        )

        finalTenantId = newTenants[0].id
        console.log("[v0] Created new tenant with ID:", finalTenantId)
      }
    }

    console.log("[v0] Checking for reservation conflicts...")
    // Check for conflicts with existing reservations
    const conflicts = await query(
      `SELECT * FROM reservations 
       WHERE property_id = $1 
       AND status NOT IN ('cancelled')
       AND (
         (check_in <= $2 AND check_out >= $2) OR
         (check_in <= $3 AND check_out >= $3) OR
         (check_in >= $2 AND check_out <= $3)
       )`,
      [property_id, check_in, check_out],
    )

    if (conflicts.length > 0) {
      console.error("[v0] Reservation conflict found:", conflicts)
      return NextResponse.json({ error: "Property is not available for the selected dates" }, { status: 409 })
    }

    console.log("[v0] Checking for blocked dates...")
    // Check for blocked dates
    const blockedDates = await query(
      `SELECT * FROM blocked_dates 
       WHERE property_id = $1 
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [property_id, check_in, check_out],
    )

    if (blockedDates.length > 0) {
      console.error("[v0] Blocked dates found:", blockedDates)
      return NextResponse.json({ error: "Property is blocked for the selected dates" }, { status: 409 })
    }

    console.log("[v0] Creating reservation in database with tenant_id:", finalTenantId)
    const reservations = await query<Reservation>(
      `INSERT INTO reservations (
        user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
        check_in, check_out, number_of_guests, reservation_type,
        total_amount, paid_amount, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        user.id,
        property_id,
        finalTenantId || null,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        number_of_guests || 1,
        reservation_type || "short-term",
        total_amount,
        paid_amount || 0,
        status || "confirmed",
        notes,
      ],
    )

    const newReservation = reservations[0]
    console.log("[v0] Reservation created successfully:", newReservation)

    if (paid_amount && Number(paid_amount) > 0) {
      console.log("[v0] Creating payment record for reservation...")
      try {
        await query(
          `INSERT INTO payments (
            user_id, property_id, reservation_id, tenant_id, amount, 
            payment_date, payment_method, payment_type, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user.id,
            property_id,
            newReservation.id,
            finalTenantId || null,
            paid_amount,
            new Date().toISOString().split("T")[0], // Today's date
            "other", // Default payment method
            "rent", // Payment type for reservation
            "paid", // Status
          ],
        )
        console.log("[v0] Payment record created successfully")
      } catch (paymentError) {
        console.error("[v0] Error creating payment record:", paymentError)
        // Don't fail the reservation creation if payment record fails
      }
    }

    return NextResponse.json({ reservation: newReservation }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
