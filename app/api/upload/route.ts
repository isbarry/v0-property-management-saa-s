import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_FILE_SIZE = 4.5 * 1024 * 1024 // 4.5MB in bytes (Vercel Function limit)

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not set in environment variables")
      return NextResponse.json(
        {
          error:
            "Blob storage is not configured. Please ensure BLOB_READ_WRITE_TOKEN is set in your environment variables.",
          details: "Missing BLOB_READ_WRITE_TOKEN",
        },
        { status: 500 },
      )
    }

    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB` },
        { status: 413 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB` },
        { status: 413 },
      )
    }

    console.log("[v0] Upload attempt:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      environment: process.env.NODE_ENV,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    })

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] Upload successful:", {
      url: blob.url,
      fileName: file.name,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Upload error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : { message: "Unknown error" }

    console.error("[v0] Detailed error info:", errorDetails)

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 },
    )
  }
}
