"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, SlidersHorizontal, X, Building2, Home } from "lucide-react"
import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Location } from "@/lib/types/database"

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterState) => void
  viewMode?: "units" | "properties"
  onViewModeChange?: (mode: "units" | "properties") => void
}

export interface FilterState {
  search: string
  locationId: string
  bedrooms: string
  bathrooms: string
  amenities: string[]
  propertyType: string
  availableDateStart: string
  availableDateEnd: string
}

export function PropertyFilters({ onFilterChange, viewMode = "units", onViewModeChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    locationId: "all",
    bedrooms: "all",
    bathrooms: "all",
    amenities: [],
    propertyType: "all",
    availableDateStart: "",
    availableDateEnd: "",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching locations:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter((a) => a !== amenityId)
      : [...filters.amenities, amenityId]
    updateFilters({ amenities: newAmenities })
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: "",
      locationId: "all",
      bedrooms: "all",
      bathrooms: "all",
      amenities: [],
      propertyType: "all",
      availableDateStart: "",
      availableDateEnd: "",
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters =
    filters.search ||
    filters.locationId !== "all" ||
    filters.bedrooms !== "all" ||
    filters.bathrooms !== "all" ||
    filters.amenities.length > 0 ||
    filters.propertyType !== "all" ||
    filters.availableDateStart ||
    filters.availableDateEnd

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button
            variant={viewMode === "units" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("units")}
            className={viewMode === "units" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
          >
            <Home className="mr-2 h-4 w-4" />
            Units
          </Button>
          <Button
            variant={viewMode === "properties" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("properties")}
            className={viewMode === "properties" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Properties
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={viewMode === "units" ? "Search units..." : "Search properties..."}
              className="pl-9"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.locationId}
              onValueChange={(value) => updateFilters({ locationId: value })}
              disabled={loadingLocations}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={loadingLocations ? "Loading..." : "All Locations"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.propertyType} onValueChange={(value) => updateFilters({ propertyType: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Advanced Filters
                  {hasActiveFilters && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      !
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter {viewMode === "units" ? "Units" : "Properties"}</h4>
                    <p className="text-sm text-muted-foreground">Refine your search</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Select value={filters.bedrooms} onValueChange={(value) => updateFilters({ bedrooms: value })}>
                          <SelectTrigger id="bedrooms">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Select
                          value={filters.bathrooms}
                          onValueChange={(value) => updateFilters({ bathrooms: value })}
                        >
                          <SelectTrigger id="bathrooms">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amenities</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                        {AMENITIES_OPTIONS.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${amenity.id}`}
                              checked={filters.amenities.includes(amenity.id)}
                              onCheckedChange={() => toggleAmenity(amenity.id)}
                            />
                            <label
                              htmlFor={`filter-${amenity.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {amenity.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Available Dates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="date-start" className="text-xs text-muted-foreground">
                            Start Date
                          </Label>
                          <Input
                            id="date-start"
                            type="date"
                            value={filters.availableDateStart}
                            onChange={(e) => updateFilters({ availableDateStart: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="date-end" className="text-xs text-muted-foreground">
                            End Date
                          </Label>
                          <Input
                            id="date-end"
                            type="date"
                            value={filters.availableDateEnd}
                            onChange={(e) => updateFilters({ availableDateEnd: e.target.value })}
                            className="text-sm"
                            min={filters.availableDateStart}
                          />
                        </div>
                      </div>
                      {filters.availableDateStart && filters.availableDateEnd && (
                        <p className="text-xs text-muted-foreground">
                          Showing {viewMode} available from {new Date(filters.availableDateStart).toLocaleDateString()}{" "}
                          to {new Date(filters.availableDateEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

const AMENITIES_OPTIONS = [
  { id: "ac", label: "Air Conditioning" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Parking" },
  { id: "heating", label: "Heating" },
  { id: "kitchen", label: "Kitchen" },
  { id: "washer", label: "Washer" },
  { id: "dryer", label: "Dryer" },
  { id: "tv", label: "TV" },
  { id: "pool", label: "Pool" },
]
