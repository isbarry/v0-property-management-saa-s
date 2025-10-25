// CORS middleware for API routes
import { type NextRequest, NextResponse } from "next/server"

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "https://your-production-domain.com", // Replace with your production domain
]

export function withCORS(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin")

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Max-Age", "86400") // 24 hours

  return response
}

export function handleCORSPreflight(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 })
    return withCORS(response, request)
  }
  return null
}
