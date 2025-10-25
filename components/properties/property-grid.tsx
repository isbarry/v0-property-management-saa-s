"use client"

import { useState } from "react"
import { PropertyCard } from "./property-card"
import { MaintenanceModal } from "./maintenance-modal"
import type { Property } from "@/lib/types/database"

interface PropertyGridProps {
  properties: Property[]
  onUpdate?: () => void
}

export function PropertyGrid({ properties, onUpdate }: PropertyGridProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)

  const handleToggleMaintenance = (property: Property) => {
    setSelectedProperty(property)
    setIsMaintenanceModalOpen(true)
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">No properties found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new property</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onToggleMaintenance={handleToggleMaintenance}
            onUpdate={onUpdate}
            onDelete={onUpdate}
          />
        ))}
      </div>

      {selectedProperty && (
        <MaintenanceModal
          property={selectedProperty}
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
        />
      )}
    </>
  )
}
