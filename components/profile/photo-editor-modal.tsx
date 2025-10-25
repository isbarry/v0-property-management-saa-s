"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, RotateCw, Loader2 } from "lucide-react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"

interface PhotoEditorModalProps {
  open: boolean
  onClose: () => void
  imageFile: File | null
  onSave: (editedBlob: Blob) => Promise<void>
}

export function PhotoEditorModal({ open, onClose, imageFile, onSave }: PhotoEditorModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageFile) {
      console.log("[v0] Creating object URL for image file")
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)

      return () => {
        console.log("[v0] Cleaning up object URL")
        URL.revokeObjectURL(url)
      }
    }
  }, [imageFile])

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const createCroppedImage = async (): Promise<Blob> => {
    if (!imageUrl || !croppedAreaPixels) {
      throw new Error("No image or crop area")
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = "anonymous"

      image.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        // Set canvas to output size (circular profile photo)
        const outputSize = 400
        canvas.width = outputSize
        canvas.height = outputSize

        // Create circular clipping path
        ctx.beginPath()
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.clip()

        // Calculate scaling to fit the cropped area into the output size
        const scaleX = outputSize / croppedAreaPixels.width
        const scaleY = outputSize / croppedAreaPixels.height

        // Draw the cropped portion of the image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outputSize,
          outputSize,
        )

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          "image/jpeg",
          0.95,
        )
      }

      image.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      image.src = imageUrl
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const blob = await createCroppedImage()
      await onSave(blob)
      onClose()
    } catch (error) {
      console.error("[v0] Failed to save edited photo:", error)
      alert("Failed to save photo. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="relative" style={{ height: 400 }}>
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider value={[zoom]} onValueChange={handleZoomChange} min={1} max={3} step={0.1} className="w-full" />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation
              </Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleRotate} className="w-full bg-transparent">
                  Rotate 90°
                </Button>
                <span className="text-sm text-muted-foreground min-w-[40px]">{rotation}°</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
