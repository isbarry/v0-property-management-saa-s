"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryAdded: () => void
}

export function AddCategoryModal({ open, onOpenChange, onCategoryAdded }: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState("#6B7280")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!categoryName.trim()) {
      setError("Category name is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          display_name: categoryName.trim(),
          color: categoryColor,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create category")
      }

      // Reset form and close modal
      setCategoryName("")
      setCategoryColor("#6B7280")
      onOpenChange(false)
      onCategoryAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name *</Label>
            <Input
              id="category-name"
              placeholder="e.g., Landscaping"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="category-color"
                type="color"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
                disabled={submitting}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
                disabled={submitting}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
