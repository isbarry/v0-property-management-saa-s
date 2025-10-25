"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Reservation } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ReservationCalendarProps {
  reservations: Reservation[]
}

export function ReservationCalendar({ reservations }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const hasReservation = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return reservations.some((r) => {
      const checkIn = new Date(r.checkIn)
      const checkOut = new Date(r.checkOut)
      return date >= checkIn && date <= checkOut
    })
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isToday = date.toDateString() === new Date().toDateString()
    const hasBooking = hasReservation(date)

    days.push(
      <div
        key={day}
        className={cn(
          "relative aspect-square rounded-md border border-border p-2 transition-colors",
          isToday && "border-primary bg-primary/10",
          hasBooking && "bg-chart-1/20",
        )}
      >
        <span className={cn("text-sm font-medium", isToday ? "text-primary" : "text-foreground")}>{day}</span>
        {hasBooking && <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
      </div>,
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
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
  )
}
