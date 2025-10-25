// API wrapper utility to combine middleware
import { type NextRequest, NextResponse } from "next/server"
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware"
import type { RateLimitConfig } from "@/lib/rate-limit"

type APIHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>

export function createAPIHandler(handler: APIHandler, rateLimitConfig?: RateLimitConfig) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Apply rate limiting if config is provided
      if (rateLimitConfig) {
        return await withRateLimit(request, rateLimitConfig, handler, ...args)
      }

      // Call handler directly if no rate limiting
      return await handler(request, ...args)
    } catch (error) {
      console.error("[v0] API handler error:", error)
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "An unexpected error occurred",
        },
        { status: 500 },
      )
    }
  }
}
