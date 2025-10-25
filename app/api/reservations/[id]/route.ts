// Reservations API - Get, Update, Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Reservation } from "@/lib/types/database"

// GET /api/reservations/[id] - Get a single reservation
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reservations = await query<Reservation>("SELECT * FROM reservations WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (reservations.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    return NextResponse.json({ reservation: reservations[0] })
  } catch (error) {
    console.error("[v0] Get reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/reservations/[id] - Update a reservation using edit modal
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params })
}

// PATCH /api/reservations/[id] - Update a reservation
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify reservation ownership
    const existingReservations = await query<Reservation>("SELECT * FROM reservations WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (existingReservations.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      "property_id",
      "tenant_id",
      "guest_name",
      "guest_email",
      "guest_phone",
      "check_in",
      "check_out",
      "number_of_guests",
      "reservation_type",
      "total_amount",
      "paid_amount",
      "status",
      "notes",
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
    const reservations = await query<Reservation>(
      `UPDATE reservations SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values,
    )

    return NextResponse.json({ reservation: reservations[0] })
  } catch (error) {
    console.error("[v0] Update reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/reservations/[id] - Delete a reservation
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM reservations WHERE id = $1 AND user_id = $2 RETURNING id", [
      params.id,
      user.id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete reservation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
