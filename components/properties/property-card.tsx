"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Property } from "@/lib/types/database"
import { Calendar, Wrench, Bed, Bath, Edit, Trash2, ImageOff, ChevronLeft, ChevronRight } from "lucide-react"
import { PropertyDetailsModal } from "./property-details-modal"
import { AddReservationModal } from "./add-reservation-modal"
import { PropertyDialog } from "./property-dialog"
import { DeletePropertyDialog } from "./delete-property-dialog"

interface PropertyCardProps {
  property: Property
  onToggleMaintenance: (property: Property) => void
  onUpdate?: () => void
  onDelete?: () => void
}

export function PropertyCard({ property, onToggleMaintenance, onUpdate, onDelete }: PropertyCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleCardClick = () => {
    setDetailsOpen(true)
  }

  const getStatusVariant = (status: Property["status"]) => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "secondary"
      case "maintenance":
        return "warning"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status: Property["status"]) => {
    switch (status) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "maintenance":
        return "Under Maintenance"
      default:
        return status
    }
  }

  const hasImage = property.images && property.images.length > 0
  const imageUrl = hasImage ? property.images[currentImageIndex] : null
  const hasMultipleImages = property.images && property.images.length > 1

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <Card
        className="group overflow-hidden border-border bg-card transition-all hover:shadow-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted">
              <ImageOff className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No image added</p>
            </div>
          )}

          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/90 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/90 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-2 py-1 rounded-full text-xs">
                {currentImageIndex + 1} / {property.images!.length}
              </div>
            </>
          )}

          <div className="absolute right-3 top-3">
            <Badge variant={getStatusVariant(property.status)} className="shadow-md">
              {getStatusLabel(property.status)}
            </Badge>
          </div>
          <div className="absolute left-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                setEditOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-sans text-lg font-semibold text-foreground">{property.unit_name || property.name}</h3>
          {property.property_name && (
            <p className="text-sm text-muted-foreground font-medium">{property.property_name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{property.location}</p>

          <div className="mt-3 flex items-center gap-4">
            {property.bedrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.property_type && (
              <Badge variant="outline" className="text-xs">
                {property.property_type}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 border-t border-border bg-muted/30 p-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => setReservationOpen(true)}
          >
            <Calendar className="mr-1 h-3 w-3" />
            Add Reservation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMaintenance(property)
            }}
          >
            <Wrench className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>

      <PropertyDetailsModal
        property={property}
        performance={null}
        maintenanceRecords={[]}
        documents={[]}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AddReservationModal property={property} open={reservationOpen} onOpenChange={setReservationOpen} />

      <PropertyDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false)
          onUpdate?.()
        }}
        property={property}
      />

      <DeletePropertyDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        property={property}
        onSuccess={() => {
          setDeleteOpen(false)
          onDelete?.()
        }}
      />
    </>
  )
}
