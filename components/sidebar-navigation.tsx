"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, DollarSign, Building2, ChevronDown, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/reservations", label: "Reservations", icon: Calendar },
  { href: "/tenants", label: "Tenants", icon: Users },
  {
    href: "/financials",
    label: "Financials",
    icon: DollarSign,
    submenu: [
      { href: "/financials", label: "Overview" },
      { href: "/financials/revenue", label: "Revenue" },
      { href: "/financials/expenses", label: "Expenses" },
    ],
  },
  {
    href: "/leases",
    label: "Leases / Contracts",
    icon: FileText,
    submenu: [
      { href: "/leases", label: "Active Leases" },
      { href: "/leases/expired", label: "Expired Leases" },
      { href: "/leases/templates", label: "Templates" },
    ],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    submenu: [
      { href: "/settings/user-roles", label: "User Roles & Permissions" },
      { href: "/settings/notifications", label: "Notifications" },
      { href: "/settings/integrations", label: "Integrations" },
    ],
  },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const [openSubmenus, setOpenSubmenus] = useState<string[]>(() => {
    const initial: string[] = []
    if (pathname.startsWith("/financials")) initial.push("/financials")
    if (pathname.startsWith("/leases")) initial.push("/leases")
    if (pathname.startsWith("/settings")) initial.push("/settings")
    return initial
  })

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus((prev) => (prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]))
  }

  return (
    <nav className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card">
      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const hasSubmenu = item.submenu && item.submenu.length > 0
          const isSubmenuOpen = openSubmenus.includes(item.href)

          return (
            <div key={item.href}>
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(item.href)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith(item.href) && "text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-300", !isSubmenuOpen && "-rotate-90")}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    isActive && "text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )}

              {hasSubmenu && (
                <div
                  className={cn(
                    "ml-8 overflow-hidden transition-all duration-500 ease-in-out",
                    isSubmenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="mt-1 flex flex-col gap-1">
                    {item.submenu!.map((subItem) => {
                      const isSubActive = pathname === subItem.href

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            "text-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
