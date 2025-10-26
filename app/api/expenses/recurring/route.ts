// Recurring Expenses API
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Expense } from "@/lib/types/database"

// GET /api/expenses/recurring - Get all recurring expenses
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recurringExpenses = await query<Expense>(
      `SELECT e.*, p.unit_name, p.building_id
       FROM expenses e
       LEFT JOIN properties p ON e.property_id = p.id
       WHERE e.user_id = $1 AND e.is_recurring = true
       ORDER BY e.expense_date DESC`,
      [user.id],
    )

    return NextResponse.json({ expenses: recurringExpenses })
  } catch (error) {
    console.error("[v0] Get recurring expenses error:", error)
    return NextResponse.json({ error: "Failed to fetch recurring expenses" }, { status: 500 })
  }
}

// POST /api/expenses/recurring - Create a new recurring expense
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      property_id,
      category,
      amount,
      description,
      vendor,
      payment_method,
      expense_date,
      recurring_frequency,
      notes,
    } = body

    if (!category || !amount || !expense_date || !recurring_frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newExpense = await query<Expense>(
      `INSERT INTO expenses (
        user_id, property_id, category, amount, description, vendor,
        payment_method, expense_date, is_recurring, recurring_frequency,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, 'pending', $10)
      RETURNING *`,
      [
        user.id,
        property_id || null,
        category,
        amount,
        description || null,
        vendor || null,
        payment_method || null,
        expense_date,
        recurring_frequency,
        notes || null,
      ],
    )

    return NextResponse.json({ expense: newExpense[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create recurring expense error:", error)
    return NextResponse.json({ error: "Failed to create recurring expense" }, { status: 500 })
  }
}
