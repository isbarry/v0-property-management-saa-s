"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Reservation, Property, Tenant } from "@/lib/types"
import { FileText, MessageCircle, Search } from "lucide-react"

interface ReservationTableProps {
  reservations: Reservation[]
  properties: Property[]
  tenants: Tenant[]
}

export function ReservationTable({ reservations, properties, tenants }: ReservationTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReservations = reservations.filter((reservation) => {
    const property = properties.find((p) => p.id === reservation.propertyId)
    const tenant = tenants.find((t) => t.id === reservation.tenantId)
    const searchLower = searchQuery.toLowerCase()

    return (
      property?.name.toLowerCase().includes(searchLower) ||
      tenant?.name.toLowerCase().includes(searchLower) ||
      reservation.checkIn.includes(searchQuery) ||
      reservation.checkOut.includes(searchQuery)
    )
  })

  const handleGenerateInvoice = (reservation: Reservation) => {
    console.log("Generating invoice for reservation:", reservation.id)
    // In a real app, this would generate and download a PDF
    alert("Invoice generated! (This would download a PDF in production)")
  }

  const handleSendWhatsApp = (reservation: Reservation) => {
    const tenant = tenants.find((t) => t.id === reservation.tenantId)
    const property = properties.find((p) => p.id === reservation.propertyId)

    if (tenant?.whatsapp) {
      const message = encodeURIComponent(
        `Hello ${tenant.name}, this is a confirmation for your reservation at ${property?.name} from ${new Date(reservation.checkIn).toLocaleDateString()} to ${new Date(reservation.checkOut).toLocaleDateString()}.`,
      )
      window.open(`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}?text=${message}`, "_blank")
    } else {
      alert("No WhatsApp number available for this tenant")
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sans text-xl font-semibold text-foreground">All Reservations</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Tenant Name</TableHead>
                <TableHead className="text-muted-foreground">Property</TableHead>
                <TableHead className="text-muted-foreground">Check-In</TableHead>
                <TableHead className="text-muted-foreground">Check-Out</TableHead>
                <TableHead className="text-muted-foreground">Rate</TableHead>
                <TableHead className="text-muted-foreground">Payment Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => {
                const property = properties.find((p) => p.id === reservation.propertyId)
                const tenant = tenants.find((t) => t.id === reservation.tenantId)

                return (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium text-foreground">{tenant?.name}</TableCell>
                    <TableCell className="text-foreground">{property?.name}</TableCell>
                    <TableCell className="text-foreground">
                      {new Date(reservation.checkIn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {new Date(reservation.checkOut).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground">GMD {reservation.negotiatedRate.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={reservation.paymentStatus === "paid" ? "success" : "warning"}>
                        {reservation.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
  )
}
