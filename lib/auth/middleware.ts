// Authentication middleware
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "./session"

export async function requireAuth(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
  }

  return null // Continue to route handler
}

export function withAuth(
  handler: (request: NextRequest, context: { params: any; userId: string }) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: { params: any }) => {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    return handler(request, { ...context, userId: session.user_id })
  }
}
