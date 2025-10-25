import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

// GET user profile
export async function GET() {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profiles = await sql`
      SELECT id, email, name, photo_url, phone, bio, company, role, created_at
      FROM public.users 
      WHERE id = ${user.id}
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(profiles[0])
  } catch (error) {
    console.error("Failed to get user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, bio, company, photo_url } = body

    const updates: Record<string, any> = {}

    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (bio !== undefined) updates.bio = bio
    if (company !== undefined) updates.company = company
    if (photo_url !== undefined) updates.photo_url = photo_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const setClauses = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ")
    const values = Object.values(updates)

    const result = await sql.query(
      `UPDATE public.users 
       SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length + 1}
       RETURNING id, email, name, photo_url, phone, bio, company, role, created_at`,
      [...values, user.id],
    )

    console.log("[v0] Update result:", result)
    console.log("[v0] Update result.rows:", result.rows)

    const updatedUser = result.rows?.[0] || result[0]

    if (!updatedUser) {
      console.error("[v0] No user returned from update")
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Failed to update user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
