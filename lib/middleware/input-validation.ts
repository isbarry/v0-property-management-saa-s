// Input validation and sanitization utilities
export function sanitizeString(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateDate(date: string): boolean {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

export function validateAmount(amount: number): boolean {
  return typeof amount === "number" && amount >= 0 && Number.isFinite(amount)
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]) as any
    }
  }
  return sanitized
}
