// Login endpoint
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/auth/session"

interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string | null
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login route called")

    const body = await request.json()
    console.log("[v0] Login body received:", { email: body.email })

    const { email, password } = body

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[v0] Invalid email format")
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const sanitizedEmail = email.toLowerCase().trim()
    console.log("[v0] Querying user:", sanitizedEmail)

    let users: UserRow[]
    try {
      users = await sql<UserRow[]>`
        SELECT id, email, name, password_hash 
        FROM public.users 
        WHERE email = ${sanitizedEmail}
      `
      console.log("[v0] Query executed successfully, users found:", users.length)
    } catch (dbError) {
      console.error("[v0] Database query failed:", dbError)
      return NextResponse.json(
        {
          error: "Database connection error",
          details: process.env.NODE_ENV === "development" ? String(dbError) : "Please try again later",
        },
        { status: 503 },
      )
    }

    console.log("[v0] Users found:", users.length)

    if (users.length === 0) {
      console.log("[v0] User not found")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]
    console.log("[v0] User found:", { id: user.id, email: user.email, hasPassword: !!user.password_hash })

    if (!user.password_hash) {
      console.log("[v0] User has no password set (possibly OAuth user)")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if password matches the stored hash (temp_ format for development)
    const expectedPassword = "temp_" + password
    const isValidPassword = user.password_hash === expectedPassword

    console.log("[v0] Password validation result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] Password mismatch")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Creating session for user:", user.id)
    await createSession(user.id)
    console.log("[v0] Session created successfully")

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 },
    )
  }
}
