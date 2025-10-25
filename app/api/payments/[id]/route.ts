// Payments API - Get, Update, Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Payment } from "@/lib/types/database"

// GET /api/payments/[id] - Get a single payment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payments = await query<Payment>("SELECT * FROM payments WHERE id = $1 AND user_id = $2", [params.id, user.id])

    if (payments.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ payment: payments[0] })
  } catch (error) {
    console.error("[v0] Get payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/payments/[id] - Update a payment
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingPayments = await query<Payment>("SELECT * FROM payments WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (existingPayments.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      "amount",
      "payment_method",
      "payment_type",
      "transaction_id",
      "status",
      "payment_date",
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
    const payments = await query<Payment>(
      `UPDATE payments SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values,
    )

    return NextResponse.json({ payment: payments[0] })
  } catch (error) {
    console.error("[v0] Update payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM payments WHERE id = $1 AND user_id = $2 RETURNING id", [params.id, user.id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
