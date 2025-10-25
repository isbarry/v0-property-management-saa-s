"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { ReservationTimeline } from "@/components/dashboard/reservation-timeline"
import { OccupancyGauge } from "@/components/dashboard/occupancy-gauge"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ComprehensiveRevenueChart } from "@/components/dashboard/comprehensive-revenue-chart"
import { MaintenanceAlerts } from "@/components/dashboard/maintenance-alerts"
import { UpcomingCheckInsCheckOuts } from "@/components/dashboard/upcoming-checkins-checkouts"
import { Button } from "@/components/ui/button"
import { Plus, FileText, ChevronLeft, Building2 } from "lucide-react"
import { AddReservationModal } from "@/components/properties/add-reservation-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import type { Property } from "@/lib/types/database"

export default function DashboardPage() {
  const router = useRouter()
  const [showLogoZoom, setShowLogoZoom] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("showLogoTransition") === "true"
    }
    return false
  })
  const [metrics, setMetrics] = useState(null)
  const [properties, setProperties] = useState([])
  const [reservations, setReservations] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [propertySelectOpen, setPropertySelectOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [reservationModalOpen, setReservationModalOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [selectionStep, setSelectionStep] = useState<"building" | "unit">("building")

  useEffect(() => {
    if (showLogoZoom) {
      sessionStorage.removeItem("showLogoTransition")

      const timer = setTimeout(() => {
        setShowLogoZoom(false)
      }, 6000)

      return () => clearTimeout(timer)
    }
  }, [showLogoZoom])

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          router.push("/")
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [metricsRes, propertiesRes, reservationsRes, tenantsRes, paymentsRes, maintenanceRes, blockedDatesRes] =
        await Promise.all([
          fetch("/api/dashboard/metrics"),
          fetch("/api/properties"),
          fetch("/api/reservations"),
          fetch("/api/tenants"),
          fetch("/api/payments"),
          fetch("/api/maintenance-requests"),
          fetch("/api/blocked-dates"),
        ])

      const metricsData = await metricsRes.json()
      const propertiesData = await propertiesRes.json()
      const reservationsData = await reservationsRes.json()
      const tenantsData = await tenantsRes.json()
      const paymentsData = await paymentsRes.json()
      const maintenanceData = await maintenanceRes.json()
      const blockedDatesData = await blockedDatesRes.json()

      setMetrics(metricsData.metrics)
      setProperties(propertiesData.properties || [])
      setReservations(reservationsData.reservations || [])
      setBlockedDates(blockedDatesData.blocked_dates || [])
      setTenants(tenantsData.tenants || [])
      setPayments(paymentsData.payments || [])
      setMaintenanceRequests(maintenanceData.requests || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const monthlyRevenue = useMemo(() => {
    return reservations.reduce(
      (acc, reservation) => {
        const checkInDate = new Date(reservation.check_in)
        const month = checkInDate.toLocaleString("en-US", { month: "long", year: "numeric" })
        const existing = acc.find((item) => item.month === month)

        const realized = Number(reservation.paid_amount) || 0
        const future = Number(reservation.total_amount) - Number(reservation.paid_amount) || 0

        if (existing) {
          existing.realized += realized
          existing.future += future
          if (!existing.byProperty) {
            existing.byProperty = {}
          }
          if (!existing.byProperty[reservation.property_id]) {
            existing.byProperty[reservation.property_id] = { realized: 0, future: 0 }
          }
          existing.byProperty[reservation.property_id].realized += realized
          existing.byProperty[reservation.property_id].future += future
        } else {
          acc.push({
            month,
            realized,
            future,
            byProperty: {
              [reservation.property_id]: { realized, future },
            },
          })
        }
        return acc
      },
      [reservations],
    )
  }, [reservations])

  const handleBuildingSelect = (buildingName: string) => {
    setSelectedBuilding(buildingName)
    setSelectionStep("unit")
  }

  const handleBackToBuildings = () => {
    setSelectedBuilding(null)
    setSelectionStep("building")
  }

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property)
    setPropertySelectOpen(false)
    setSelectedBuilding(null)
    setSelectionStep("building")
    setReservationModalOpen(true)
  }

  const handleReservationSuccess = () => {
    if (user) {
      fetchData()
    }
  }

  const buildingGroups = properties.reduce(
    (acc, property) => {
      if (property.building_name) {
        const buildingName = property.building_name
        if (!acc[buildingName]) {
          acc[buildingName] = []
        }
        acc[buildingName].push(property)
      }
      return acc
    },
    {} as Record<string, Property[]>,
  )

  const unitsInBuilding = selectedBuilding ? buildingGroups[selectedBuilding] || [] : []

  const dashboardSkeleton = (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Revenue chart skeleton */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Timeline skeleton */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Bottom grid skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
            <div className="h-40 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Logo animation overlay - shows on top while dashboard loads in background */}
      {showLogoZoom && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          style={{
            animation: "logoOverlayFadeOut 6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        >
          <div
            className="relative"
            style={{
              animation: "logoZoomIn 5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
            }}
          >
            <Image src="/logo.svg" alt="Logo" width={150} height={150} className="w-[150px] h-[150px]" priority />
          </div>
          <style jsx>{`
            @keyframes logoZoomIn {
              0% {
                transform: scale(3);
                opacity: 1;
              }
              100% {
                transform: scale(10);
                opacity: 1;
              }
            }
            @keyframes logoOverlayFadeOut {
              0%,
              83.33% {
                opacity: 1;
              }
              100% {
                opacity: 0;
                pointer-events: none;
              }
            }
          `}</style>
        </div>
      )}

      {/* Dashboard content - loads in background while logo plays */}
      {loading || !user ? (
        dashboardSkeleton
      ) : (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPropertySelectOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Reservation
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>

          {metrics && <DashboardMetrics metrics={metrics} />}

          <ComprehensiveRevenueChart data={monthlyRevenue} properties={properties} />

          <ReservationTimeline
            reservations={reservations}
            properties={properties}
            tenants={tenants}
            blockedDates={blockedDates}
          />

          <div className="grid gap-6 md:grid-cols-3">
            {metrics && <OccupancyGauge rate={metrics.occupancyRate} />}
            <MaintenanceAlerts requests={maintenanceRequests} properties={properties} />
            <UpcomingCheckInsCheckOuts reservations={reservations} properties={properties} />
          </div>

          <RecentActivity
            reservations={reservations}
            properties={properties}
            maintenanceRequests={maintenanceRequests}
          />

          <Dialog
            open={propertySelectOpen}
            onOpenChange={(open) => {
              setPropertySelectOpen(open)
              if (!open) {
                setSelectedBuilding(null)
                setSelectionStep("building")
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectionStep === "building" ? "Select Properties" : `Select Unit in ${selectedBuilding}`}
                </DialogTitle>
                <DialogDescription>
                  {selectionStep === "building"
                    ? "Choose a property to view available units"
                    : "Choose a unit to create a reservation for"}
                </DialogDescription>
              </DialogHeader>

              {selectionStep === "unit" && (
                <Button variant="ghost" size="sm" onClick={handleBackToBuildings} className="w-fit">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Button>
              )}

              <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-3 p-1">
                  {selectionStep === "building" && (
                    <>
                      {Object.keys(buildingGroups).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No properties available.</p>
                          <p className="text-sm mt-2">Add a property with units first to create reservations.</p>
                        </div>
                      ) : (
                        Object.entries(buildingGroups).map(([buildingName, units]) => (
                          <button
                            key={buildingName}
                            onClick={() => handleBuildingSelect(buildingName)}
                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                          >
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{buildingName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {units.length} {units.length === 1 ? "unit" : "units"} available
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  )}

                  {selectionStep === "unit" && (
                    <>
                      {unitsInBuilding.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No units available in this building.</p>
                        </div>
                      ) : (
                        unitsInBuilding.map((property) => (
                          <button
                            key={property.id}
                            onClick={() => handlePropertySelect(property)}
                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                          >
                            {property.images && property.images.length > 0 ? (
                              <img
                                src={property.images[0] || "/placeholder.svg"}
                                alt={property.unit_name}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No image</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{property.unit_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {property.bedrooms} bed • {property.bathrooms} bath
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <AddReservationModal
            property={selectedProperty}
            open={reservationModalOpen}
            onOpenChange={setReservationModalOpen}
            onSuccess={handleReservationSuccess}
          />
        </div>
      )}
    </>
  )
}
