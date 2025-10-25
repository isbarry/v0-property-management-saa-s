// Rate limit middleware for API routes
import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, type RateLimitConfig } from "@/lib/rate-limit"

export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  ...args: any[]
): Promise<NextResponse> {
  // Get identifier from IP address or user agent
  const identifier =
    request.ip || request.headers.get("x-forwarded-for") || request.headers.get("user-agent") || "anonymous"

  const result = await rateLimit(identifier, config)

  // Add rate limit headers
  const headers = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  }

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers,
      },
    )
  }

  // Call the handler
  const response = await handler(request, ...args)

  // Add rate limit headers to successful response
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}
