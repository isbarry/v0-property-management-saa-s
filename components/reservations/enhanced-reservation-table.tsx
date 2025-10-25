"use client"

import { cn } from "@/lib/utils"
import { ReservationDetailModal } from "./reservation-detail-modal"
import { EditReservationModal } from "./edit-reservation-modal"
import { getReservationTypeColor } from "@/lib/utils/reservation-colors"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Reservation, Property } from "@/lib/types/database"
import { FileText, MessageCircle, Search, Download, Trash2, Mail, Edit, X } from "lucide-react"

interface EnhancedReservationTableProps {
  reservations: Reservation[]
  properties: Property[]
}

export function EnhancedReservationTable({ reservations, properties }: EnhancedReservationTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPropertyNames, setSelectedPropertyNames] = useState<Set<string>>(new Set())
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set())
  const [selectedReservations, setSelectedReservations] = useState<number[]>([])
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const propertyGroups = useMemo(() => {
    const groups = new Map<string, Property[]>()
    properties.forEach((property) => {
      const groupName = property.property_name || "Ungrouped"
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(property)
    })
    return groups
  }, [properties])

  const unitsForSelectedProperties = useMemo(() => {
    if (selectedPropertyNames.size === 0) return []
    const units: Property[] = []
    selectedPropertyNames.forEach((propertyName) => {
      const propertyUnits = propertyGroups.get(propertyName) || []
      units.push(...propertyUnits)
    })
    return units
  }, [selectedPropertyNames, propertyGroups])

  const filteredReservations = reservations.filter((reservation) => {
    const property = properties.find((p) => p.id === reservation.property_id)
    const searchLower = searchQuery.toLowerCase()

    const matchesSearch =
      property?.unit_name?.toLowerCase().includes(searchLower) ||
      property?.property_name?.toLowerCase().includes(searchLower) ||
      reservation.guest_name?.toLowerCase().includes(searchLower) ||
      reservation.guest_email?.toLowerCase().includes(searchLower) ||
      reservation.check_in?.toString().includes(searchQuery) ||
      reservation.check_out?.toString().includes(searchQuery) ||
      false

    if (selectedPropertyNames.size > 0) {
      const propertyGroupName = property?.property_name || "Ungrouped"
      if (!selectedPropertyNames.has(propertyGroupName)) return false

      if (selectedUnits.size > 0) {
        if (!selectedUnits.has(reservation.property_id)) return false
      }
    }

    return matchesSearch
  })

  const handlePropertyToggle = (propertyName: string) => {
    const newSelectedProperties = new Set(selectedPropertyNames)

    if (newSelectedProperties.has(propertyName)) {
      newSelectedProperties.delete(propertyName)
      const unitsInProperty = propertyGroups.get(propertyName) || []
      const newSelectedUnits = new Set(selectedUnits)
      unitsInProperty.forEach((unit) => newSelectedUnits.delete(unit.id))
      setSelectedUnits(newSelectedUnits)
    } else {
      newSelectedProperties.add(propertyName)
      const unitsInProperty = propertyGroups.get(propertyName) || []
      const newSelectedUnits = new Set(selectedUnits)
      unitsInProperty.forEach((unit) => newSelectedUnits.add(unit.id))
      setSelectedUnits(newSelectedUnits)
    }

    setSelectedPropertyNames(newSelectedProperties)
  }

  const handleSelectAllProperties = () => {
    if (selectedPropertyNames.size === propertyGroups.size) {
      setSelectedPropertyNames(new Set())
      setSelectedUnits(new Set())
    } else {
      const allPropertyNames = new Set(propertyGroups.keys())
      const allUnitIds = new Set(properties.map((p) => p.id))
      setSelectedPropertyNames(allPropertyNames)
      setSelectedUnits(allUnitIds)
    }
  }

  const handleUnitToggle = (unitId: number) => {
    const newSelectedUnits = new Set(selectedUnits)
    if (newSelectedUnits.has(unitId)) {
      newSelectedUnits.delete(unitId)
    } else {
      newSelectedUnits.add(unitId)
    }
    setSelectedUnits(newSelectedUnits)
  }

  const handleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([])
    } else {
      setSelectedReservations(filteredReservations.map((r) => r.id))
    }
  }

  const handleSelectReservation = (id: number) => {
    if (selectedReservations.includes(id)) {
      setSelectedReservations(selectedReservations.filter((r) => r !== id))
    } else {
      setSelectedReservations([...selectedReservations, id])
    }
  }

  const handleBulkAction = (action: string) => {
    alert(`Performing ${action} on ${selectedReservations.length} reservation(s)`)
    setSelectedReservations([])
  }

  const handleExportCSV = () => {
    alert("Exporting reservations to CSV...")
  }

  const handleGenerateInvoice = (reservation: Reservation) => {
    console.log("Generating invoice for reservation:", reservation.id)
    alert("Invoice generated! (This would download a PDF in production)")
  }

  const handleSendWhatsApp = (reservation: Reservation) => {
    if (reservation.guest_phone) {
      const property = properties.find((p) => p.id === reservation.property_id)
      const message = encodeURIComponent(
        `Hello ${reservation.guest_name}, this is a confirmation for your reservation at ${property?.unit_name} from ${new Date(reservation.check_in).toLocaleDateString()} to ${new Date(reservation.check_out).toLocaleDateString()}.`,
      )
      window.open(`https://wa.me/${reservation.guest_phone.replace(/\D/g, "")}?text=${message}`, "_blank")
    } else {
      alert("No phone number available for this guest")
    }
  }

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    setRefreshKey((prev) => prev + 1)
    try {
      const [reservationsRes, propertiesRes] = await Promise.all([fetch("/api/reservations"), fetch("/api/properties")])

      const reservationsData = await reservationsRes.json()
      const propertiesData = await propertiesRes.json()

      window.dispatchEvent(
        new CustomEvent("refreshReservations", {
          detail: {
            reservations: reservationsData.reservations || [],
            properties: propertiesData.properties || [],
          },
        }),
      )
    } catch (error) {
      console.error("[v0] Error refreshing data:", error)
    }
  }

  const getPaymentStatus = (reservation: Reservation) => {
    const paid = Number.parseFloat(reservation.paid_amount || "0")
    const total = Number.parseFloat(reservation.total_amount || "0")

    if (paid >= total) return "paid"
    if (paid > 0) return "partial"
    return "pending"
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500"
      case "partial":
        return "bg-yellow-500"
      case "pending":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans text-xl font-semibold text-foreground">All Reservations</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-1 h-3 w-3" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3" data-onboarding="reservation-filters">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllProperties}
                  className={cn(
                    "h-9 rounded-full border-2 px-4 transition-colors",
                    selectedPropertyNames.size === 0 || selectedPropertyNames.size === propertyGroups.size
                      ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                  )}
                >
                  All Properties
                </Button>
                {Array.from(propertyGroups.keys()).map((propertyName) => (
                  <Button
                    key={propertyName}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePropertyToggle(propertyName)}
                    className={cn(
                      "h-9 rounded-full border-2 px-4 transition-colors",
                      selectedPropertyNames.has(propertyName)
                        ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                    )}
                  >
                    {propertyName}
                  </Button>
                ))}
              </div>

              {unitsForSelectedProperties.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Units:</span>
                  {unitsForSelectedProperties.map((unit) => (
                    <Button
                      key={unit.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnitToggle(unit.id)}
                      className={cn(
                        "h-9 rounded-full border-2 px-4 transition-colors",
                        selectedUnits.has(unit.id)
                          ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                      )}
                    >
                      {unit.unit_name || unit.name}
                      {selectedUnits.has(unit.id) && <X className="ml-1 h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {selectedReservations.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 p-3">
                <span className="text-sm font-medium text-foreground">{selectedReservations.length} selected</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("send-email")}>
                    <Mail className="mr-1 h-3 w-3" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("delete")}>
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedReservations.length === filteredReservations.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">Guest Name</TableHead>
                  <TableHead className="text-muted-foreground">Unit</TableHead>
                  <TableHead className="text-muted-foreground">Property</TableHead>
                  <TableHead className="text-muted-foreground">Features</TableHead>
                  <TableHead className="text-muted-foreground">Check-In</TableHead>
                  <TableHead className="text-muted-foreground">Check-Out</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Payment</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => {
                  const property = properties.find((p) => p.id === reservation.property_id)
                  const paymentStatus = getPaymentStatus(reservation)
                  const typeColors = getReservationTypeColor(reservation.reservation_type)

                  return (
                    <TableRow
                      key={reservation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedReservationId(reservation.id)
                        setIsModalOpen(true)
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedReservations.includes(reservation.id)}
                          onCheckedChange={() => handleSelectReservation(reservation.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{reservation.guest_name}</TableCell>
                      <TableCell className="text-foreground">{property?.unit_name || property?.name}</TableCell>
                      <TableCell className="text-foreground">{property?.property_name || "—"}</TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{property?.bedrooms} bed</span>
                          <span>•</span>
                          <span>{property?.bathrooms} bath</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(reservation.check_in).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(reservation.check_out).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-foreground">
                        GMD {Number.parseFloat(reservation.total_amount || "0").toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", getPaymentStatusColor(paymentStatus))} />
                          <Badge variant={paymentStatus === "paid" ? "success" : "warning"}>{paymentStatus}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reservation.reservation_type && (
                          <Badge className={`${typeColors.bg} text-white capitalize`}>
                            {reservation.reservation_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReservation(reservation)}
                            className="h-8"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInvoice(reservation)}
                            className="h-8"
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            Invoice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendWhatsApp(reservation)}
                            className="h-8 border-green-600 bg-green-600/10 text-green-600 hover:bg-green-600/20 hover:text-green-600"
                          >
                            <MessageCircle className="mr-1 h-3 w-3" />
                            WhatsApp
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ReservationDetailModal
        reservationId={selectedReservationId}
        property={properties.find(
          (p) => p.id === reservations.find((r) => r.id === selectedReservationId)?.property_id,
        )}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <EditReservationModal
        reservation={editingReservation}
        properties={properties}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  )
}
