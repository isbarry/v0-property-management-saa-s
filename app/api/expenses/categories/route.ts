// Expense Categories API
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET /api/expenses/categories - Get all expense categories with usage counts
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get categories with their usage counts
    const categories = await query<{ category: string; count: number; total_amount: string }>(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM expenses
       WHERE user_id = $1 AND category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC`,
      [user.id],
    )

    // Define default categories
    const defaultCategories = [
      "Maintenance",
      "Utilities",
      "Insurance",
      "Property Tax",
      "HOA Fees",
      "Repairs",
      "Cleaning",
      "Landscaping",
      "Property Management",
      "Marketing",
      "Legal Fees",
      "Accounting",
      "Supplies",
      "Other",
    ]

    // Merge default categories with user's categories
    const allCategories = [...new Set([...defaultCategories, ...categories.map((c) => c.category)])]

    return NextResponse.json({
      categories: allCategories,
      usage: categories,
    })
  } catch (error) {
    console.error("[v0] Get expense categories error:", error)
    return NextResponse.json({ error: "Failed to fetch expense categories" }, { status: 500 })
  }
}
