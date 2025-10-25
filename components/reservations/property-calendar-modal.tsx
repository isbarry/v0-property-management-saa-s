"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Ban, Unlock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Property, Reservation, BlockedDate } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AddReservationModal } from "@/components/properties/add-reservation-modal"

interface PropertyCalendarModalProps {
  propertyId: string
  property: Property
  reservations: Reservation[]
  blockedDates: BlockedDate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PropertyCalendarModal({
  property,
  reservations,
  blockedDates,
  open,
  onOpenChange,
  onSuccess,
}: PropertyCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState<"maintenance" | "owner-use" | "other">("maintenance")
  const [blockNotes, setBlockNotes] = useState("")
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [prefilledDates, setPrefilledDates] = useState<{ checkIn: string; checkOut: string } | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const { toast } = useToast()

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const isDateReserved = (date: Date) => {
    return reservations.some((r) => {
      const checkIn = new Date(r.check_in)
      const checkOut = new Date(r.check_out)
      return date >= checkIn && date <= checkOut
    })
  }

  const isDateBlocked = (date: Date) => {
    return blockedDates.some((b) => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      return date >= start && date <= end
    })
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some((d) => d.toDateString() === date.toDateString())
  }

  const handleDateMouseDown = (date: Date) => {
    if (isDateReserved(date)) return
    setIsDragging(true)
    setDragStart(date)
    setSelectedDates([date])
  }

  const handleDateMouseEnter = (date: Date) => {
    if (!isDragging || !dragStart || isDateReserved(date)) return

    const start = dragStart < date ? dragStart : date
    const end = dragStart < date ? date : dragStart
    const range: Date[] = []

    const current = new Date(start)
    while (current <= end) {
      if (!isDateReserved(current)) {
        range.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }

    setSelectedDates(range)
  }

  const handleDateMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  const handleReserve = () => {
    if (selectedDates.length > 0) {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
      const checkIn = sortedDates[0]
      const checkOut = sortedDates[sortedDates.length - 1]

      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }

      setPrefilledDates({
        checkIn: formatDate(checkIn),
        checkOut: formatDate(checkOut),
      })

      setShowReservationModal(true)
    }
  }

  const handleBlockDates = () => {
    setShowBlockModal(true)
  }

  const handleConfirmBlock = async () => {
    if (selectedDates.length === 0) return

    setIsBlocking(true)
    try {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
      const startDate = sortedDates[0]
      const endDate = sortedDates[sortedDates.length - 1]

      const response = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          reason: blockNotes || blockReason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to block dates")
      }

      toast({
        title: "Dates Blocked Successfully",
        description: `${selectedDates.length} date(s) have been blocked for ${blockReason}`,
      })

      setSelectedDates([])
      setShowBlockModal(false)
      setBlockNotes("")
      setBlockReason("maintenance")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("[v0] Error blocking dates:", error)
      toast({
        title: "Error",
        description: "Failed to block dates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBlocking(false)
    }
  }

  const handleUnblockDates = async () => {
    const blockedSelected = selectedDates.filter((d) => isDateBlocked(d))
    if (blockedSelected.length === 0) return

    setIsBlocking(true)
    try {
      const blockedRecords = blockedDates.filter((b) => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        return blockedSelected.some((d) => d >= start && d <= end)
      })

      await Promise.all(
        blockedRecords.map((record) =>
          fetch(`/api/blocked-dates/${record.id}`, {
            method: "DELETE",
          }),
        ),
      )

      toast({
        title: "Dates Unblocked Successfully",
        description: `${blockedSelected.length} date(s) have been unblocked`,
      })

      setSelectedDates([])

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("[v0] Error unblocking dates:", error)
      toast({
        title: "Error",
        description: "Failed to unblock dates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBlocking(false)
    }
  }

  const handleReservationSuccess = () => {
    setSelectedDates([])
    setShowReservationModal(false)
    onOpenChange(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  const canReserve = selectedDates.length > 0 && selectedDates.every((d) => !isDateReserved(d) && !isDateBlocked(d))
  const canBlock = selectedDates.length > 0 && selectedDates.every((d) => !isDateReserved(d))
  const canUnblock = selectedDates.length > 0 && selectedDates.some((d) => isDateBlocked(d))

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isToday = date.toDateString() === new Date().toDateString()
    const isReserved = isDateReserved(date)
    const isBlocked = isDateBlocked(date)
    const isSelected = isDateSelected(date)

    days.push(
      <div
        key={day}
        onMouseDown={() => handleDateMouseDown(date)}
        onMouseEnter={() => handleDateMouseEnter(date)}
        onMouseUp={handleDateMouseUp}
        className={cn(
          "relative flex aspect-square cursor-pointer items-center justify-center rounded-md border transition-all",
          isToday && "border-[#F59E0B] border-2",
          isReserved && "bg-[#3B82F6] text-white cursor-not-allowed",
          isBlocked &&
            "bg-[#EF4444] text-white cursor-pointer bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.2)_4px,rgba(0,0,0,0.2)_8px)]",
          !isReserved && !isBlocked && "border-[#10B981] hover:bg-accent",
          isSelected && !isReserved && "bg-[#60A5FA]/50 ring-2 ring-[#60A5FA]",
        )}
      >
        <span className={cn("text-sm font-medium", isReserved || isBlocked ? "text-white" : "text-foreground")}>
          {day}
        </span>
      </div>,
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-[90vw] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-sans text-2xl font-bold text-foreground">{property.name}</DialogTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm font-medium">
                  {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {days}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-[#10B981]" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-[#3B82F6]" />
                <span className="text-muted-foreground">Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-[#EF4444]" />
                <span className="text-muted-foreground">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-[#F59E0B]" />
                <span className="text-muted-foreground">Today</span>
              </div>
            </div>

            {/* Action Toolbar */}
            {selectedDates.length > 0 && (
              <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
                <span className="text-sm font-medium text-foreground">{selectedDates.length} date(s) selected</span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!canReserve} onClick={handleReserve} className="bg-[#3B82F6]">
                    <Plus className="mr-1 h-3 w-3" />
                    Reserve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canBlock || isBlocking}
                    onClick={handleBlockDates}
                    className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white bg-transparent"
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Block Dates
                  </Button>
                  {canUnblock && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBlocking}
                      onClick={handleUnblockDates}
                      className="border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white bg-transparent"
                    >
                      <Unlock className="mr-1 h-3 w-3" />
                      Unblock Dates
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDates([])}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dates Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Selected Dates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={blockReason} onValueChange={(v: any) => setBlockReason(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="owner-use">Owner Use</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBlockModal(false)} disabled={isBlocking}>
                Cancel
              </Button>
              <Button onClick={handleConfirmBlock} disabled={isBlocking}>
                {isBlocking ? "Blocking..." : "Confirm Block"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reservation Modal */}
      <AddReservationModal
        property={property}
        open={showReservationModal}
        onOpenChange={setShowReservationModal}
        onSuccess={handleReservationSuccess}
        prefilledDates={prefilledDates}
      />
    </>
  )
}
