"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Property } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle } from "lucide-react"

interface AddReservationModalProps {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  prefilledDates?: { checkIn: string; checkOut: string } | null
}

export function AddReservationModal({
  property,
  open,
  onOpenChange,
  onSuccess,
  prefilledDates,
}: AddReservationModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    countryCode: "+220",
    guestPhone: "",
    checkIn: "",
    checkOut: "",
    negotiatedRate: 0,
    paymentTerms: "full-upfront",
    bookingSource: "direct",
    specialRequirements: "",
    followUpDate: "",
    reservationType: "short-term" as "short-term" | "long-term" | "corporate",
  })
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    checkIn?: string
    checkOut?: string
    negotiatedRate?: string
  }>({})

  useEffect(() => {
    if (open && prefilledDates) {
      console.log("[v0] Auto-populating dates:", prefilledDates)
      setFormData((prev) => ({
        ...prev,
        checkIn: prefilledDates.checkIn,
        checkOut: prefilledDates.checkOut,
      }))
    }
  }, [open, prefilledDates])

  const validateDates = () => {
    const newErrors: typeof errors = {}

    const checkInDate = new Date(formData.checkIn)
    const checkOutDate = new Date(formData.checkOut)

    if (formData.checkIn && formData.checkOut && checkOutDate <= checkInDate) {
      newErrors.checkOut = "Check-out date must be after check-in date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateTotal = () => {
    const newErrors: typeof errors = { ...errors }

    if (formData.negotiatedRate < 0) {
      newErrors.negotiatedRate = "Total amount cannot be negative"
      setErrors(newErrors)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property) return

    const datesValid = validateDates()
    const totalValid = validateTotal()

    if (!datesValid || !totalValid) {
      return
    }

    setSubmitting(true)
    setApiError(null)

    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.guestPhone}`

      const reservationData = {
        property_id: property.id,
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: fullPhoneNumber,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        total_amount: formData.negotiatedRate,
        status: "confirmed",
        notes: formData.specialRequirements || null,
        reservation_type: formData.reservationType,
      }

      console.log("[v0] Creating reservation with data:", reservationData)

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      })

      console.log("[v0] Reservation response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Reservation error response:", errorData)
        setApiError(errorData.error || "Failed to create reservation")
        return
      }

      const result = await response.json()
      console.log("[v0] Reservation created successfully:", result)

      toast({
        title: "Reservation Created",
        description: `Successfully created reservation for ${formData.guestName} at ${property.name}`,
      })

      onSuccess?.()
      onOpenChange(false)

      // Reset form
      setFormData({
        guestName: "",
        guestEmail: "",
        countryCode: "+220",
        guestPhone: "",
        checkIn: "",
        checkOut: "",
        negotiatedRate: 0,
        paymentTerms: "full-upfront",
        bookingSource: "direct",
        specialRequirements: "",
        followUpDate: "",
        reservationType: "short-term",
      })
      setErrors({})
      setApiError(null)
    } catch (error) {
      console.error("[v0] Error creating reservation:", error)
      setApiError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  if (!property) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl font-bold text-foreground">
            Add Reservation - {property.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {apiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Unable to Create Reservation</h4>
                  <p className="mt-1 text-sm text-red-700">{apiError}</p>
                  {apiError.includes("not available") && (
                    <p className="mt-2 text-sm text-red-600">
                      Please select different dates or check the reservation calendar to see available periods.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Guest Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input
                  id="guestName"
                  required
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  required
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone Number *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          <span className="flex items-center gap-2">
                            <span>{item.flag}</span>
                            <span>{item.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="guestPhone"
                    required
                    placeholder="1234567"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value.replace(/\D/g, "") })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Reservation Type</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1",
                  formData.reservationType === "short-term" &&
                    "border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 hover:text-[#3B82F6]",
                )}
                onClick={() => setFormData({ ...formData, reservationType: "short-term" })}
              >
                Short Term
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1",
                  formData.reservationType === "long-term" &&
                    "border-[#10B981] bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 hover:text-[#10B981]",
                )}
                onClick={() => setFormData({ ...formData, reservationType: "long-term" })}
              >
                Long Term
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1",
                  formData.reservationType === "corporate" &&
                    "border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6]",
                )}
                onClick={() => setFormData({ ...formData, reservationType: "corporate" })}
              >
                Corporate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.reservationType === "short-term" && "Typically stays under 30 days"}
              {formData.reservationType === "long-term" && "Extended stays of 30+ days"}
              {formData.reservationType === "corporate" && "Business or company bookings"}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Stay Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-In Date *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  required
                  value={formData.checkIn}
                  onChange={(e) => {
                    setFormData({ ...formData, checkIn: e.target.value })
                    setErrors({ ...errors, checkIn: undefined })
                  }}
                  onBlur={validateDates}
                  className={cn(errors.checkIn && "border-red-500")}
                />
                {errors.checkIn && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.checkIn}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-Out Date *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  required
                  value={formData.checkOut}
                  onChange={(e) => {
                    setFormData({ ...formData, checkOut: e.target.value })
                    setErrors({ ...errors, checkOut: undefined })
                  }}
                  onBlur={validateDates}
                  className={cn(errors.checkOut && "border-red-500")}
                />
                {errors.checkOut && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.checkOut}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Pricing & Payment</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="negotiatedRate">Total Price (GMD) *</Label>
                <Input
                  id="negotiatedRate"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.negotiatedRate}
                  onChange={(e) => {
                    setFormData({ ...formData, negotiatedRate: Number(e.target.value) })
                    setErrors({ ...errors, negotiatedRate: undefined })
                  }}
                  onBlur={validateTotal}
                  className={cn(errors.negotiatedRate && "border-red-500")}
                />
                {errors.negotiatedRate && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.negotiatedRate}
                  </p>
                )}
                {formData.negotiatedRate === 0 && !errors.negotiatedRate && (
                  <p className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Warning: Total price is set to 0. This will create a free reservation.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                >
                  <SelectTrigger id="paymentTerms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-upfront">Full Payment Upfront</SelectItem>
                    <SelectItem value="50-50">50% Deposit, 50% on Arrival</SelectItem>
                    <SelectItem value="monthly">Monthly Installments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Additional Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bookingSource">Booking Source *</Label>
                <Select
                  value={formData.bookingSource}
                  onValueChange={(value) => setFormData({ ...formData, bookingSource: value })}
                >
                  <SelectTrigger id="bookingSource">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Booking</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="booking">Booking.com</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                placeholder="Any special requests or requirements..."
                value={formData.specialRequirements}
                onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Reservation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const COUNTRY_CODES = [
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
]
