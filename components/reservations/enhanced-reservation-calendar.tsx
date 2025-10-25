"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Ban, Unlock } from "lucide-react"
import type { Reservation, Property } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ReservationDetailModal } from "./reservation-detail-modal"

interface EnhancedReservationCalendarProps {
  reservations: Reservation[]
  properties: Property[]
}

export function EnhancedReservationCalendar({ reservations, properties }: EnhancedReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return reservations.filter((r) => {
      const checkIn = new Date(r.checkIn)
      const checkOut = new Date(r.checkOut)
      return date >= checkIn && date <= checkOut && (!selectedProperty || r.propertyId === selectedProperty)
    })
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const toggleDateSelection = (date: Date) => {
    const dateStr = date.toISOString()
    const isSelected = selectedDates.some((d) => d.toISOString() === dateStr)
    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => d.toISOString() !== dateStr))
    } else {
      setSelectedDates([...selectedDates, date])
    }
  }

  const handleReserve = () => {
    if (selectedDates.length > 0) {
      alert(`Creating reservation for ${selectedDates.length} selected date(s)`)
      setSelectedDates([])
    }
  }

  const handleBlockDates = () => {
    if (selectedDates.length > 0) {
      alert(`Blocking ${selectedDates.length} selected date(s)`)
      setSelectedDates([])
    }
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isToday = date.toDateString() === new Date().toDateString()
    const dayReservations = getReservationsForDate(date)
    const isSelected = selectedDates.some((d) => d.toISOString() === date.toISOString())

    days.push(
      <div
        key={day}
        onClick={() => toggleDateSelection(date)}
        className={cn(
          "relative aspect-square cursor-pointer rounded-md border border-border p-2 transition-all hover:border-primary",
          isToday && "border-primary bg-primary/10",
          dayReservations.length > 0 && "bg-chart-1/20",
          isSelected && "bg-primary/30 ring-2 ring-primary",
        )}
      >
        <span className={cn("text-sm font-medium", isToday ? "text-primary" : "text-foreground")}>{day}</span>
        {dayReservations.length > 0 && (
          <div className="absolute bottom-1 left-1 right-1 space-y-0.5">
            {dayReservations.slice(0, 2).map((res) => {
              const prop = properties.find((p) => p.id === res.propertyId)
              return (
                <div
                  key={res.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedReservationId(res.id)
                    setIsModalOpen(true)
                  }}
                  className="truncate rounded bg-primary px-1 text-[8px] text-primary-foreground hover:bg-primary/80"
                  title={prop?.name}
                >
                  {prop?.name}
                </div>
              )
            })}
            {dayReservations.length > 2 && (
              <div className="text-[8px] text-muted-foreground">+{dayReservations.length - 2} more</div>
            )}
          </div>
        )}
      </div>,
    )
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-semibold text-foreground">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={selectedProperty === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProperty(null)}
              >
                All Properties
              </Button>
              {properties.map((property) => (
                <Button
                  key={property.id}
                  variant={selectedProperty === property.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProperty(property.id)}
                >
                  {property.name}
                </Button>
              ))}
            </div>

            {selectedDates.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 p-3">
                <span className="text-sm font-medium text-foreground">{selectedDates.length} date(s) selected</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={handleReserve}>
                    <Plus className="mr-1 h-3 w-3" />
                    Reserve
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBlockDates}>
                    <Ban className="mr-1 h-3 w-3" />
                    Block Dates
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedDates([])}>
                    <Unlock className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {days}
          </div>
        </CardContent>
      </Card>

      <ReservationDetailModal
        reservationId={selectedReservationId}
        property={properties.find((p) => p.id === reservations.find((r) => r.id === selectedReservationId)?.propertyId)}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
