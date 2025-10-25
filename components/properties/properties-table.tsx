"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import type { Property } from "@/lib/types"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { useState } from "react"

interface PropertiesTableProps {
  properties: Property[]
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
}

export function PropertiesTable({ properties, onEdit, onDelete }: PropertiesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-success/10 text-success border-success/20"
      case "vacant":
        return "bg-warning/10 text-warning border-warning/20"
      case "maintenance":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: Property["status"]) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GM", {
      style: "currency",
      currency: "GMD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            <div className="relative h-48 w-full">
              <Image src={property.imageUrl || "/placeholder.svg"} alt={property.name} fill className="object-cover" />
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(property)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId(property.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{property.name}</h3>
                <Badge variant="outline" className={getStatusColor(property.status)}>
                  {getStatusLabel(property.status)}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{property.address}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Standard Rate</p>
                  <p className="font-semibold text-foreground">{formatCurrency(property.standardRate)}</p>
                </div>
                {property.maintenanceEndDate && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(property.maintenanceEndDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId)
                  setDeleteId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
