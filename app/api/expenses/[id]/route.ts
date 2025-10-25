// Expenses API - Get, Update, Delete by ID
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Expense } from "@/lib/types/database"

// GET /api/expenses/[id] - Get a single expense
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expenses = await query<Expense>("SELECT * FROM expenses WHERE id = $1 AND user_id = $2", [params.id, user.id])

    if (expenses.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ expense: expenses[0] })
  } catch (error) {
    console.error("[v0] Get expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/expenses/[id] - Update an expense
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingExpenses = await query<Expense>("SELECT * FROM expenses WHERE id = $1 AND user_id = $2", [
      params.id,
      user.id,
    ])

    if (existingExpenses.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      "property_id",
      "category",
      "amount",
      "description",
      "vendor",
      "payment_method",
      "expense_date",
      "receipt_url",
      "is_recurring",
      "recurring_frequency",
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
    const expenses = await query<Expense>(
      `UPDATE expenses SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values,
    )

    return NextResponse.json({ expense: expenses[0] })
  } catch (error) {
    console.error("[v0] Update expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id", [params.id, user.id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
