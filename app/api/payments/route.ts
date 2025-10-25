// Payments API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Payment } from "@/lib/types/database"

// GET /api/payments - List all payments
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")
    const reservationId = searchParams.get("reservation_id")
    const status = searchParams.get("status")
    const paymentType = searchParams.get("payment_type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let queryText = "SELECT * FROM payments WHERE user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      queryText += ` AND property_id = $${params.length}`
    }

    if (reservationId) {
      params.push(reservationId)
      queryText += ` AND reservation_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      queryText += ` AND status = $${params.length}`
    }

    if (paymentType) {
      params.push(paymentType)
      queryText += ` AND payment_type = $${params.length}`
    }

    if (startDate) {
      params.push(startDate)
      queryText += ` AND payment_date >= $${params.length}`
    }

    if (endDate) {
      params.push(endDate)
      queryText += ` AND payment_date <= $${params.length}`
    }

    queryText += " ORDER BY payment_date DESC"

    const payments = await query<Payment>(queryText, params)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("[v0] Get payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      reservation_id,
      property_id,
      tenant_id,
      amount,
      payment_method,
      payment_type,
      transaction_id,
      status,
      payment_date,
      notes,
    } = body

    // Validate required fields
    if (!amount || !payment_method || !payment_type || !payment_date) {
      return NextResponse.json(
        { error: "amount, payment_method, payment_type, and payment_date are required" },
        { status: 400 },
      )
    }

    // Validate payment_method
    const validPaymentMethods = ["cash", "credit_card", "debit_card", "bank_transfer", "check", "other"]
    if (!validPaymentMethods.includes(payment_method)) {
      return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 })
    }

    // Validate payment_type
    const validPaymentTypes = ["rent", "deposit", "utility", "maintenance", "other"]
    if (!validPaymentTypes.includes(payment_type)) {
      return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 })
    }

    // If reservation_id is provided, verify ownership and update paid_amount
    if (reservation_id) {
      const reservations = await query("SELECT * FROM reservations WHERE id = $1 AND user_id = $2", [
        reservation_id,
        user.id,
      ])

      if (reservations.length === 0) {
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
      }

      // Update reservation paid_amount
      await query("UPDATE reservations SET paid_amount = paid_amount + $1 WHERE id = $2", [amount, reservation_id])
    }

    const payments = await query<Payment>(
      `INSERT INTO payments (
        user_id, reservation_id, property_id, tenant_id, amount,
        payment_method, payment_type, transaction_id, status, payment_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        user.id,
        reservation_id || null,
        property_id || null,
        tenant_id || null,
        amount,
        payment_method,
        payment_type,
        transaction_id,
        status || "completed",
        payment_date,
        notes,
      ],
    )

    return NextResponse.json({ payment: payments[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
