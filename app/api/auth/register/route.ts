import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import type { User } from "@/lib/types/database"
import { createAPIHandler } from "@/lib/api-wrapper"
import { rateLimitConfigs } from "@/lib/rate-limit"
import { validateEmail, sanitizeString } from "@/lib/middleware/input-validation"

async function registerHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email.toLowerCase())
    const sanitizedFullName = sanitizeString(full_name)

    const existingUsers = await query<User>("SELECT id FROM users WHERE email = $1", [sanitizedEmail])

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const users = await query<User>(
      "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING *",
      [sanitizedEmail, passwordHash, sanitizedFullName],
    )

    const user = users[0]
    const sessionToken = await createSession(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    })

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = createAPIHandler(registerHandler, rateLimitConfigs.auth)
