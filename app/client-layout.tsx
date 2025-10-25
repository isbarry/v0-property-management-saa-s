"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import { Suspense, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const pathname = usePathname()

  const showNavigation = pathname !== "/"

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {showNavigation && <Navigation theme={theme} onToggleTheme={toggleTheme} />}
      <main className="min-h-screen bg-background">{children}</main>
      <Toaster />
    </Suspense>
  )
}

export { ClientLayout }
