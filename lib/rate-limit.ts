// Rate limiting utility using in-memory store
type RateLimitStore = {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    }
  },
  5 * 60 * 1000,
)

export type RateLimitConfig = {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the interval
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const now = Date.now()
  const key = `rate_limit:${identifier}`

  // Get or create rate limit entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + config.interval,
    }
  }

  const entry = store[key]
  entry.count++

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
  }
}

// Preset rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Standard limits for API endpoints
  api: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Generous limits for read operations
  read: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Stricter limits for write operations
  write: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
}
