"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Reservation, Property, Tenant } from "@/lib/types/database"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getReservationTypeColor } from "@/lib/utils/reservation-colors"

interface ReservationTimelineProps {
  reservations: Reservation[]
  properties: Property[]
  tenants: Tenant[]
  blockedDates: any[]
  onReady?: () => void // Added onReady callback prop
}

type ViewMode = "week" | "month"

export function ReservationTimeline({
  reservations,
  properties,
  tenants,
  blockedDates,
  onReady,
}: ReservationTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const hasCalledReady = useRef(false)

  useEffect(() => {
    if (reservations && properties && tenants && blockedDates && onReady && !hasCalledReady.current) {
      hasCalledReady.current = true
      onReady()
    }
  }, [reservations, properties, tenants, blockedDates, onReady])

  const getDateRange = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())

    const days = viewMode === "week" ? 7 : 30
    const dates: Date[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const dateRange = useMemo(() => getDateRange(), [currentDate, viewMode])

  const isDateInRange = (date: string, checkIn: string, checkOut: string) => {
    const d = new Date(date)
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return d >= start && d <= end
  }

  const getReservationForProperty = (propertyId: number, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const reservation = reservations.find(
      (r) => r.property_id === propertyId && isDateInRange(dateStr, r.check_in, r.check_out),
    )
    const blocked = getBlockedDatesForProperty(propertyId, date)
    return reservation
  }

  const isPropertyAvailable = (propertyId: number, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const hasReservation = reservations.some(
      (r) => r.property_id === propertyId && isDateInRange(dateStr, r.check_in, r.check_out),
    )
    const property = properties.find((p) => p.id === propertyId)
    const isUnderMaintenance = property?.status === "maintenance"
    const dayBlocked = getBlockedDatesForProperty(propertyId, date)
    const isBlocked = dayBlocked.length > 0
    return !hasReservation && !isUnderMaintenance && !isBlocked
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    const days = viewMode === "week" ? 7 : 30
    newDate.setDate(newDate.getDate() + (direction === "next" ? days : -days))
    setCurrentDate(newDate)
  }

  const getReservationColor = (reservationType: string | null) => {
    const colors = getReservationTypeColor(reservationType)
    return colors.bg
  }

  const getBlockedDatesForProperty = (propertyId: number, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return blockedDates.filter((blocked) => {
      if (blocked.property_id !== propertyId) return false
      const startDate = new Date(blocked.start_date).toISOString().split("T")[0]
      const endDate = new Date(blocked.end_date).toISOString().split("T")[0]
      return dateStr >= startDate && dateStr <= endDate
    })
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sans text-xl font-semibold text-foreground">Reservation Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-md border border-border bg-background p-1">
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="h-7 px-3 text-xs"
              >
                This Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="h-7 px-3 text-xs"
              >
                This Month
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with dates */}
              <div className="mb-2 flex">
                <div className="w-48 shrink-0" />
                <div className="flex flex-1 gap-1">
                  {dateRange.map((date, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className="text-xs font-medium text-muted-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline rows */}
              <div className="space-y-2">
                {properties.map((property) => {
                  const isUnderMaintenance = property.status === "maintenance"
                  return (
                    <div key={property.id} className="flex items-center">
                      <div className="w-48 shrink-0 pr-4">
                        <div className="text-sm font-medium text-foreground">{property.unit_name || property.name}</div>
                        {property.property_name && (
                          <div className="text-xs text-muted-foreground">{property.property_name}</div>
                        )}
                      </div>
                      <div className="relative flex flex-1 gap-1">
                        {dateRange.map((date, i) => {
                          const reservation = getReservationForProperty(property.id, date)
                          const dayBlocked = getBlockedDatesForProperty(property.id, date)
                          const isBlocked = dayBlocked.length > 0
                          const isAvailable = isPropertyAvailable(property.id, date)

                          const bgColor = isBlocked
                            ? "bg-destructive"
                            : isUnderMaintenance
                              ? "bg-gray-200 dark:bg-gray-800"
                              : reservation
                                ? getReservationColor(reservation.reservation_type)
                                : "bg-muted/20"

                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`relative flex-1 ${bgColor} ${
                                    isBlocked
                                      ? ""
                                      : isUnderMaintenance
                                        ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]"
                                        : ""
                                  } h-12 rounded-sm border border-border/50 cursor-pointer hover:opacity-80 transition-opacity`}
                                  style={
                                    isBlocked
                                      ? {
                                          backgroundImage:
                                            "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)",
                                        }
                                      : undefined
                                  }
                                >
                                  {!isBlocked && reservation && (
                                    <div className="absolute inset-0 flex items-center justify-center px-1">
                                      <span className="text-[10px] font-medium text-foreground truncate">
                                        {reservation.guest_name.split(" ")[0]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                {isBlocked ? (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-destructive">Blocked</p>
                                    <p className="text-sm">Property: {property.unit_name || property.name}</p>
                                    <p className="text-sm">Date: {date.toLocaleDateString()}</p>
                                    {dayBlocked[0].reason && <p className="text-sm">Reason: {dayBlocked[0].reason}</p>}
                                    {dayBlocked[0].notes && <p className="text-sm">Notes: {dayBlocked[0].notes}</p>}
                                  </div>
                                ) : isUnderMaintenance ? (
                                  <div className="space-y-1">
                                    <p className="font-semibold">Under Maintenance</p>
                                    <p className="text-sm">Property: {property.unit_name || property.name}</p>
                                    <p className="text-sm">Until: {property.maintenance_end_date || "TBD"}</p>
                                  </div>
                                ) : reservation ? (
                                  <div className="space-y-1">
                                    <p className="font-semibold">{reservation.guest_name}</p>
                                    <p className="text-sm">Property: {property.unit_name || property.name}</p>
                                    {reservation.reservation_type && (
                                      <p className="text-sm capitalize">Type: {reservation.reservation_type}</p>
                                    )}
                                    <p className="text-sm">
                                      Check-in: {new Date(reservation.check_in).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm">
                                      Check-out: {new Date(reservation.check_out).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm">Status: {reservation.status}</p>
                                    <p className="text-sm">Total: GMD {reservation.total_amount}</p>
                                    {reservation.guest_email && (
                                      <p className="text-sm">Email: {reservation.guest_email}</p>
                                    )}
                                    {reservation.guest_phone && (
                                      <p className="text-sm">Phone: {reservation.guest_phone}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-green-600 dark:text-green-400">Available</p>
                                    <p className="text-sm">Property: {property.unit_name || property.name}</p>
                                    <p className="text-sm">Date: {date.toLocaleDateString()}</p>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
