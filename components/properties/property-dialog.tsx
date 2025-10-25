"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, Plus, FileText } from "lucide-react"
import type { Location } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"

const AMENITIES_OPTIONS = [
  { id: "ac", label: "Air Conditioning (AC)" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Parking" },
  { id: "heating", label: "Heating" },
  { id: "kitchen", label: "Kitchen" },
  { id: "washer", label: "Washer" },
  { id: "dryer", label: "Dryer" },
  { id: "tv", label: "TV" },
  { id: "pool", label: "Pool" },
]

interface PropertyDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  property?: any | null
}

export function PropertyDialog({ open, onClose, onSuccess, property }: PropertyDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    locationId: "",
    buildingId: "", // Added building ID field
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    status: "active",
    unit_name: "", // Updated for unit name
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [showNewLocationInput, setShowNewLocationInput] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [addingLocation, setAddingLocation] = useState(false)

  const [buildings, setBuildings] = useState<any[]>([])
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [showNewBuildingInput, setShowNewBuildingInput] = useState(false)
  const [newBuildingName, setNewBuildingName] = useState("")
  const [addingBuilding, setAddingBuilding] = useState(false)

  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [existingDocuments, setExistingDocuments] = useState<Array<{ name: string; url: string }>>([])

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchLocations()
      fetchBuildings() // Fetch buildings when dialog opens
    }
  }, [open])

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

  const fetchBuildings = async () => {
    setLoadingBuildings(true)
    try {
      const response = await fetch("/api/buildings")
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching buildings:", error)
    } finally {
      setLoadingBuildings(false)
    }
  }

  const handleAddNewLocation = async () => {
    if (!newLocationName.trim()) return

    setAddingLocation(true)
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocationName.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setLocations((prev) => [...prev, data.location])
        setFormData((prev) => ({ ...prev, locationId: data.location.id.toString() }))
        setNewLocationName("")
        setShowNewLocationInput(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to add location")
      }
    } catch (error) {
      console.error("[v0] Error adding location:", error)
      alert("Failed to add location")
    } finally {
      setAddingLocation(false)
    }
  }

  const handleAddNewBuilding = async () => {
    if (!newBuildingName.trim()) return

    setAddingBuilding(true)
    try {
      const response = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBuildingName.trim(),
          location_id: formData.locationId ? Number(formData.locationId) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBuildings((prev) => [...prev, data.building])
        setFormData((prev) => ({ ...prev, buildingId: data.building.id.toString() }))
        setNewBuildingName("")
        setShowNewBuildingInput(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to add building")
      }
    } catch (error) {
      console.error("[v0] Error adding building:", error)
      alert("Failed to add building")
    } finally {
      setAddingBuilding(false)
    }
  }

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || "",
        locationId: property.location_id?.toString() || "",
        buildingId: property.building_id?.toString() || "none", // Default to "none" instead of empty string
        type: property.property_type || "apartment",
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        amenities: property.amenities || [],
        status: property.status || "active",
        unit_name: property.unit_name || "", // Updated for unit name
      })
      setExistingImages(property.images || [])
      setExistingDocuments(property.documents || [])
      setImagePreviews([])
      setImageFiles([])
      setDocumentFiles([])
    } else {
      setFormData({
        name: "",
        locationId: "",
        buildingId: "none",
        type: "apartment",
        bedrooms: 1,
        bathrooms: 1,
        amenities: [],
        status: "active",
        unit_name: "", // Updated for unit name
      })
      setExistingImages([])
      setExistingDocuments([])
      setImagePreviews([])
      setImageFiles([])
      setDocumentFiles([])
    }
    setShowNewLocationInput(false)
    setNewLocationName("")
    setShowNewBuildingInput(false)
    setNewBuildingName("")
  }, [property, open])

  const MAX_FILE_SIZE = 4.5 * 1024 * 1024 // 4.5MB

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)

      if (oversizedFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: `Some files exceed the 4.5MB limit. Please choose smaller images.`,
          variant: "destructive",
        })
        return
      }

      setImageFiles((prev) => [...prev, ...files])

      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)

      if (oversizedFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: `Some files exceed the 4.5MB limit. Please choose smaller documents.`,
          variant: "destructive",
        })
        return
      }

      setDocumentFiles((prev) => [...prev, ...files])
    }
  }

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const uploadedImageUrls: string[] = []

      if (imageFiles.length > 0) {
        setUploading(true)

        for (const file of imageFiles) {
          try {
            const formData = new FormData()
            formData.append("file", file)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!uploadResponse.ok) {
              let errorMessage = "Failed to upload image"
              try {
                const errorData = await uploadResponse.json()
                errorMessage = errorData.error || errorMessage
              } catch (parseError) {
                console.error("[v0] Failed to parse upload error response:", parseError)
                errorMessage = `Upload failed with status ${uploadResponse.status}`
              }
              throw new Error(errorMessage)
            }

            const { url } = await uploadResponse.json()
            uploadedImageUrls.push(url)
          } catch (uploadError) {
            console.error("[v0] Image upload error:", uploadError)
            throw new Error(`Failed to upload image: ${file.name}`)
          }
        }
        setUploading(false)
      }

      const uploadedDocuments: Array<{ name: string; url: string }> = []

      if (documentFiles.length > 0) {
        setUploading(true)

        for (const file of documentFiles) {
          try {
            const formData = new FormData()
            formData.append("file", file)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!uploadResponse.ok) {
              let errorMessage = "Failed to upload document"
              try {
                const errorData = await uploadResponse.json()
                errorMessage = errorData.error || errorMessage
              } catch (parseError) {
                console.error("[v0] Failed to parse upload error response:", parseError)
                errorMessage = `Upload failed with status ${uploadResponse.status}`
              }
              throw new Error(errorMessage)
            }

            const { url } = await uploadResponse.json()
            uploadedDocuments.push({
              name: file.name,
              url,
            })
          } catch (uploadError) {
            console.error("[v0] Document upload error:", uploadError)
            throw new Error(`Failed to upload document: ${file.name}`)
          }
        }
        setUploading(false)
      }

      const allImages = [...existingImages, ...uploadedImageUrls]
      const allDocuments = [...existingDocuments, ...uploadedDocuments]

      const selectedLocation = locations.find((loc) => loc.id.toString() === formData.locationId)
      const selectedBuilding = buildings.find((bld) => bld.id.toString() === formData.buildingId)

      const buildingId = formData.buildingId === "none" || !formData.buildingId ? null : Number(formData.buildingId)
      const buildingName = buildingId ? selectedBuilding?.name || "" : ""

      const propertyData = {
        name: formData.name,
        location: selectedLocation?.name || "",
        location_id: formData.locationId ? Number(formData.locationId) : null,
        building_name: buildingName,
        building_id: buildingId,
        property_type: formData.type,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        amenities: formData.amenities,
        images: allImages,
        documents: allDocuments,
        status: formData.status,
        unit_name: formData.unit_name,
      }

      console.log("[v0] Submitting property data:", propertyData)

      const url = property ? `/api/properties/${property.id}` : "/api/properties"
      const method = property ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        let errorMessage = "Failed to save property"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            const textError = await response.text()
            console.error("[v0] Non-JSON error response:", textError)
            errorMessage = `Failed to save property (Status: ${response.status})`
          }
        } catch (parseError) {
          console.error("[v0] Failed to parse error response:", parseError)
          errorMessage = `Failed to save property (Status: ${response.status})`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("[v0] Property saved successfully:", result)

      if (uploadedDocuments.length > 0) {
        toast({
          title: "Documents Uploaded",
          description: `Successfully uploaded ${uploadedDocuments.length} document${uploadedDocuments.length > 1 ? "s" : ""}.`,
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("[v0] Error saving property:", error)
      alert(`Failed to save property: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const allDisplayImages = [...existingImages, ...imagePreviews]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add New Property"}</DialogTitle>
          <DialogDescription>
            {property
              ? "Update the property details below."
              : "Fill in the details to add a new property to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Property Images</Label>
              {allDisplayImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {existingImages.map((img, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF or WEBP (multiple files)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
              </label>
            </div>

            <div className="grid gap-2">
              <Label>Property Documents</Label>
              {(existingDocuments.length > 0 || documentFiles.length > 0) && (
                <div className="space-y-2 mb-2">
                  {existingDocuments.map((doc, index) => (
                    <div
                      key={`existing-doc-${index}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeExistingDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {documentFiles.map((file, index) => (
                    <div
                      key={`new-doc-${index}`}
                      className="flex items-center justify-between rounded-lg border border-primary/50 bg-primary/5 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeNewDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <FileText className="w-6 h-6 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload documents</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT (max 4.5MB each)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleDocumentChange}
                />
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit_name">Unit Name</Label>
              <Input
                id="unit_name"
                value={formData.unit_name}
                onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                placeholder="e.g., Sunset Villa, Apt 301"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              {!showNewLocationInput ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) => {
                      if (value === "add_new") {
                        setShowNewLocationInput(true)
                      } else {
                        setFormData({ ...formData, locationId: value })
                      }
                    }}
                    disabled={loadingLocations}
                  >
                    <SelectTrigger id="location" className="flex-1">
                      <SelectValue placeholder={loadingLocations ? "Loading..." : "Select a location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-primary font-medium">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Location
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Enter new location name"
                    disabled={addingLocation}
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewLocation}
                    disabled={addingLocation || !newLocationName.trim()}
                  >
                    {addingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewLocationInput(false)
                      setNewLocationName("")
                    }}
                    disabled={addingLocation}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="property">Property Name</Label>
              {!showNewBuildingInput ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) => {
                      if (value === "add_new") {
                        setShowNewBuildingInput(true)
                      } else {
                        setFormData({ ...formData, buildingId: value })
                      }
                    }}
                    disabled={loadingBuildings}
                  >
                    <SelectTrigger id="property" className="flex-1">
                      <SelectValue placeholder={loadingBuildings ? "Loading..." : "Select a property (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id.toString()}>
                          {building.name}
                          {building.location_name && ` (${building.location_name})`}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-primary font-medium">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Property
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    placeholder="Enter new property name"
                    disabled={addingBuilding}
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewBuilding}
                    disabled={addingBuilding || !newBuildingName.trim()}
                  >
                    {addingBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewBuildingInput(false)
                      setNewBuildingName("")
                    }}
                    disabled={addingBuilding}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Property Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity.id}
                      checked={formData.amenities.includes(amenity.id)}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                    />
                    <label
                      htmlFor={amenity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading || !formData.locationId}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : property ? (
                "Save Changes"
              ) : (
                "Add Property"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
