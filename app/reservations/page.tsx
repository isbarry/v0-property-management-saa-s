"use client"

import { useEffect, useState } from "react"
import { EnhancedReservationTable } from "@/components/reservations/enhanced-reservation-table"
import { MasterTimelineCalendar } from "@/components/reservations/master-timeline-calendar"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching reservations data...")
      const [reservationsRes, propertiesRes, tenantsRes, blockedRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/properties"),
        fetch("/api/tenants"),
        fetch("/api/blocked-dates"),
      ])

      const reservationsData = await reservationsRes.json()
      const propertiesData = await propertiesRes.json()
      const tenantsData = await tenantsRes.json()
      const blockedData = await blockedRes.json()

      console.log("[v0] Reservations data loaded")
      setReservations(reservationsData.reservations || [])
      setProperties(propertiesData.properties || [])
      setTenants(tenantsData.tenants || [])
      setBlockedDates(blockedData.blocked_dates || []) // Fixed case mismatch - API returns blocked_dates not blockedDates
    } catch (error) {
      console.error("[v0] Error fetching reservations data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const handleRefresh = () => {
      fetchData()
    }

    window.addEventListener("refreshReservations", handleRefresh)

    return () => {
      window.removeEventListener("refreshReservations", handleRefresh)
    }
  }, [])

  const reservationsSkeleton = (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-12 flex-1 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return reservationsSkeleton
  }

  return (
    <MinimumLoadingWrapper minimumMs={1000} loadingContent={reservationsSkeleton}>
      <div className="mx-auto max-w-7xl space-y-6 p-6" data-onboarding="reservations-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Reservations</h1>
            <p className="text-sm text-muted-foreground">Manage property reservations and bookings</p>
          </div>
        </div>

        <MasterTimelineCalendar reservations={reservations} properties={properties} blockedDates={blockedDates} />

        <EnhancedReservationTable reservations={reservations} properties={properties} tenants={tenants} />
      </div>
    </MinimumLoadingWrapper>
  )
}
