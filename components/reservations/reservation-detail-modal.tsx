"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Users,
  DollarSign,
  MessageCircle,
  FileText,
  Edit,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Download,
} from "lucide-react"
import type { ReservationDetail, Property } from "@/lib/types"
import {
  mockReservationDetails,
  mockGuestProfiles,
  mockCommunicationLogs,
  mockPaymentRecords,
  mockReservationDocuments,
} from "@/lib/mock-data"
import { getReservationTypeColor, getReservationTypeLabel } from "@/lib/utils/reservation-colors"

interface ReservationDetailModalProps {
  reservationId: string | null
  property: Property | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationDetailModal({ reservationId, property, open, onOpenChange }: ReservationDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [status, setStatus] = useState<ReservationDetail["status"]>("confirmed")

  if (!reservationId) return null

  const reservation = mockReservationDetails[reservationId]
  const guest = mockGuestProfiles[reservation?.tenantId]
  const communications = mockCommunicationLogs[reservationId] || []
  const payments = mockPaymentRecords[reservationId] || []
  const documents = mockReservationDocuments[reservationId] || []

  if (!reservation || !guest) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500"
      case "checked-in":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleSendWhatsApp = () => {
    if (guest.whatsapp) {
      const message = encodeURIComponent(
        `Hello ${guest.name}, regarding your reservation ${reservation.reservationNumber} at ${property?.name}.`,
      )
      window.open(`https://wa.me/${guest.whatsapp.replace(/\D/g, "")}?text=${message}`, "_blank")
    }
  }

  const typeColors = reservation ? getReservationTypeColor(reservation.reservationType) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-semibold">{property?.name}</DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-muted-foreground">{reservation.reservationNumber}</span>
                <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                {reservation.reservationType && typeColors && (
                  <Badge className={`${typeColors.bg} text-white`}>
                    {getReservationTypeLabel(reservation.reservationType)}
                  </Badge>
                )}
              </div>
            </div>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked-In</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guest">Guest Profile</TabsTrigger>
            <TabsTrigger value="financial">Financial Details</TabsTrigger>
            <TabsTrigger value="property">Property & Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Stay Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Check-in:</span>
                    <p className="font-medium">{new Date(reservation.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-out:</span>
                    <p className="font-medium">{new Date(reservation.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total nights:</span>
                    <p className="font-medium">
                      {Math.ceil(
                        (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Guests:</span>
                    <p className="font-medium">
                      {reservation.guests.adults} Adults, {reservation.guests.children} Children
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Property:</span>
                    <p className="font-medium">{property?.name}</p>
                  </div>
                  {reservation.specialRequests && (
                    <div>
                      <span className="text-muted-foreground">Special requests:</span>
                      <p className="text-sm">{reservation.specialRequests}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nightly rate:</span>
                    <p className="font-medium">GMD {reservation.negotiatedRate.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total amount:</span>
                    <p className="text-2xl font-bold">GMD {reservation.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid amount:</span>
                    <p className="font-medium text-green-500">GMD {reservation.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Balance due:</span>
                    <p className="font-medium text-amber-500">GMD {reservation.balanceAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment method:</span>
                    <p className="font-medium">{reservation.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Security deposit:</span>
                    <p className="font-medium">
                      GMD {reservation.securityDeposit.toLocaleString()} ({reservation.securityDepositStatus})
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600">
                    <Clock className="mr-2 h-4 w-4" />
                    Send Reminder
                  </Button>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Edit className="mr-2 h-4 w-4" />
                    Modify Reservation
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check-in Guest
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guest" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{guest.name}</p>
                      {guest.isRepeatGuest && (
                        <Badge variant="outline" className="mt-1">
                          Repeat Guest
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.email}</span>
                    </div>
                    {guest.whatsapp && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{guest.whatsapp}</span>
                      </div>
                    )}
                  </div>
                  {guest.idType && (
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <p className="font-medium">
                        {guest.idType} - {guest.idNumber}
                      </p>
                    </div>
                  )}
                  {guest.emergencyContact && (
                    <div>
                      <span className="text-muted-foreground">Emergency Contact:</span>
                      <p className="font-medium">
                        {guest.emergencyContact} - {guest.emergencyPhone}
                      </p>
                    </div>
                  )}
                  {guest.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="text-sm">{guest.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Guest History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{guest.previousStays}</p>
                      <p className="text-sm text-muted-foreground">Previous Stays</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">GMD {guest.lifetimeValue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Lifetime Value</p>
                    </div>
                  </div>
                  {guest.averageRating && (
                    <div>
                      <p className="text-2xl font-bold">{guest.averageRating}/5.0</p>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Communication Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communications.map((comm) => (
                    <div key={comm.id} className="flex gap-3 border-l-2 border-primary pl-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{comm.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comm.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{comm.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Sent by: {comm.sentBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nightly rate × nights</span>
                  <span className="font-medium">GMD {reservation.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold">GMD {reservation.totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">GMD {payment.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()} - {payment.method}
                        </p>
                      </div>
                      <Badge variant={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Property Name:</span>
                  <p className="font-medium">{property?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{property?.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Standard Rate:</span>
                  <p className="font-medium">GMD {property?.standardRate.toLocaleString()}/night</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-muted-foreground">Bedrooms:</span>
                    <p className="font-medium">3</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bathrooms:</span>
                    <p className="font-medium">2</p>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground">Amenities:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">WiFi</Badge>
                    <Badge variant="outline">Air Conditioning</Badge>
                    <Badge variant="outline">Pool</Badge>
                    <Badge variant="outline">Parking</Badge>
                    <Badge variant="outline">Garden</Badge>
                    <Badge variant="outline">Security</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maintenance Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 rounded-lg bg-green-500/10 p-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Pre-arrival inspection completed</p>
                    <p className="text-sm text-muted-foreground">Property is ready for guest check-in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Add Note
            </Button>
            <Button variant="outline" size="sm">
              Duplicate Reservation
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSendWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Send WhatsApp
            </Button>
            <Button size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
