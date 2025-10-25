"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import type { Property } from "@/lib/types/database"

interface DeletePropertyDialogProps {
  open: boolean
  onClose: () => void
  property: Property
  onSuccess: () => void
}

export function DeletePropertyDialog({ open, onClose, property, onSuccess }: DeletePropertyDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      console.log("[v0] Deleting property:", property.id)

      const response = await fetch(`/api/properties/${property.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Delete error:", errorData)
        throw new Error(errorData.error || "Failed to delete property")
      }

      console.log("[v0] Property deleted successfully")
      onSuccess()
    } catch (error) {
      console.error("[v0] Error deleting property:", error)
      alert(`Failed to delete property: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Property</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{property.name}</strong>? This action cannot be undone and will also
            remove all associated reservations and data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Property"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
