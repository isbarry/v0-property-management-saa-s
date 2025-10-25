"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import type { Property } from "@/lib/types"

interface MaintenanceModalProps {
  property: Property
  isOpen: boolean
  onClose: () => void
}

export function MaintenanceModal({ property, isOpen, onClose }: MaintenanceModalProps) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(property.status === "maintenance")
  const [endDate, setEndDate] = useState(property.maintenanceEndDate || "")

  const handleSave = () => {
    // In a real app, this would update the property status
    console.log("Updating maintenance status:", {
      propertyId: property.id,
      isUnderMaintenance,
      endDate,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold text-foreground">Maintenance Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">{property.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-toggle" className="text-sm font-medium text-foreground">
                Under Maintenance
              </Label>
              <p className="text-xs text-muted-foreground">Block this property from new reservations</p>
            </div>
            <Switch id="maintenance-toggle" checked={isUnderMaintenance} onCheckedChange={setIsUnderMaintenance} />
          </div>

          {isUnderMaintenance && (
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-foreground">
                Expected End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
