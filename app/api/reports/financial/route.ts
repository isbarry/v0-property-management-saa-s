// Financial Reports API - Generate financial summaries
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET /api/reports/financial - Generate financial report
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build query conditions
    let propertyCondition = "user_id = $1"
    const params: any[] = [user.id]

    if (propertyId) {
      params.push(propertyId)
      propertyCondition += ` AND property_id = $${params.length}`
    }

    let dateCondition = ""
    if (startDate && endDate) {
      params.push(startDate, endDate)
      dateCondition = ` AND payment_date >= $${params.length - 1} AND payment_date <= $${params.length}`
    }

    // Get total income from payments
    const incomeResult = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(*) as payment_count
       FROM payments 
       WHERE ${propertyCondition} AND status = 'completed'${dateCondition}`,
      params,
    )

    // Get total expenses
    const expenseParams = [...params]
    let expenseDateCondition = ""
    if (startDate && endDate) {
      expenseDateCondition = ` AND expense_date >= $${expenseParams.length - 1} AND expense_date <= $${expenseParams.length}`
    }

    const expenseResult = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
       FROM expenses 
       WHERE ${propertyCondition} AND status = 'paid'${expenseDateCondition}`,
      expenseParams,
    )

    // Get expenses by category
    const expensesByCategory = await query(
      `SELECT 
        category,
        COALESCE(SUM(amount), 0) as total
       FROM expenses 
       WHERE ${propertyCondition} AND status = 'paid'${expenseDateCondition}
       GROUP BY category
       ORDER BY total DESC`,
      expenseParams,
    )

    const totalIncome = Number.parseFloat(incomeResult[0]?.total_income || 0)
    const totalExpenses = Number.parseFloat(expenseResult[0]?.total_expenses || 0)
    const netIncome = totalIncome - totalExpenses

    return NextResponse.json({
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: netIncome,
        payment_count: incomeResult[0]?.payment_count || 0,
        expense_count: expenseResult[0]?.expense_count || 0,
      },
      expenses_by_category: expensesByCategory,
    })
  } catch (error) {
    console.error("[v0] Generate financial report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
