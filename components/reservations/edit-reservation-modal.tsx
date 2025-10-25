"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Reservation, Property } from "@/lib/types/database"

interface EditReservationModalProps {
  reservation: Reservation | null
  properties: Property[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const COUNTRY_CODES = [
  { code: "+220", country: "Gambia" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+234", country: "Nigeria" },
  { code: "+233", country: "Ghana" },
  { code: "+221", country: "Senegal" },
]

export function EditReservationModal({
  reservation,
  properties,
  open,
  onOpenChange,
  onSuccess,
}: EditReservationModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    property_id: "",
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    country_code: "+220",
    check_in: "",
    check_out: "",
    total_amount: "",
    paid_amount: "",
    status: "confirmed",
    notes: "",
    reservation_type: "short-term",
  })

  const [dateError, setDateError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  useEffect(() => {
    if (reservation) {
      const phone = reservation.guest_phone || ""
      let countryCode = "+220"
      let phoneNumber = phone

      for (const cc of COUNTRY_CODES) {
        if (phone.startsWith(cc.code)) {
          countryCode = cc.code
          phoneNumber = phone.substring(cc.code.length).trim()
          break
        }
      }

      setFormData({
        property_id: reservation.property_id.toString(),
        guest_name: reservation.guest_name || "",
        guest_email: reservation.guest_email || "",
        guest_phone: phoneNumber,
        country_code: countryCode,
        check_in: reservation.check_in ? new Date(reservation.check_in).toISOString().split("T")[0] : "",
        check_out: reservation.check_out ? new Date(reservation.check_out).toISOString().split("T")[0] : "",
        total_amount: reservation.total_amount || "",
        paid_amount: reservation.paid_amount || "0",
        status: reservation.status || "confirmed",
        notes: reservation.notes || "",
        reservation_type: reservation.reservation_type || "short-term",
      })
      setDateError(null)
      setAmountError(null)
      setError(null)
    }
  }, [reservation])

  const validateDates = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) {
      setDateError("Both check-in and check-out dates are required")
      return false
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkOutDate <= checkInDate) {
      setDateError("Check-out date must be after check-in date")
      return false
    }

    setDateError(null)
    return true
  }

  const validateAmount = (amount: string) => {
    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 0) {
      setAmountError("Total amount must be a valid positive number")
      return false
    }
    setAmountError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateDates(formData.check_in, formData.check_out)) {
      return
    }

    if (!validateAmount(formData.total_amount)) {
      return
    }

    setLoading(true)

    try {
      const fullPhone = `${formData.country_code}${formData.guest_phone}`

      const response = await fetch(`/api/reservations/${reservation?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: Number.parseInt(formData.property_id),
          guest_name: formData.guest_name,
          guest_email: formData.guest_email,
          guest_phone: fullPhone,
          check_in: formData.check_in,
          check_out: formData.check_out,
          total_amount: formData.total_amount,
          paid_amount: formData.paid_amount,
          status: formData.status,
          notes: formData.notes || null,
          reservation_type: formData.reservation_type,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update reservation")
      }

      toast({
        title: "Reservation Updated",
        description: `Successfully updated reservation for ${formData.guest_name}`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reservation")
    } finally {
      setLoading(false)
    }
  }

  if (!reservation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="property_id">Property *</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => setFormData({ ...formData, property_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest_name">Guest Name *</Label>
              <Input
                id="guest_name"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_email">Guest Email *</Label>
              <Input
                id="guest_email"
                type="email"
                value={formData.guest_email}
                onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_phone">Guest Phone *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.country_code}
                onValueChange={(value) => setFormData({ ...formData, country_code: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((cc) => (
                    <SelectItem key={cc.code} value={cc.code}>
                      {cc.code} {cc.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="guest_phone"
                type="tel"
                placeholder="1234567890"
                value={formData.guest_phone}
                onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                className="flex-1"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in">Check-In Date *</Label>
              <Input
                id="check_in"
                type="date"
                value={formData.check_in}
                onChange={(e) => {
                  setFormData({ ...formData, check_in: e.target.value })
                  if (formData.check_out) {
                    validateDates(e.target.value, formData.check_out)
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_out">Check-Out Date *</Label>
              <Input
                id="check_out"
                type="date"
                value={formData.check_out}
                onChange={(e) => {
                  setFormData({ ...formData, check_out: e.target.value })
                  if (formData.check_in) {
                    validateDates(formData.check_in, e.target.value)
                  }
                }}
                required
              />
            </div>
          </div>

          {dateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dateError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (GMD) *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => {
                  setFormData({ ...formData, total_amount: e.target.value })
                  validateAmount(e.target.value)
                }}
                required
              />
              {amountError && <p className="text-sm text-destructive">{amountError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">Paid Amount (GMD)</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_type">Reservation Type</Label>
              <Select
                value={formData.reservation_type}
                onValueChange={(value) => setFormData({ ...formData, reservation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-term">Short-term</SelectItem>
                  <SelectItem value="long-term">Long-term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!dateError || !!amountError}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Reservation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
