"use client"

import { useEffect, useState } from "react"
import { TenantsTab } from "@/components/tenants/tenants-tab"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [reservations, setReservations] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("[v0] Fetching tenants data...")
        const [tenantsRes, reservationsRes, propertiesRes] = await Promise.all([
          fetch("/api/tenants"),
          fetch("/api/reservations"),
          fetch("/api/properties"),
        ])

        const tenantsData = await tenantsRes.json()
        const reservationsData = await reservationsRes.json()
        const propertiesData = await propertiesRes.json()

        console.log("[v0] Tenants data loaded")
        setTenants(tenantsData.tenants || [])
        setReservations(reservationsData.reservations || [])
        setProperties(propertiesData.properties || [])
      } catch (error) {
        console.error("[v0] Error fetching tenants data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const tenantsSkeleton = (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-16 flex-1 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return tenantsSkeleton
  }

  return (
    <MinimumLoadingWrapper minimumMs={1000} loadingContent={tenantsSkeleton}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Tenants</h1>
            <p className="text-sm text-muted-foreground">Manage tenant information and rental history</p>
          </div>
        </div>

        <TenantsTab tenants={tenants} reservations={reservations} properties={properties} />
      </div>
    </MinimumLoadingWrapper>
  )
}
