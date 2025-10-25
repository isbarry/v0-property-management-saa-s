// Password hashing utilities using Web Crypto API for better Next.js compatibility
import { crypto } from "crypto"

const ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = "SHA-256"

export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Convert password to buffer
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"])

  // Derive the key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  )

  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  // Convert to base64
  return btoa(String.fromCharCode(...combined))
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = Uint8Array.from(atob(hashedPassword), (c) => c.charCodeAt(0))

    // Extract salt and hash
    const salt = combined.slice(0, 16)
    const storedHash = combined.slice(16)

    // Convert password to buffer
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    // Import the password as a key
    const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"])

    // Derive the key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: DIGEST,
      },
      keyMaterial,
      KEY_LENGTH * 8,
    )

    const derivedHash = new Uint8Array(derivedBits)

    // Compare hashes
    if (derivedHash.length !== storedHash.length) {
      return false
    }

    for (let i = 0; i < derivedHash.length; i++) {
      if (derivedHash[i] !== storedHash[i]) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
