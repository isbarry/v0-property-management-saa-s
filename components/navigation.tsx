"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
    <nav className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-[1px]">
          <Image src="/logo.svg" alt="Logo" width={40} height={40} className="h-10 w-10" />
          <span className="bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] bg-clip-text text-xl font-bold leading-none text-transparent">
            Tabax
          </span>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Bottom Section - User Profile & Actions */}
      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-2">
          {/* User Profile Button */}
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-3 p-2"
            onClick={() => router.push("/profile")}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photo_url || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start text-left">
              <span className="text-sm font-medium">{user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
            </div>
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleTheme}
              className="flex-1 bg-transparent"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="flex-1 bg-transparent"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
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
