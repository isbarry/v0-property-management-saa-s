"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import type { Reservation, Property } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { PropertyCalendarModal } from "./property-calendar-modal"
import { getReservationTypeColor } from "@/lib/utils/reservation-colors"

interface BlockedDate {
  id: number
  property_id: number
  start_date: string
  end_date: string
  reason: string
}

interface MasterTimelineCalendarProps {
  reservations: Reservation[]
  properties: Property[]
  blockedDates: BlockedDate[]
}

export function MasterTimelineCalendar({ reservations, properties, blockedDates }: MasterTimelineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month" | "custom">("week")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const normalizeDate = (date: Date | string): Date => {
    const d = typeof date === "string" ? new Date(date) : new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  const getDaysInView = () => {
    const days: Date[] = []

    if (viewMode === "custom" && customDateRange.from && customDateRange.to) {
      const startDate = new Date(customDateRange.from)
      const endDate = new Date(customDateRange.to)
      const currentDay = new Date(startDate)

      while (currentDay <= endDate) {
        days.push(new Date(currentDay))
        currentDay.setDate(currentDay.getDate() + 1)
      }

      return days
    }

    const startDate = new Date(currentDate)

    if (viewMode === "week") {
      startDate.setDate(startDate.getDate() - startDate.getDay())

      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate)
        day.setDate(startDate.getDate() + i)
        days.push(day)
      }
    } else {
      const year = startDate.getFullYear()
      const month = startDate.getMonth()

      const daysInMonth = new Date(year, month + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i))
      }
    }

    return days
  }

  const navigateView = (direction: "prev" | "next") => {
    if (viewMode === "custom") return

    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getReservationsForProperty = (propertyId: number, date: Date) => {
    const normalizedDate = normalizeDate(date)
    return reservations.filter((r) => {
      if (r.property_id !== propertyId) return false
      const checkIn = normalizeDate(r.check_in)
      const checkOut = normalizeDate(r.check_out)
      return normalizedDate >= checkIn && normalizedDate <= checkOut
    })
  }

  const getBlockedDatesForProperty = (propertyId: number, date: Date) => {
    const normalizedDate = normalizeDate(date)
    return blockedDates.filter((b) => {
      if (b.property_id !== propertyId) return false
      const start = normalizeDate(b.start_date)
      const end = normalizeDate(b.end_date)
      return normalizedDate >= start && normalizedDate <= end
    })
  }

  const handlePropertyClick = (propertyId: number) => {
    setSelectedPropertyId(propertyId)
    setIsModalOpen(true)
  }

  const handleCustomDateSelect = (range: any) => {
    if (range?.from) {
      if (range?.to) {
        setCustomDateRange({ from: range.from, to: range.to })
        setViewMode("custom")
      } else {
        setCustomDateRange({ from: range.from, to: range.from })
      }
    }
  }

  const handleViewModeChange = (mode: "week" | "month" | "custom") => {
    setViewMode(mode)
    if (mode !== "custom") {
      setCustomDateRange({ from: undefined, to: undefined })
    }
  }

  const days = getDaysInView()

  const getDisplayTitle = () => {
    if (viewMode === "custom" && customDateRange.from && customDateRange.to) {
      return `${customDateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${customDateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const handleDateCellClick = (propertyId: number, date: Date) => {
    setSelectedPropertyId(propertyId)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Trigger a custom event to refresh data in the parent page
    window.dispatchEvent(new CustomEvent("refreshReservations"))
  }

  console.log("[v0] Master Timeline - Total blocked dates:", blockedDates.length)
  if (blockedDates.length > 0) {
    console.log("[v0] Master Timeline - Blocked dates:", blockedDates)
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans text-xl font-semibold text-foreground">
              Master Timeline - {getDisplayTitle()}
            </CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("week")}
                  className="h-7"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("month")}
                  className="h-7"
                >
                  Month
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={viewMode === "custom" ? "default" : "ghost"} size="sm" className="h-7">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      Custom
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={
                        customDateRange.from && customDateRange.to
                          ? { from: customDateRange.from, to: customDateRange.to }
                          : undefined
                      }
                      onSelect={handleCustomDateSelect}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateView("prev")}
                  className="h-8 w-8"
                  disabled={viewMode === "custom"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateView("next")}
                  className="h-8 w-8"
                  disabled={viewMode === "custom"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Date Headers */}
              <div className="flex border-b border-border">
                <div className="w-48 shrink-0 border-r border-border p-2">
                  <span className="text-xs font-medium text-muted-foreground">Property</span>
                </div>
                <div className="flex flex-1 gap-1">
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex min-w-[40px] flex-1 flex-col items-center justify-center border-r border-border p-2 last:border-r-0"
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{day.getDate()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {properties.map((property) => (
                <div key={property.id} className="flex border-b border-border" style={{ height: "60px" }}>
                  <div
                    className="flex w-48 shrink-0 cursor-pointer items-center border-r border-border p-2 transition-colors hover:bg-accent"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="flex flex-col truncate">
                      <span className="truncate text-sm font-medium text-foreground hover:text-primary">
                        {property.unit_name || property.name}
                      </span>
                      {property.property_name && (
                        <span className="truncate text-xs text-muted-foreground">{property.property_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="relative flex flex-1 gap-1">
                    {days.map((day, idx) => {
                      const dayReservations = getReservationsForProperty(property.id, day)
                      const dayBlocked = getBlockedDatesForProperty(property.id, day)
                      const isBlocked = dayBlocked.length > 0
                      const isReserved = dayReservations.length > 0
                      const reservationColor =
                        isReserved && dayReservations[0]?.reservation_type
                          ? getReservationTypeColor(dayReservations[0].reservation_type).bg
                          : "bg-chart-1"

                      if (isBlocked) {
                        console.log(
                          `[v0] Property ${property.id} date ${day.toISOString().split("T")[0]}: BLOCKED (reason: ${dayBlocked[0].reason})`,
                        )
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleDateCellClick(property.id, day)}
                          className={cn(
                            "relative min-w-[40px] flex-1 cursor-pointer rounded-sm border border-border/50 transition-all hover:border-primary/50 hover:shadow-sm",
                            !isReserved && !isBlocked && "bg-muted/20 hover:bg-muted/40",
                          )}
                        >
                          {isBlocked ? (
                            <div
                              className="absolute inset-0.5 rounded bg-destructive transition-opacity hover:opacity-90"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)",
                              }}
                              title={`Blocked: ${dayBlocked[0].reason} - Click to view details`}
                            />
                          ) : (
                            isReserved && (
                              <div
                                className={`absolute inset-0.5 rounded ${reservationColor} transition-opacity hover:opacity-90`}
                                title={`Reserved - Click to view details`}
                              />
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-blue-500" />
              <span className="text-muted-foreground">Short-term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-purple-500" />
              <span className="text-muted-foreground">Long-term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-orange-500" />
              <span className="text-muted-foreground">Corporate</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded bg-destructive"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
                }}
              />
              <span className="text-muted-foreground">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted/20" />
              <span className="text-muted-foreground">Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPropertyId && (
        <PropertyCalendarModal
          propertyId={selectedPropertyId}
          property={properties.find((p) => p.id === selectedPropertyId)!}
          reservations={reservations.filter((r) => r.property_id === selectedPropertyId)}
          blockedDates={blockedDates.filter((b) => b.property_id === selectedPropertyId)}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  )
}
