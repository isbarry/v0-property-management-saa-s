import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Signup route called")

    const body = await request.json()
    console.log("[v0] Body received:", body)

    const { email, password, fullName } = body

    if (!email || !password || !fullName) {
      console.log("[v0] Validation failed")
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    console.log("[v0] Checking for existing user...")
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `
    console.log("[v0] Existing users check complete:", existingUsers.length)

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    console.log("[v0] Creating user...")
    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email.toLowerCase()}, ${fullName}, ${"temp_" + password})
      RETURNING id, email, name
    `
    console.log("[v0] User created:", result[0])

    console.log("[v0] Creating session...")
    await createSession(result[0].id)
    console.log("[v0] Session created")

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: { id: result[0].id, email: result[0].email, name: result[0].name },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
