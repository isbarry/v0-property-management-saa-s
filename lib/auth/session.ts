"use server"

// Session management utilities
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import type { Session } from "@/lib/types/database"

const SESSION_COOKIE_NAME = "session_id"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

const DISABLE_AUTH = false // Set to false to re-enable authentication

export async function generateSessionId(): Promise<string> {
  // Generate a random session ID without crypto
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  const randomPart3 = Math.random().toString(36).substring(2, 15)

  return `${timestamp}-${randomPart}${randomPart2}${randomPart3}`
}

export async function createSession(userId: string): Promise<string> {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }

    const sessionId = await generateSessionId()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    await sql`
      INSERT INTO sessions (id, user_id, expires_at) 
      VALUES (${sessionId}, ${userId}, ${expiresAt})
    `

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    return sessionId
  } catch (error) {
    console.error("Failed to create session:", error)
    throw new Error("Failed to create session")
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionId) {
      return null
    }

    // Retry logic for rate limiting
    let retries = 3
    let delay = 1000 // Start with 1 second delay

    while (retries > 0) {
      try {
        const sessions = await sql`
          SELECT * FROM sessions 
          WHERE id = ${sessionId} AND expires_at > NOW()
        `

        if (sessions.length === 0) {
          // Session expired or doesn't exist
          await deleteSession()
          return null
        }

        return sessions[0] as Session
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error?.message?.includes("Too Many Requests") || error?.message?.includes("429")) {
          retries--
          if (retries > 0) {
            console.log(`[v0] Rate limited, retrying in ${delay}ms... (${retries} retries left)`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            delay *= 2 // Exponential backoff
            continue
          }
        }
        throw error
      }
    }

    throw new Error("Failed to get session after multiple retries")
  } catch (error: any) {
    // Handle rate limiting errors gracefully
    if (error?.message?.includes("Too Many Requests") || error?.message?.includes("429")) {
      console.error("Rate limit exceeded. Please try again in a few moments.")
      return null
    }
    console.error("Failed to get session:", error)
    return null
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionId) {
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    }

    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch (error) {
    console.error("Failed to delete session:", error)
    // Still delete the cookie even if DB deletion fails
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`DELETE FROM sessions WHERE expires_at < NOW()`
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error)
  }
}

export async function getUserFromSession(): Promise<{
  id: string
  email: string
  name: string
} | null> {
  if (DISABLE_AUTH) {
    return {
      id: "dev-user-123",
      email: "dev@example.com",
      name: "Development User",
    }
  }

  try {
    const session = await getSession()

    if (!session) {
      return null
    }

    // Retry logic for rate limiting
    let retries = 3
    let delay = 1000

    while (retries > 0) {
      try {
        const users = await sql`
          SELECT id, email, name 
          FROM public.users 
          WHERE id = ${session.user_id}
        `

        return users.length > 0 ? users[0] : null
      } catch (error: any) {
        if (error?.message?.includes("Too Many Requests") || error?.message?.includes("429")) {
          retries--
          if (retries > 0) {
            console.log(`[v0] Rate limited, retrying in ${delay}ms... (${retries} retries left)`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            delay *= 2
            continue
          }
        }
        throw error
      }
    }

    throw new Error("Failed to get user after multiple retries")
  } catch (error: any) {
    if (error?.message?.includes("Too Many Requests") || error?.message?.includes("429")) {
      console.error("Rate limit exceeded. Please try again in a few moments.")
      return null
    }
    console.error("Failed to get user from session:", error)
    return null
  }
}

export const getUser = getUserFromSession
