"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { MonthlyRevenue, Property } from "@/lib/types"

interface ComprehensiveRevenueChartProps {
  data: MonthlyRevenue[]
  properties: Property[]
  onReady?: () => void // Added onReady callback prop
}

const PROPERTY_COLORS = [
  { realized: "#60A5FA", future: "rgba(96, 165, 250, 0.4)", border: "#3B82F6" }, // Bright blue
  { realized: "#34D399", future: "rgba(52, 211, 153, 0.4)", border: "#10B981" }, // Emerald green
  { realized: "#F472B6", future: "rgba(244, 114, 182, 0.4)", border: "#EC4899" }, // Pink
  { realized: "#FBBF24", future: "rgba(251, 191, 36, 0.4)", border: "#F59E0B" }, // Amber
  { realized: "#A78BFA", future: "rgba(167, 139, 250, 0.4)", border: "#8B5CF6" }, // Purple
  { realized: "#FB923C", future: "rgba(251, 146, 60, 0.4)", border: "#F97316" }, // Orange
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-3 shadow-lg"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1px solid #334155",
          color: "#F8FAFC",
        }}
      >
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm">
            {entry.name}: <span className="font-semibold">GMD {entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ComprehensiveRevenueChart({ data, properties, onReady }: ComprehensiveRevenueChartProps) {
  const [dateRange, setDateRange] = useState("ytd")
  const [selectedProperties, setSelectedProperties] = useState<string[]>(["all"])
  const hasCalledReady = useRef(false)

  const uniqueProperties = properties.reduce((acc, property) => {
    const existingProperty = acc.find((p) => p.name === property.name)
    if (!existingProperty) {
      acc.push(property)
    }
    return acc
  }, [] as Property[])

  const getPropertyIdsByName = (propertyName: string) => {
    return properties.filter((p) => p.name === propertyName).map((p) => p.id)
  }

  const FilterButton = ({ value, label, active }: { value: string; label: string; active: boolean }) => (
    <button
      onClick={() => setDateRange(value)}
      className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? "#60A5FA" : "#334155",
        color: active ? "#1E40AF" : "#CBD5E1",
      }}
    >
      {label}
    </button>
  )

  const toggleProperty = (propertyId: string) => {
    if (propertyId === "all") {
      setSelectedProperties(["all"])
    } else {
      setSelectedProperties((prev) => {
        const filtered = prev.filter((id) => id !== "all")
        if (filtered.includes(propertyId)) {
          const newSelection = filtered.filter((id) => id !== propertyId)
          return newSelection.length === 0 ? ["all"] : newSelection
        } else {
          return [...filtered, propertyId]
        }
      })
    }
  }

  const clearSelection = () => {
    setSelectedProperties(["all"])
  }

  const getDisplayText = () => {
    if (selectedProperties.includes("all")) {
      return "All Properties"
    }
    if (selectedProperties.length === 1) {
      const property = uniqueProperties.find((p) => String(p.id) === selectedProperties[0])
      return property?.name || "Select Properties"
    }
    return `${selectedProperties.length} Properties Selected`
  }

  const getFilteredData = () => {
    const now = new Date()
    const currentMonth = now.getMonth() // 0-11
    const currentYear = now.getFullYear()

    console.log("[v0] Revenue Chart - Current date:", now.toISOString())
    console.log("[v0] Revenue Chart - Date range filter:", dateRange)

    const validData = data.filter((item) => item?.month)

    switch (dateRange) {
      case "month":
        // Show only current month
        return validData.filter((item) => {
          const monthParts = item.month?.split(" ")
          if (!monthParts || monthParts.length < 2) return false
          const [month, year] = monthParts
          const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
          const itemYear = Number.parseInt(year)
          return monthIndex === currentMonth && itemYear === currentYear
        })

      case "quarter":
        // Show current quarter (3 months)
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3
        return validData.filter((item) => {
          const monthParts = item.month?.split(" ")
          if (!monthParts || monthParts.length < 2) return false
          const [month, year] = monthParts
          const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
          const itemYear = Number.parseInt(year)
          return itemYear === currentYear && monthIndex >= quarterStartMonth && monthIndex < quarterStartMonth + 3
        })

      case "ytd":
        return validData.filter((item) => {
          const monthParts = item.month?.split(" ")
          if (!monthParts || monthParts.length < 2) return false
          const [month, year] = monthParts
          const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
          const itemYear = Number.parseInt(year)
          return itemYear === currentYear && monthIndex <= currentMonth
        })

      case "custom":
        // For now, show all data (would need date picker for true custom range)
        return validData

      default:
        return validData
    }
  }

  const getChartData = () => {
    const filteredData = getFilteredData()

    if (selectedProperties.includes("all")) {
      // Show aggregate realized vs future
      return filteredData.map((month) => ({
        month: month.month,
        "Realized Revenue": month.realized,
        "Future Revenue": month.future,
      }))
    } else {
      // Show per-property breakdown
      return filteredData.map((month) => {
        const monthData: any = { month: month.month }
        selectedProperties.forEach((propId) => {
          const property = uniqueProperties.find((p) => String(p.id) === propId)
          if (property && month.byProperty) {
            const propertyIds = getPropertyIdsByName(property.name)
            let realizedTotal = 0
            let futureTotal = 0

            propertyIds.forEach((id) => {
              if (month.byProperty?.[id]) {
                realizedTotal += month.byProperty[id].realized
                futureTotal += month.byProperty[id].future
              }
            })

            monthData[`${property.name} (Realized)`] = realizedTotal
            monthData[`${property.name} (Future)`] = futureTotal
          }
        })
        return monthData
      })
    }
  }

  const CustomLegend = () => {
    if (selectedProperties.includes("all")) {
      return (
        <div className="flex items-center justify-end gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#60A5FA", border: "1px solid #3B82F6" }} />
            <span className="text-[13px] font-medium" style={{ color: "#E2E8F0" }}>
              Realized Revenue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{
                backgroundColor: "rgba(147, 197, 253, 0.4)",
                border: "1px dashed #60A5FA",
              }}
            />
            <span className="text-[13px] font-medium" style={{ color: "#E2E8F0" }}>
              Future Revenue
            </span>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-end gap-4 mb-4 flex-wrap">
          {selectedProperties.map((propId, index) => {
            const property = uniqueProperties.find((p) => String(p.id) === propId)
            const color = PROPERTY_COLORS[index % PROPERTY_COLORS.length]
            return (
              <div key={propId} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color.realized, border: `1px solid ${color.border}` }}
                />
                <span className="text-[13px] font-medium" style={{ color: "#E2E8F0" }}>
                  {property?.name}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
  }

  const chartData = getChartData()

  useEffect(() => {
    if (data && properties && onReady && !hasCalledReady.current) {
      hasCalledReady.current = true
      onReady()
    }
  }, [data, properties, onReady])

  return (
    <Card
      className="border-0 shadow-lg"
      style={{
        backgroundColor: "#1E293B",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardHeader className="pb-2" style={{ padding: "24px" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="font-sans font-semibold mb-1" style={{ fontSize: "20px", color: "#F8FAFC" }}>
              Revenue Overview
            </CardTitle>
            <p className="text-sm" style={{ color: "#CBD5E1" }}>
              {selectedProperties.includes("all") ? "Realized vs. Future Revenue" : "Per-Property Revenue Comparison"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FilterButton value="month" label="Month" active={dateRange === "month"} />
            <FilterButton value="quarter" label="Quarter" active={dateRange === "quarter"} />
            <FilterButton value="ytd" label="YtD" active={dateRange === "ytd"} />
            <FilterButton value="custom" label="Custom" active={dateRange === "custom"} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-between border-0 bg-transparent"
                style={{ backgroundColor: "#334155", color: "#CBD5E1" }}
              >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[240px] p-0"
              style={{ backgroundColor: "#1E293B", border: "1px solid #334155" }}
            >
              <div className="p-2 border-b" style={{ borderColor: "#334155" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
                    Select Properties
                  </span>
                  {!selectedProperties.includes("all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="h-6 px-2 text-xs"
                      style={{ color: "#60A5FA" }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                <div className="flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-slate-700/50">
                  <Checkbox
                    id="all"
                    checked={selectedProperties.includes("all")}
                    onCheckedChange={() => toggleProperty("all")}
                  />
                  <label
                    htmlFor="all"
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                    style={{ color: "#E2E8F0" }}
                    onClick={() => toggleProperty("all")}
                  >
                    All Properties
                  </label>
                </div>
                <div className="my-2 border-t" style={{ borderColor: "#334155" }} />
                {uniqueProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-slate-700/50"
                  >
                    <Checkbox
                      id={String(property.id)}
                      checked={selectedProperties.includes(String(property.id))}
                      onCheckedChange={() => toggleProperty(String(property.id))}
                    />
                    <label
                      htmlFor={String(property.id)}
                      className="text-sm leading-none cursor-pointer flex-1"
                      style={{ color: "#E2E8F0" }}
                      onClick={() => toggleProperty(String(property.id))}
                    >
                      {property.name}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent style={{ padding: "0 24px 24px 24px" }}>
        <CustomLegend />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barGap={4} barCategoryGap={12}>
            <XAxis
              dataKey="month"
              stroke="#CBD5E1"
              fontSize={12}
              fontWeight={500}
              tickLine={false}
              axisLine={{ stroke: "#475569", strokeWidth: 2 }}
            />

            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              fontWeight={400}
              tickLine={false}
              axisLine={{ stroke: "#475569", strokeWidth: 2 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              label={{
                value: "GMD",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#94A3B8", fontSize: 11 },
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51, 69, 85, 0.2)" }} />

            {selectedProperties.includes("all") ? (
              <>
                <Bar
                  dataKey="Realized Revenue"
                  fill="#60A5FA"
                  stroke="#3B82F6"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="Future Revenue"
                  fill="rgba(147, 197, 253, 0.4)"
                  stroke="#60A5FA"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </>
            ) : (
              <>
                {selectedProperties.map((propId, index) => {
                  const property = uniqueProperties.find((p) => String(p.id) === propId)
                  const color = PROPERTY_COLORS[index % PROPERTY_COLORS.length]
                  return (
                    <Bar
                      key={propId}
                      dataKey={`${property?.name} (Realized)`}
                      fill={color.realized}
                      stroke={color.border}
                      strokeWidth={1}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                      stackId={`property-${propId}`}
                    />
                  )
                })}
                {selectedProperties.map((propId, index) => {
                  const property = uniqueProperties.find((p) => String(p.id) === propId)
                  const color = PROPERTY_COLORS[index % PROPERTY_COLORS.length]
                  return (
                    <Bar
                      key={`${propId}-future`}
                      dataKey={`${property?.name} (Future)`}
                      fill={color.future}
                      stroke={color.border}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                      stackId={`property-${propId}`}
                    />
                  )
                })}
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
