"use client"
import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Property } from "@/lib/types/database"
import type { PropertyPerformance, MaintenanceRecord, PropertyDocument } from "@/lib/types"
import { Download, FileText, TrendingUp, Wrench, Home, ChevronLeft, ChevronRight } from "lucide-react"

const AMENITY_LABELS: Record<string, string> = {
  ac: "Air Conditioning (AC)",
  wifi: "Wi-Fi",
  parking: "Parking",
  heating: "Heating",
  kitchen: "Kitchen",
  washer: "Washer",
  dryer: "Dryer",
  tv: "TV",
  pool: "Pool",
}

interface PropertyDetailsModalProps {
  property: Property | null
  performance: PropertyPerformance | null
  maintenanceRecords: MaintenanceRecord[]
  documents: PropertyDocument[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PropertyDetailsModal({
  property,
  performance,
  maintenanceRecords,
  documents,
  open,
  onOpenChange,
}: PropertyDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!property) return null

  const propertyImages = property.images && property.images.length > 0 ? property.images : ["/placeholder.svg"]
  const currentImage = propertyImages[currentImageIndex]
  const amenities = typeof property.amenities === "string" ? JSON.parse(property.amenities) : property.amenities || []

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1))
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentImageIndex(0)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl font-bold text-foreground">{property.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Home className="h-5 w-5 text-primary" />
              <h3 className="font-sans text-lg font-semibold text-foreground">Overview</h3>
            </div>

            <div className="group relative aspect-video overflow-hidden rounded-lg">
              <Image src={currentImage || "/placeholder.svg"} alt={property.name} fill className="object-cover" />

              {propertyImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                    {currentImageIndex + 1} / {propertyImages.length}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{property.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={property.status === "active" ? "success" : "secondary"}>{property.status}</Badge>
                  </div>
                  {property.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bedrooms:</span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms:</span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                  {property.property_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{property.property_type}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {amenities.length > 0 ? (
                      amenities.map((amenity: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {AMENITY_LABELS[amenity] || amenity}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No amenities listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Section */}
          {performance && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-sans text-lg font-semibold text-foreground">Performance</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
                      <p className="mt-2 font-sans text-2xl font-bold text-foreground">
                        GMD {performance.lifetimeRevenue.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Average Occupancy</p>
                      <p className="mt-2 font-sans text-2xl font-bold text-foreground">
                        {performance.averageOccupancy}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">RevPAR</p>
                      <p className="mt-2 font-sans text-2xl font-bold text-foreground">
                        GMD {performance.revPAR.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bookings:</span>
                    <span className="font-medium">{performance.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Stay Duration:</span>
                    <span className="font-medium">{performance.averageStayDuration} days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Maintenance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="font-sans text-lg font-semibold text-foreground">Maintenance</h3>
            </div>

            {property.status === "maintenance" && property.maintenanceEndDate && (
              <Card className="border-warning bg-warning/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-warning-foreground">
                    Currently under maintenance until {new Date(property.maintenanceEndDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maintenance History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>GMD {record.cost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "completed"
                                ? "success"
                                : record.status === "in-progress"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-sans text-lg font-semibold text-foreground">Documents</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {property.documents && property.documents.length > 0 ? (
                  <div className="space-y-2">
                    {property.documents.map((doc: { name: string; url: string }, index: number) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">Click to view</p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
