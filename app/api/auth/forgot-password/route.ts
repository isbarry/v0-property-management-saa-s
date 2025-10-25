import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import crypto from "crypto"

interface UserRow {
  id: string
  email: string
  name: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const sanitizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const users = await sql<UserRow[]>`
      SELECT id, email, name 
      FROM public.users 
      WHERE email = ${sanitizedEmail}
    `

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions.",
      })
    }

    const user = users[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await sql`
      UPDATE public.users 
      SET 
        reset_token = ${resetToken},
        reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE id = ${user.id}
    `

    // In a production app, you would send an email here
    // For now, we'll log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`
    console.log("[v0] Password reset link for", user.email, ":", resetUrl)

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, user.name, resetUrl)

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
      // In development, include the reset link
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
