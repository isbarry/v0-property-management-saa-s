"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, DollarSign, Users, Home } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import type { Property } from "@/lib/types/database"
import type { BuildingData } from "./building-card"

interface BuildingDetailsModalProps {
  building: BuildingData
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function BuildingDetailsModal({ building, isOpen, onClose, onUpdate }: BuildingDetailsModalProps) {
  const [units, setUnits] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && building.id) {
      fetchUnits()
    }
  }, [isOpen, building.id])

  const fetchUnits = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/buildings/${building.id}/units`)
      if (response.ok) {
        const data = await response.json()
        setUnits(data.units || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching units:", error)
    } finally {
      setLoading(false)
    }
  }

  const occupancyPercentage = Math.round(building.occupancyRate * 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6" />
            {building.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              <p className="font-semibold text-black">{building.location}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                <span>Total Units</span>
              </div>
              <p className="font-semibold text-black">{building.totalUnits}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Occupied</span>
              </div>
              <p className="font-semibold text-black">{building.occupiedUnits}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Revenue</span>
              </div>
              <p className="font-semibold text-black">${building.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black">Occupancy Rate</span>
              <span className="text-lg font-bold text-black">{occupancyPercentage}%</span>
            </div>
            <Progress value={occupancyPercentage} className="h-3" />
          </div>

          {/* Units List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-black flex items-center gap-2">
              <Home className="h-5 w-5" />
              Units in this Property
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : units.length > 0 ? (
              <div className="space-y-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">{unit.unit_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {unit.bedrooms} bed • {unit.bathrooms} bath
                      </p>
                    </div>
                    <Badge variant={unit.status === "occupied" ? "default" : "secondary"}>
                      {unit.status || "available"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No units found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
