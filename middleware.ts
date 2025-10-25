// Global middleware for Next.js
import { type NextRequest, NextResponse } from "next/server"
import { addSecurityHeaders } from "@/lib/middleware/security-headers"
import { handleCORSPreflight, withCORS } from "@/lib/middleware/cors-middleware"

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const preflightResponse = handleCORSPreflight(request)
  if (preflightResponse) {
    return addSecurityHeaders(preflightResponse)
  }

  // Continue with the request
  const response = NextResponse.next()

  // Add security headers
  addSecurityHeaders(response)

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    withCORS(response, request)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
