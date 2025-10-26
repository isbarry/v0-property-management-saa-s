"use client"

import { useState } from "react"
import { BuildingCard, type BuildingData } from "./building-card"
import { BuildingDetailsModal } from "./building-details-modal"

interface BuildingGridProps {
  buildings: BuildingData[]
  onUpdate?: () => void
}

export function BuildingGrid({ buildings, onUpdate }: BuildingGridProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleBuildingClick = (building: BuildingData) => {
    setSelectedBuilding(building)
    setIsModalOpen(true)
  }

  if (buildings.length === 0) {
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
        {buildings.map((building) => (
          <BuildingCard key={building.id} building={building} onClick={handleBuildingClick} />
        ))}
      </div>

      {selectedBuilding && (
        <BuildingDetailsModal
          building={selectedBuilding}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedBuilding(null)
          }}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
