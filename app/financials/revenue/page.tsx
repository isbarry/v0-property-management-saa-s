"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts"
import { FileDown, ArrowUpRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SVGDonutChart } from "@/components/ui/svg-donut-chart"

const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const formatCurrency = (value: any): string => {
  return safeNumber(value).toLocaleString()
}

const REVENUE_SHARE_COLORS = ["#8B5CF6", "#EC4899", "#06B6D4", "#6366F1", "#F97316"]
const propertyColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function RevenuePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<any>(null)

  // Date ranges
  const [revenueDateRange, setRevenueDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })
  const [adrDateRange, setAdrDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })
  const [revenueShareDateRange, setRevenueShareDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })

  // Filters
  const [selectedRevenueBuilding, setSelectedRevenueBuilding] = useState<string | null>(null)
  const [selectedRevenueUnits, setSelectedRevenueUnits] = useState<Set<number>>(new Set())
  const [selectedADRProperties, setSelectedADRProperties] = useState<string[]>([])
  const [selectedADRBuilding, setSelectedADRBuilding] = useState<string | null>(null)

  // Payment filters
  const [paymentPropertyFilter, setPaymentPropertyFilter] = useState<string>("all")
  const [paymentAmountMin, setPaymentAmountMin] = useState<string>("")
  const [paymentAmountMax, setPaymentAmountMax] = useState<string>("")
  const [paymentDateFrom, setPaymentDateFrom] = useState<string>("")
  const [paymentDateTo, setPaymentDateTo] = useState<string>("")

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        adrStartDate: adrDateRange.start.toISOString(),
        adrEndDate: adrDateRange.end.toISOString(),
        revenueStartDate: revenueDateRange.start.toISOString(),
        revenueEndDate: revenueDateRange.end.toISOString(),
        revenueShareStartDate: revenueShareDateRange.start.toISOString(),
        revenueShareEndDate: revenueShareDateRange.end.toISOString(),
      })
      const response = await fetch(`/api/financials/metrics?${params}`)
      if (!response.ok) throw new Error("Failed to fetch financial data")
      const data = await response.json()

      setFinancialData(data)

      // Initialize selected properties
      if (data.properties) {
        const propertyIds = data.properties.map((p: { id: string }) => p.id)
        setSelectedADRProperties(propertyIds)
        const allUnitIds = new Set<number>()
        data.properties.forEach((p: any) => allUnitIds.add(p.id))
        setSelectedRevenueUnits(allUnitIds)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [adrDateRange, revenueDateRange, revenueShareDateRange, toast])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const properties = useMemo(() => financialData?.properties || [], [financialData?.properties])
  const reservations = useMemo(() => financialData?.reservations || [], [financialData?.reservations])
  const revenueTimelineData = useMemo(
    () => financialData?.revenueTimelineData || [],
    [financialData?.revenueTimelineData],
  )
  const ADRData = useMemo(() => financialData?.ADRData || [], [financialData?.ADRData])
  const revenueByRentalType = useMemo(
    () => financialData?.revenueByRentalType || [],
    [financialData?.revenueByRentalType],
  )
  const propertyPerformanceMetrics = useMemo(
    () => financialData?.propertyPerformanceMetrics || [],
    [financialData?.propertyPerformanceMetrics],
  )
  const transactionHistory = useMemo(() => financialData?.transactionHistory || [], [financialData?.transactionHistory])

  const totalRevenue = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.revenue) || 0), 0),
    [propertyPerformanceMetrics],
  )

  const avgOccupancy = useMemo(
    () =>
      propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.occupancy) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  const avgADR = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.adr) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  const avgRevPAR = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.revPAR) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  const revenueBuildingGroups = useMemo(() => {
    const groups = new Map<string, any[]>()
    properties.forEach((property: any) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)?.push(property)
    })
    return groups
  }, [properties])

  const adrBuildingGroups = useMemo(() => {
    const groups = new Map<string, typeof properties>()
    properties.forEach((property) => {
      const buildingName = property.property_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)!.push(property)
    })
    return groups
  }, [properties])

  const dynamicRevenueByRentalType = useMemo(
    () =>
      revenueByRentalType.map((item, index) => ({
        type: item?.type || "Unknown",
        value: Number(item?.value) || 0,
        percentage: Number(item?.percentage) || 0,
        color: item?.color || ["#3B82F6", "#10B981", "#F59E0B"][index % 3],
      })),
    [revenueByRentalType],
  )

  const revenueByPropertyAndType = useMemo(() => {
    const result: Record<string, any[]> = {
      "short-term": [],
      "long-term": [],
      corporate: [],
    }

    reservations.forEach((reservation: any) => {
      const property = properties.find((p: any) => p.id === reservation.property_id)
      if (!property) return

      const type = reservation.reservation_type || "short-term"
      const existingProperty = result[type].find((p: any) => p.propertyId === property.id)

      if (existingProperty) {
        existingProperty.revenue += Number(reservation.paid_amount) || 0
      } else {
        result[type].push({
          propertyId: property.id,
          propertyName: property.unit_name || property.property_name,
          revenue: Number(reservation.paid_amount) || 0,
        })
      }
    })

    // Sort by revenue
    Object.keys(result).forEach((type) => {
      result[type].sort((a, b) => b.revenue - a.revenue)
    })

    console.log("[v0] Revenue by property and type:", result)
    return result
  }, [reservations, properties])

  const revenueShareData = useMemo(() => {
    const buildingRevenue = new Map<string, number>()

    const filteredReservations = reservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in)
      const checkOut = new Date(reservation.check_out)
      return (
        (checkIn >= revenueShareDateRange.start && checkIn <= revenueShareDateRange.end) ||
        (checkOut >= revenueShareDateRange.start && checkOut <= revenueShareDateRange.end) ||
        (checkIn <= revenueShareDateRange.start && checkOut >= revenueShareDateRange.end)
      )
    })

    filteredReservations.forEach((reservation) => {
      const property = properties.find((p) => p.id === reservation.property_id)
      if (!property) return

      const buildingName = property.property_name || property.unit_name
      const currentRevenue = buildingRevenue.get(buildingName) || 0
      buildingRevenue.set(buildingName, currentRevenue + (Number(reservation.paid_amount) || 0))
    })

    const totalRevenue = Array.from(buildingRevenue.values()).reduce((sum, val) => sum + val, 0)

    const data = Array.from(buildingRevenue.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : "0",
      color: REVENUE_SHARE_COLORS[index % REVENUE_SHARE_COLORS.length],
    }))

    return data
  }, [reservations, properties, revenueShareDateRange])

  const actualFilteredRevenueTimelineData = useMemo(() => {
    const data = revenueTimelineData.map((item) => {
      const dataPoint: any = { month: item.month }

      if (selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding)) {
        const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedRevenueUnits.has(unit.id))

        if (allUnitsSelected) {
          let totalRevenue = 0
          buildingUnits.forEach((unit: any) => {
            totalRevenue += item.properties[unit.id] || 0
          })
          dataPoint[selectedRevenueBuilding] = totalRevenue
        } else {
          buildingUnits.forEach((unit: any) => {
            if (selectedRevenueUnits.has(unit.id)) {
              dataPoint[unit.id.toString()] = item.properties[unit.id] || 0
            }
          })
        }
      } else {
        const allPropertiesSelected = selectedRevenueUnits.size === properties.length && properties.length > 0

        if (allPropertiesSelected) {
          let totalRevenue = 0
          properties.forEach((property: any) => {
            totalRevenue += item.properties[property.id] || 0
          })
          dataPoint.total = totalRevenue
        } else {
          properties.forEach((property: any) => {
            if (selectedRevenueUnits.has(property.id)) {
              dataPoint[property.id.toString()] = item.properties[property.id] || 0
            }
          })
        }
      }

      return dataPoint
    })

    return data
  }, [revenueTimelineData, properties, selectedRevenueUnits, selectedRevenueBuilding, revenueBuildingGroups])

  const adrTimelineData = useMemo(() => {
    const data = ADRData.map((item) => {
      const dataPoint: any = { month: item.month, marketADR: item.marketADR }

      if (selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding)) {
        const buildingUnits = adrBuildingGroups.get(selectedADRBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedADRProperties.includes(unit.id))

        if (allUnitsSelected) {
          let totalRevenue = 0
          let totalNights = 0

          buildingUnits.forEach((unit: any) => {
            const unitADR = item.properties[unit.id] || 0
            if (unitADR > 0) {
              totalRevenue += unitADR
              totalNights += 1
            }
          })

          const aggregatedADR = totalNights > 0 ? totalRevenue / totalNights : 0
          dataPoint[selectedADRBuilding] = aggregatedADR
        } else {
          properties.forEach((property) => {
            if (selectedADRProperties.includes(property.id)) {
              dataPoint[property.id.toString()] = item.properties[property.id] || 0
            }
          })
        }
      } else {
        properties.forEach((property) => {
          if (selectedADRProperties.includes(property.id)) {
            dataPoint[property.id.toString()] = item.properties[property.id] || 0
          }
        })
      }

      return dataPoint
    })

    return data
  }, [ADRData, properties, selectedADRProperties, selectedADRBuilding, adrBuildingGroups])

  const toggleRevenueBuilding = useCallback(
    (buildingName: string) => {
      if (selectedRevenueBuilding === buildingName) {
        setSelectedRevenueBuilding(null)
        setSelectedRevenueUnits(new Set())
      } else {
        const buildingUnits = revenueBuildingGroups.get(buildingName) || []
        const buildingUnitIds = new Set(buildingUnits.map((u: any) => u.id))
        setSelectedRevenueBuilding(buildingName)
        setSelectedRevenueUnits(buildingUnitIds)
      }
    },
    [selectedRevenueBuilding, revenueBuildingGroups],
  )

  const toggleRevenueUnit = useCallback(
    (unitId: number) => {
      const newSelectedUnits = new Set(selectedRevenueUnits)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      setSelectedRevenueUnits(newSelectedUnits)

      if (selectedRevenueBuilding) {
        const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => newSelectedUnits.has(unit.id))
        if (!allUnitsSelected) {
          setSelectedRevenueBuilding(null)
        }
      }
    },
    [selectedRevenueUnits, selectedRevenueBuilding, revenueBuildingGroups],
  )

  const selectAllRevenueProperties = useCallback(() => {
    if (selectedRevenueUnits.size === properties.length) {
      setSelectedRevenueUnits(new Set())
      setSelectedRevenueBuilding(null)
    } else {
      const allUnitIds = new Set<number>()
      properties.forEach((p) => allUnitIds.add(p.id))
      setSelectedRevenueUnits(allUnitIds)
      setSelectedRevenueBuilding(null)
    }
  }, [properties, selectedRevenueUnits])

  const getPropertyName = useCallback(
    (propertyId: string | number | null | undefined) => {
      if (propertyId === "Portfolio Wide") return "Portfolio Wide"
      if (!propertyId || propertyId === null || propertyId === undefined) return "Portfolio Wide"
      const property = properties.find((p) => p.id === Number(propertyId))
      return property?.unit_name || "Unknown"
    },
    [properties],
  )

  const filteredRecentPayments = useMemo(() => {
    return transactionHistory
      .filter((transaction: any) => transaction.type === "payment")
      .filter((payment: any) => {
        const matchesProperty = paymentPropertyFilter === "all" || payment.property === paymentPropertyFilter
        const matchesAmount =
          (!paymentAmountMin || payment.amount >= Number.parseFloat(paymentAmountMin)) &&
          (!paymentAmountMax || payment.amount <= Number.parseFloat(paymentAmountMax))
        const paymentDate = new Date(payment.date)
        const matchesDate =
          (!paymentDateFrom || paymentDate >= new Date(paymentDateFrom)) &&
          (!paymentDateTo || paymentDate <= new Date(paymentDateTo))
        return matchesProperty && matchesAmount && matchesDate
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactionHistory, paymentPropertyFilter, paymentAmountMin, paymentAmountMax, paymentDateFrom, paymentDateTo])

  if (loading || !financialData) {
    return (
      <MinimumLoadingWrapper>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading revenue data...</p>
          </div>
        </div>
      </MinimumLoadingWrapper>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue</h1>
        <p className="text-muted-foreground">Track revenue metrics and trends across your portfolio</p>
      </div>

      {/* Revenue Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="font-sans text-2xl font-bold text-foreground">GMD {formatCurrency(totalRevenue)}</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +12% vs last year
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
              <p className="font-sans text-2xl font-bold text-foreground">{avgOccupancy.toFixed(1)}%</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +5% vs last year
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg ADR</p>
              <p className="font-sans text-2xl font-bold text-foreground">GMD {avgADR.toFixed(0)}</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +8% vs last year
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg RevPAR</p>
              <p className="font-sans text-2xl font-bold text-foreground">GMD {avgRevPAR.toFixed(0)}</p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +10% vs last year
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Timeline Chart */}
      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-foreground">Revenue</h2>
              <p className="text-sm text-muted-foreground">Track revenue trends across your portfolio</p>
            </div>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">From:</label>
              <input
                type="date"
                value={revenueDateRange.start.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value)
                  setRevenueDateRange((prev) => ({ ...prev, start: newStart }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">To:</label>
              <input
                type="date"
                value={revenueDateRange.end.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value)
                  setRevenueDateRange((prev) => ({ ...prev, end: newEnd }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentYear = new Date().getFullYear()
                setRevenueDateRange({
                  start: new Date(currentYear, 0, 1),
                  end: new Date(currentYear, 11, 31),
                })
              }}
            >
              Reset to Current Year
            </Button>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Filter by property:</p>
            </div>

            {/* Level 1: Buildings + All Properties */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAllRevenueProperties}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedRevenueUnits.size === properties.length && !selectedRevenueBuilding
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                All Properties
              </button>

              {Array.from(revenueBuildingGroups.entries()).map(([buildingName, units]) => {
                const allUnitsSelected = units.every((unit: any) => selectedRevenueUnits.has(unit.id))
                const someUnitsSelected = units.some((unit: any) => selectedRevenueUnits.has(unit.id))

                return (
                  <button
                    key={buildingName}
                    onClick={() => toggleRevenueBuilding(buildingName)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      allUnitsSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : someUnitsSelected
                          ? "border-blue-300 bg-blue-25 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {buildingName} ({units.length})
                  </button>
                )
              })}
            </div>

            {/* Level 2: Units (shown when a building is selected) */}
            {selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding) && (
              <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                <span className="text-xs font-medium text-muted-foreground">Units:</span>
                {revenueBuildingGroups.get(selectedRevenueBuilding)?.map((unit: any) => (
                  <button
                    key={unit.id}
                    onClick={() => toggleRevenueUnit(unit.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selectedRevenueUnits.has(unit.id)
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {unit.unit_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={actualFilteredRevenueTimelineData}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.month}
                            </span>
                            {payload.map((entry: any, index: number) => (
                              <span key={index} className="font-bold" style={{ color: entry.color }}>
                                {entry.name}: GMD {entry.value.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding)
                ? (() => {
                    const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
                    const allUnitsSelected = buildingUnits.every((unit: any) => selectedRevenueUnits.has(unit.id))

                    if (allUnitsSelected) {
                      return (
                        <Bar
                          key={selectedRevenueBuilding}
                          dataKey={selectedRevenueBuilding}
                          name={selectedRevenueBuilding}
                          fill={propertyColors[0]}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    } else {
                      return buildingUnits
                        .filter((unit: any) => selectedRevenueUnits.has(unit.id))
                        .map((unit: any, index: number) => (
                          <Bar
                            key={unit.id}
                            dataKey={unit.id.toString()}
                            name={unit.unit_name || `Unit ${unit.id}`}
                            fill={propertyColors[index % propertyColors.length]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))
                    }
                  })()
                : (() => {
                    const allPropertiesSelected =
                      selectedRevenueUnits.size === properties.length && properties.length > 0

                    if (allPropertiesSelected) {
                      return (
                        <Bar
                          key="total"
                          dataKey="total"
                          name="All Properties"
                          fill={propertyColors[0]}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    } else {
                      return properties
                        .filter((property: any) => selectedRevenueUnits.has(property.id))
                        .map((property: any, index: number) => (
                          <Bar
                            key={property.id}
                            dataKey={property.id.toString()}
                            name={property.unit_name || property.property_name || `Property ${property.id}`}
                            fill={propertyColors[index % propertyColors.length]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))
                    }
                  })()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ADR Chart */}
      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-foreground">Average Daily Rate (ADR)</h2>
              <p className="text-sm text-muted-foreground">Compare your ADR against market average</p>
            </div>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">From:</label>
              <input
                type="date"
                value={adrDateRange.start.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value)
                  setAdrDateRange((prev) => ({ ...prev, start: newStart }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">To:</label>
              <input
                type="date"
                value={adrDateRange.end.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value)
                  setAdrDateRange((prev) => ({ ...prev, end: newEnd }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentYear = new Date().getFullYear()
                setAdrDateRange({
                  start: new Date(currentYear, 0, 1),
                  end: new Date(currentYear, 11, 31),
                })
              }}
            >
              Reset to Current Year
            </Button>
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedADRProperties.length === properties.length) {
                    setSelectedADRProperties([])
                  } else {
                    setSelectedADRProperties(properties.map((p: any) => p.id))
                  }
                  setSelectedADRBuilding(null)
                }}
                className={cn(
                  "h-9 rounded-full border-2 px-4 transition-colors",
                  selectedADRProperties.length === 0 || selectedADRProperties.length === properties.length
                    ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                )}
              >
                All Properties
              </Button>
              {Array.from(adrBuildingGroups.keys()).map((buildingName) => {
                const buildingUnits = adrBuildingGroups.get(buildingName) || []
                const allUnitsSelected = buildingUnits.every((unit: any) => selectedADRProperties.includes(unit.id))
                const someUnitsSelected = buildingUnits.some((unit: any) => selectedADRProperties.includes(unit.id))

                return (
                  <Button
                    key={buildingName}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (allUnitsSelected) {
                        setSelectedADRProperties((prev) =>
                          prev.filter((id) => !buildingUnits.find((u: any) => u.id === id)),
                        )
                        setSelectedADRBuilding(null)
                      } else {
                        const unitIds = buildingUnits.map((u: any) => u.id)
                        setSelectedADRProperties((prev) => {
                          const newSet = new Set([...prev, ...unitIds])
                          return Array.from(newSet)
                        })
                        setSelectedADRBuilding(buildingName)
                      }
                    }}
                    className={cn(
                      "h-9 rounded-full border-2 px-4 transition-colors",
                      allUnitsSelected
                        ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : someUnitsSelected
                          ? "border-blue-400 bg-blue-25 text-blue-500 hover:bg-blue-50"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                    )}
                  >
                    {buildingName}
                    {buildingUnits.length > 1 && (
                      <span className="ml-1 text-xs opacity-60">({buildingUnits.length})</span>
                    )}
                  </Button>
                )
              })}
            </div>

            {selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding) && (
              <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                <span className="text-sm text-muted-foreground">Units:</span>
                {adrBuildingGroups.get(selectedADRBuilding)?.map((unit: any) => (
                  <Button
                    key={unit.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedADRProperties((prev) => {
                        if (prev.includes(unit.id)) {
                          return prev.filter((id) => id !== unit.id)
                        } else {
                          return [...prev, unit.id]
                        }
                      })
                    }}
                    className={cn(
                      "h-9 rounded-full border-2 px-4 transition-colors",
                      selectedADRProperties.includes(unit.id)
                        ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                    )}
                  >
                    {unit.unit_name}
                    {selectedADRProperties.includes(unit.id) && <X className="ml-1 h-3 w-3" />}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adrTimelineData}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`GMD ${formatCurrency(value)}`, ""]}
              />
              <Legend />
              {selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding)
                ? (() => {
                    const buildingUnits = adrBuildingGroups.get(selectedADRBuilding) || []
                    const allUnitsSelected = buildingUnits.every((unit: any) => selectedADRProperties.includes(unit.id))

                    if (allUnitsSelected) {
                      return (
                        <Line
                          key={selectedADRBuilding}
                          type="monotone"
                          dataKey={selectedADRBuilding}
                          name={selectedADRBuilding}
                          stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={false}
                        />
                      )
                    } else {
                      return properties
                        .filter((property: any) => selectedADRProperties.includes(property.id))
                        .map((property: any, index: number) => (
                          <Line
                            key={property.id}
                            type="monotone"
                            dataKey={property.id.toString()}
                            stroke={`hsl(${(index * 360) / properties.length}, 70%, 50%)`}
                            strokeWidth={2}
                            dot={false}
                            name={property.name || property.unit_name || `Property ${property.id}`}
                          />
                        ))
                    }
                  })()
                : properties
                    .filter((property: any) => selectedADRProperties.includes(property.id))
                    .map((property: any, index: number) => (
                      <Line
                        key={property.id}
                        type="monotone"
                        dataKey={property.id.toString()}
                        stroke={`hsl(${(index * 360) / properties.length}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        name={property.name || property.unit_name || `Property ${property.id}`}
                      />
                    ))}
              <Line
                type="monotone"
                dataKey="marketADR"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Market Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Share by Property Card */}
        <Card className="border-border bg-card">
          <div className="p-6">
            <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">Revenue Share by Property</h2>
            <p className="mb-6 text-sm text-muted-foreground">Revenue distribution across properties</p>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">From:</label>
                <input
                  type="date"
                  value={revenueShareDateRange.start.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value)
                    setRevenueShareDateRange((prev) => ({ ...prev, start: newStart }))
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">To:</label>
                <input
                  type="date"
                  value={revenueShareDateRange.end.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value)
                    setRevenueShareDateRange((prev) => ({ ...prev, end: newEnd }))
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentYear = new Date().getFullYear()
                  setRevenueShareDateRange({
                    start: new Date(currentYear, 0, 1),
                    end: new Date(currentYear, 11, 31),
                  })
                }}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <SVGDonutChart
                data={revenueShareData}
                size={250}
                innerRadius={60}
                outerRadius={100}
                formatValue={(value) => `GMD ${formatCurrency(value)}`}
              />
            </div>

            {revenueShareData.length > 0 && (
              <div className="space-y-2">
                {revenueShareData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: REVENUE_SHARE_COLORS[index % REVENUE_SHARE_COLORS.length] }}
                      />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">GMD {formatCurrency(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Revenue by Rental Type Card */}
        <Card className="border-border bg-card">
          <div className="p-6">
            <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">Revenue by Rental Type</h2>

            <div className="mb-6 space-y-3">
              {dynamicRevenueByRentalType.map((item) => (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.type}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">GMD {formatCurrency(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Top Revenue Properties by Type</h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-foreground">Short-term</span>
                  </div>
                  <div className="ml-5 space-y-2">
                    {revenueByPropertyAndType["short-term"].slice(0, 3).map((property) => (
                      <div
                        key={property.propertyId}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                      >
                        <span className="text-sm text-foreground">{property.propertyName}</span>
                        <span className="text-sm font-semibold text-foreground">
                          GMD {formatCurrency(property.revenue)}
                        </span>
                      </div>
                    ))}
                    {revenueByPropertyAndType["short-term"].length === 0 && (
                      <div className="text-sm text-muted-foreground">No properties</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-foreground">Long-term</span>
                  </div>
                  <div className="ml-5 space-y-2">
                    {revenueByPropertyAndType["long-term"].slice(0, 3).map((property) => (
                      <div
                        key={property.propertyId}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                      >
                        <span className="text-sm text-foreground">{property.propertyName}</span>
                        <span className="text-sm font-semibold text-foreground">
                          GMD {formatCurrency(property.revenue)}
                        </span>
                      </div>
                    ))}
                    {revenueByPropertyAndType["long-term"].length === 0 && (
                      <div className="text-sm text-muted-foreground">No properties</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-foreground">Corporate</span>
                  </div>
                  <div className="ml-5 space-y-2">
                    {revenueByPropertyAndType["corporate"].slice(0, 3).map((property) => (
                      <div
                        key={property.propertyId}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                      >
                        <span className="text-sm text-foreground">{property.propertyName}</span>
                        <span className="text-sm font-semibold text-foreground">
                          GMD {formatCurrency(property.revenue)}
                        </span>
                      </div>
                    ))}
                    {revenueByPropertyAndType["corporate"].length === 0 && (
                      <div className="text-sm text-muted-foreground">No properties</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <div className="mt-6">
        <Card className="border-border bg-card">
          <div className="p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sans text-lg font-semibold text-foreground">Payments</h2>
                <p className="text-sm text-muted-foreground">Track incoming payments across your portfolio</p>
              </div>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Select value={paymentPropertyFilter} onValueChange={setPaymentPropertyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min Amount"
                value={paymentAmountMin}
                onChange={(e) => setPaymentAmountMin(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Max Amount"
                value={paymentAmountMax}
                onChange={(e) => setPaymentAmountMax(e.target.value)}
              />

              <Input
                type="date"
                placeholder="From Date"
                value={paymentDateFrom}
                onChange={(e) => setPaymentDateFrom(e.target.value)}
              />

              <Input
                type="date"
                placeholder="To Date"
                value={paymentDateTo}
                onChange={(e) => setPaymentDateTo(e.target.value)}
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Property</TableHead>
                    <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-center text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-foreground">{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-foreground">{payment.description}</TableCell>
                        <TableCell className="text-foreground">{getPropertyName(payment.property)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                          GMD {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={payment.status === "completed" ? "default" : "secondary"}
                            className={
                              payment.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            }
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
