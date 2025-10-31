"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "")
  }, [searchParams])

  const handleSearch = (value: string) => {
    setSearchValue(value)

    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const getPlaceholder = () => {
    if (pathname.includes("/properties")) {
      return "Search properties..."
    } else if (pathname.includes("/reservations")) {
      return "Search reservations..."
    }
    return "Search..."
  }

  // Only show search on properties and reservations pages
  if (!pathname.includes("/properties") && !pathname.includes("/reservations")) {
    return null
  }

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={getPlaceholder()}
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 bg-background"
      />
    </div>
  )
}
