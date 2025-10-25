"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Reservation, Property } from "@/lib/types/database"
import { useMemo, useEffect, useRef } from "react"

interface UpcomingCheckInsCheckOutsProps {
  reservations: Reservation[]
  properties: Property[]
  onReady?: () => void // Added onReady callback prop
}

export function UpcomingCheckInsCheckOuts({ reservations, properties, onReady }: UpcomingCheckInsCheckOutsProps) {
  const hasCalledReady = useRef(false)

  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days ahead

    return reservations
      .flatMap((res) => {
        const events = []
        const checkIn = new Date(res.check_in)
        checkIn.setHours(0, 0, 0, 0)
        const checkOut = new Date(res.check_out)
        checkOut.setHours(0, 0, 0, 0)

        const property = properties.find((p) => p.id === res.property_id)

        if (checkIn >= today && checkIn <= futureDate) {
          events.push({
            id: `${res.id}-checkin`,
            type: "check-in" as const,
            propertyName: property?.unit_name || property?.name || "Unknown",
            guestName: res.guest_name,
            date: res.check_in,
            dateObj: checkIn,
          })
        }

        if (checkOut >= today && checkOut <= futureDate) {
          events.push({
            id: `${res.id}-checkout`,
            type: "check-out" as const,
            propertyName: property?.unit_name || property?.name || "Unknown",
            guestName: res.guest_name,
            date: res.check_out,
            dateObj: checkOut,
          })
        }

        return events
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  }, [reservations, properties])

  useEffect(() => {
    if (reservations && properties && onReady && !hasCalledReady.current) {
      hasCalledReady.current = true
      onReady()
    }
  }, [reservations, properties, onReady])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-sans text-lg font-semibold text-foreground">Upcoming Check-ins/Check-outs</CardTitle>
        <p className="text-sm text-muted-foreground">Next 14 days</p>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming check-ins or check-outs</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
              >
                {event.type === "check-in" ? (
                  <ArrowDownToLine className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5 text-blue-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{event.propertyName}</p>
                  <p className="text-sm text-muted-foreground truncate">{event.guestName}</p>
                </div>
                <div className="text-right">
                  <Badge variant={event.type === "check-in" ? "default" : "secondary"} className="mb-1">
                    {event.type === "check-in" ? "Check-in" : "Check-out"}
                  </Badge>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
