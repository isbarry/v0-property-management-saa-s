// Database connection utility using Neon serverless driver
import { neon } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set")
}

console.log("[v0] Database connection string configured:", connectionString ? "✓" : "✗")

// Create a SQL client using the Neon serverless driver
export const sql = neon(connectionString, {
  fetchOptions: {
    cache: "no-store",
  },
})

// Helper function to execute queries with error handling
export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    console.log("[v0] Executing query:", queryText.substring(0, 100))

    // Use sql.query() for parameterized queries with placeholders ($1, $2, etc.)
    const result = await sql.query(queryText, params)

    console.log("[v0] Query result type:", typeof result)
    console.log("[v0] Query result keys:", result ? Object.keys(result) : "null")

    // The Neon serverless driver returns an object with rows, fields, rowCount, etc.
    if (result && Array.isArray(result.rows)) {
      return result.rows as T[]
    }

    // If result.rows doesn't exist but result is an array, return it directly
    if (Array.isArray(result)) {
      return result as T[]
    }

    console.error("[v0] Unexpected query result format:", result)
    return []
  } catch (error) {
    console.error("[v0] Database query error:", error)
    console.error("[v0] Query:", queryText)
    console.error("[v0] Params:", params)

    if (error instanceof Error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    throw new Error(`Database query failed: ${String(error)}`)
  }
}

// Helper function for transactions
export async function transaction<T>(callback: (sql: typeof query) => Promise<T>): Promise<T> {
  try {
    return await callback(query)
  } catch (error) {
    console.error("[v0] Transaction error:", error)
    throw error
  }
}
