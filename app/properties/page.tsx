"use client"

import { useEffect, useState } from "react"
import { PropertyGrid } from "@/components/properties/property-grid"
import { BuildingGrid } from "@/components/properties/building-grid"
import { PropertyDialog } from "@/components/properties/property-dialog"
import { PropertyFilters, type FilterState } from "@/components/properties/property-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"
import type { Property } from "@/lib/types/database"
import type { BuildingData } from "@/components/properties/building-card"

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<"units" | "properties">("units")
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [allBuildings, setAllBuildings] = useState<BuildingData[]>([])
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching data for view mode:", viewMode)

      if (viewMode === "units") {
        const res = await fetch("/api/properties")
        const data = await res.json()
        console.log(`[v0] Loaded ${data.properties?.length || 0} units`)
        setAllProperties(data.properties || [])
        setFilteredProperties(data.properties || [])
      } else {
        const res = await fetch("/api/buildings/aggregated")
        const data = await res.json()
        console.log(`[v0] Loaded ${data.buildings?.length || 0} buildings`)
        setAllBuildings(data.buildings || [])
        setFilteredBuildings(data.buildings || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [viewMode])

  const handleFilterChange = (filters: FilterState) => {
    console.log("[v0] Applying filters:", filters)

    if (viewMode === "units") {
      let filtered = [...allProperties]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.unit_name.toLowerCase().includes(searchLower) ||
            (p.location && p.location.toLowerCase().includes(searchLower)),
        )
      }

      if (filters.locationId !== "all") {
        const locationId = Number.parseInt(filters.locationId)
        filtered = filtered.filter((p) => p.location_id === locationId)
      }

      if (filters.propertyType !== "all") {
        filtered = filtered.filter((p) => p.property_type === filters.propertyType)
      }

      if (filters.bedrooms !== "all") {
        const minBedrooms = Number.parseInt(filters.bedrooms)
        filtered = filtered.filter((p) => p.bedrooms && p.bedrooms >= minBedrooms)
      }

      if (filters.bathrooms !== "all") {
        const minBathrooms = Number.parseInt(filters.bathrooms)
        filtered = filtered.filter((p) => p.bathrooms && p.bathrooms >= minBathrooms)
      }

      if (filters.amenities.length > 0) {
        filtered = filtered.filter((p) => {
          const propertyAmenities = p.amenities || []
          return filters.amenities.every((amenity) => propertyAmenities.includes(amenity))
        })
      }

      console.log(`[v0] Filtered ${filtered.length} units from ${allProperties.length}`)
      setFilteredProperties(filtered)
    } else {
      let filtered = [...allBuildings]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(
          (b) =>
            b.name.toLowerCase().includes(searchLower) ||
            (b.location && b.location.toLowerCase().includes(searchLower)),
        )
      }

      if (filters.propertyType !== "all") {
        filtered = filtered.filter((b) => b.property_type === filters.propertyType)
      }

      console.log(`[v0] Filtered ${filtered.length} buildings from ${allBuildings.length}`)
      setFilteredBuildings(filtered)
    }
  }

  const handleDataUpdated = () => {
    fetchData()
  }

  const propertiesSkeleton = (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-36 bg-muted animate-pulse rounded" />
      </div>

      {/* Filters skeleton */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="h-48 bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return propertiesSkeleton
  }

  const displayCount = viewMode === "units" ? filteredProperties.length : filteredBuildings.length
  const totalCount = viewMode === "units" ? allProperties.length : allBuildings.length

  return (
    <MinimumLoadingWrapper minimumMs={1000} loadingContent={propertiesSkeleton}>
      <div className="mx-auto max-w-7xl space-y-6 p-6" data-onboarding="properties-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Properties</h1>
            <p className="text-sm text-muted-foreground">
              Manage your property portfolio ({displayCount} of {totalCount} {viewMode})
            </p>
          </div>
          <Button
            className="bg-[#3B82F6] hover:bg-[#2563EB]"
            onClick={() => setDialogOpen(true)}
            data-onboarding="add-property"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        <PropertyFilters onFilterChange={handleFilterChange} viewMode={viewMode} onViewModeChange={setViewMode} />

        {viewMode === "units" ? (
          <PropertyGrid properties={filteredProperties} onUpdate={handleDataUpdated} />
        ) : (
          <BuildingGrid buildings={filteredBuildings} onUpdate={handleDataUpdated} />
        )}

        <PropertyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={handleDataUpdated} />
      </div>
    </MinimumLoadingWrapper>
  )
}
