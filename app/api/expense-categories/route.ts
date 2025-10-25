import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

const DEFAULT_CATEGORIES = [
  { id: "default-1", name: "maintenance", display_name: "Maintenance", color: "#3B82F6", is_default: true },
  { id: "default-2", name: "utilities", display_name: "Utilities", color: "#10B981", is_default: true },
  { id: "default-3", name: "insurance", display_name: "Insurance", color: "#F59E0B", is_default: true },
  { id: "default-4", name: "property_tax", display_name: "Property Tax", color: "#EF4444", is_default: true },
  { id: "default-5", name: "hoa_fees", display_name: "HOA Fees", color: "#8B5CF6", is_default: true },
  { id: "default-6", name: "repairs", display_name: "Repairs", color: "#EC4899", is_default: true },
  { id: "default-7", name: "cleaning", display_name: "Cleaning", color: "#14B8A6", is_default: true },
  { id: "default-8", name: "landscaping", display_name: "Landscaping", color: "#84CC16", is_default: true },
  { id: "default-9", name: "marketing", display_name: "Marketing", color: "#F97316", is_default: true },
  { id: "default-10", name: "other", display_name: "Other", color: "#6B7280", is_default: true },
]

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName],
    )
    return result[0]?.exists || false
  } catch (error) {
    return false
  }
}

// GET /api/expense-categories - Get all categories for the user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exists = await tableExists("expense_categories")

    if (!exists) {
      console.log("[v0] expense_categories table doesn't exist, using defaults")
      return NextResponse.json({ categories: DEFAULT_CATEGORIES })
    }

    const categories = await query(
      `SELECT id, name, display_name, color, is_default 
       FROM expense_categories 
       WHERE user_id = $1 
       ORDER BY is_default DESC, display_name ASC`,
      [user.id],
    )

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[v0] Get expense categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/expense-categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, display_name, color } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: "name and display_name are required" }, { status: 400 })
    }

    const exists = await tableExists("expense_categories")

    if (!exists) {
      return NextResponse.json(
        {
          error:
            "Database table not initialized. Please run the migration script: scripts/016_create_expense_categories_table.sql",
        },
        { status: 503 },
      )
    }

    // Convert display name to lowercase snake_case for the name field
    const categoryName = name.toLowerCase().replace(/\s+/g, "_")

    // Check if category already exists
    const existing = await query("SELECT id FROM expense_categories WHERE user_id = $1 AND name = $2", [
      user.id,
      categoryName,
    ])

    if (existing.length > 0) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 })
    }

    const newCategory = await query(
      `INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, name, display_name, color, is_default`,
      [user.id, categoryName, display_name, color || "#6B7280"],
    )

    return NextResponse.json({ category: newCategory[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create expense category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
