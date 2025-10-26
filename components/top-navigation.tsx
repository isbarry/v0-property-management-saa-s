"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Sun, Moon, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

interface TopNavigationProps {
  theme: "light" | "dark"
  onToggleTheme: () => void
}

interface UserProfile {
  name: string
  email: string
  photo_url?: string
}

export function TopNavigation({ theme, onToggleTheme }: TopNavigationProps) {
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
    <nav className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Logo Section - Left */}
      <Link href="/dashboard" className="flex items-center gap-[1px]">
        <Image src="/logo.svg" alt="Logo" width={50} height={50} className="h-[50px] w-[50px]" />
        <span className="bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] bg-clip-text text-[22px] font-bold leading-none text-transparent">
          Tabax
        </span>
      </Link>

      {/* Right Section - Profile & Actions */}
      <div className="flex items-center gap-3">
        {/* User Profile Button */}
        <Button variant="ghost" className="h-auto gap-3 p-2" onClick={() => router.push("/profile")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photo_url || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">{user?.name || "User"}</span>
          </div>
        </Button>

        {/* Theme Toggle */}
        <Button variant="outline" size="icon" onClick={onToggleTheme} className="bg-transparent" title="Toggle theme">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Logout Button */}
        <Button variant="outline" size="icon" onClick={handleLogout} className="bg-transparent" title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
