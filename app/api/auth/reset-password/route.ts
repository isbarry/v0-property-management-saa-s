import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

interface UserRow {
  id: string
  email: string
  reset_token_expiry: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find user with valid reset token
    const users = await sql<UserRow[]>`
      SELECT id, email, reset_token_expiry 
      FROM public.users 
      WHERE reset_token = ${token}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const user = users[0]

    // Check if token is expired
    const tokenExpiry = new Date(user.reset_token_expiry)
    if (tokenExpiry < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Update password (using the same temp_ prefix as the current system)
    const newPasswordHash = "temp_" + password

    await sql`
      UPDATE public.users 
      SET 
        password_hash = ${newPasswordHash},
        reset_token = NULL,
        reset_token_expiry = NULL
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
