"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { LayoutDashboard, Calendar, Users, DollarSign, Sun, Moon, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

interface NavigationProps {
  theme: "light" | "dark"
  onToggleTheme: () => void
}

interface UserProfile {
  name: string
  email: string
  photo_url?: string
}

export function Navigation({ theme, onToggleTheme }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    fetchUser()

    const handleProfileUpdate = (event: CustomEvent) => {
      setUser(event.detail)
    }

    window.addEventListener("profile-updated" as any, handleProfileUpdate)
    return () => window.removeEventListener("profile-updated" as any, handleProfileUpdate)
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-[1px]">
              <Image src="/logo.svg" alt="Logo" width={69} height={69} className="h-[69px] w-[69px]" />
              <span className="bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] bg-clip-text text-[1.65rem] font-bold leading-none text-transparent">
                Tabax
              </span>
            </Link>
          </div>

          <div className="flex justify-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={onToggleTheme} className="rounded-full">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full" title="Log out">
              <LogOut className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0"
              onClick={() => router.push("/profile")}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photo_url || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: LayoutDashboard },
  { href: "/reservations", label: "Reservations", icon: Calendar },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/financials", label: "Financials", icon: DollarSign },
]
