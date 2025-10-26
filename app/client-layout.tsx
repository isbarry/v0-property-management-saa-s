"use client"

import type React from "react"
import { TopNavigation } from "@/components/top-navigation"
import { SidebarNavigation } from "@/components/sidebar-navigation"
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
      {showNavigation ? (
        <div className="flex h-screen flex-col overflow-hidden">
          <TopNavigation theme={theme} onToggleTheme={toggleTheme} />
          <div className="flex flex-1 overflow-hidden">
            <SidebarNavigation />
            <main className="ml-64 flex-1 overflow-y-auto bg-background">{children}</main>
          </div>
        </div>
      ) : (
        <main className="min-h-screen bg-background">{children}</main>
      )}
      <Toaster />
    </Suspense>
  )
}

export { ClientLayout }
