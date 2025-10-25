import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth/session"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("[v0] Change password API called")
    const user = await getUser()
    if (!user) {
      console.log("[v0] No user session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const { current_password, new_password } = await request.json()

    if (!current_password || !new_password) {
      console.log("[v0] Missing password fields")
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (new_password.length < 8) {
      console.log("[v0] New password too short")
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    console.log("[v0] Fetching user password from database")
    const users = await sql`
      SELECT password_hash FROM public.users WHERE id = ${user.id}
    `
    console.log("[v0] Query result:", users.length, "users found")

    if (users.length === 0) {
      console.log("[v0] User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!users[0].password_hash) {
      console.log("[v0] User has no password set (OAuth user?)")
      return NextResponse.json(
        {
          error:
            "Cannot change password for accounts created with social login. Please use your social provider to manage your account.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Verifying current password")
    const expectedPassword = "temp_" + current_password
    if (users[0].password_hash !== expectedPassword) {
      console.log("[v0] Current password is incorrect")
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    console.log("[v0] Updating password in database")
    const newPasswordHash = "temp_" + new_password
    await sql`
      UPDATE public.users 
      SET password_hash = ${newPasswordHash}
      WHERE id = ${user.id}
    `

    console.log("[v0] Password changed successfully")
    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json(
      {
        error: "Failed to change password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
