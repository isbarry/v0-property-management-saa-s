// Expenses API - List and Create
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"
import type { Expense } from "@/lib/types/database"

// GET /api/expenses - List all expenses
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let queryText = "SELECT * FROM expenses WHERE user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      queryText += ` AND property_id = $${params.length}`
    }

    if (category) {
      params.push(category)
      queryText += ` AND category = $${params.length}`
    }

    if (status) {
      params.push(status)
      queryText += ` AND status = $${params.length}`
    }

    if (startDate) {
      params.push(startDate)
      queryText += ` AND expense_date >= $${params.length}`
    }

    if (endDate) {
      params.push(endDate)
      queryText += ` AND expense_date <= $${params.length}`
    }

    queryText += " ORDER BY expense_date DESC"

    const expenses = await query<Expense>(queryText, params)

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("[v0] Get expenses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/expenses - Create a new expense
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
      receipt_url,
      is_recurring,
      recurring_frequency,
      status,
      notes,
    } = body

    // Validate required fields
    if (!category || !amount || !description || !expense_date) {
      return NextResponse.json(
        { error: "category, amount, description, and expense_date are required" },
        { status: 400 },
      )
    }

    // Validate category
    const validCategories = [
      "maintenance",
      "utilities",
      "insurance",
      "taxes",
      "management_fees",
      "repairs",
      "cleaning",
      "supplies",
      "marketing",
      "legal",
      "other",
    ]
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // If property_id is provided, verify ownership
    if (property_id) {
      const properties = await query("SELECT id FROM properties WHERE id = $1 AND user_id = $2", [property_id, user.id])

      if (properties.length === 0) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 })
      }
    }

    const expenses = await query<Expense>(
      `INSERT INTO expenses (
        user_id, property_id, category, amount, description, vendor,
        payment_method, expense_date, receipt_url, is_recurring,
        recurring_frequency, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        user.id,
        property_id || null,
        category,
        amount,
        description,
        vendor,
        payment_method,
        expense_date,
        receipt_url,
        is_recurring || false,
        recurring_frequency,
        status || "paid",
        notes,
      ],
    )

    return NextResponse.json({ expense: expenses[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
