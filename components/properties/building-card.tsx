"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, DollarSign, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export interface BuildingData {
  id: number
  name: string
  location: string
  totalUnits: number
  occupiedUnits: number
  totalRevenue: number
  occupancyRate: number
  image?: string
  property_type?: string
}

interface BuildingCardProps {
  building: BuildingData
  onClick: (building: BuildingData) => void
}

export function BuildingCard({ building, onClick }: BuildingCardProps) {
  const occupancyPercentage = Math.round(building.occupancyRate * 100)

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={() => onClick(building)}
    >
      {/* Building Image or Icon */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        {building.image ? (
          <img src={building.image || "/placeholder.svg"} alt={building.name} className="w-full h-full object-cover" />
        ) : (
          <Building2 className="h-20 w-20 text-blue-400" />
        )}
        {building.property_type && (
          <Badge className="absolute top-3 right-3 bg-white text-black border">{building.property_type}</Badge>
        )}
      </div>

      {/* Building Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-black">{building.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{building.location}</span>
          </div>
        </div>

        {/* Units Count */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-black font-medium">
            {building.occupiedUnits}/{building.totalUnits} Units Occupied
          </span>
        </div>

        {/* Revenue */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-black font-medium">${building.totalRevenue.toLocaleString()} Total Revenue</span>
        </div>

        {/* Occupancy Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Occupancy Rate</span>
            <span className="font-semibold text-black">{occupancyPercentage}%</span>
          </div>
          <Progress value={occupancyPercentage} className="h-2" />
        </div>
      </div>
    </Card>
  )
}
