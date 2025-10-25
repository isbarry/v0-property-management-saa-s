import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getUserFromSession } from "@/lib/auth/session"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload photo API called")

    const user = await getUserFromSession()

    if (!user) {
      console.log("[v0] No user session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User ID from session:", user.id)

    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    // Upload to Vercel Blob
    console.log("[v0] Uploading to Vercel Blob...")
    const blob = await put(file.name, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    })

    console.log("[v0] Blob uploaded successfully:", blob.url)

    // Update user profile with new photo URL
    await sql`
      UPDATE users 
      SET photo_url = ${blob.url}
      WHERE id = ${user.id}
    `

    console.log("[v0] User profile updated with photo URL")

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading photo:", error)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}
