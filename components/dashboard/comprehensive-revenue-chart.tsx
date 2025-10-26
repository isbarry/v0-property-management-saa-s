"use client"

import React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import type { MonthlyRevenue, Property } from "@/lib/types"

interface ComprehensiveRevenueChartProps {
  data: MonthlyRevenue[]
  properties: Property[]
  onReady?: () => void
}

const PROPERTY_COLORS = [
  { realized: "#60A5FA", future: "rgba(96, 165, 250, 0.4)", border: "#3B82F6" },
  { realized: "#34D399", future: "rgba(52, 211, 153, 0.4)", border: "#10B981" },
  { realized: "#F472B6", future: "rgba(244, 114, 182, 0.4)", border: "#EC4899" },
  { realized: "#FBBF24", future: "rgba(251, 191, 36, 0.4)", border: "#F59E0B" },
  { realized: "#A78BFA", future: "rgba(167, 139, 250, 0.4)", border: "#8B5CF6" },
  { realized: "#FB923C", future: "rgba(251, 146, 60, 0.4)", border: "#F97316" },
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
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set())
  const hasCalledReady = useRef(false)

  const buildingGroups = useMemo(() => {
    const groups = new Map<string, Property[]>()
    properties.forEach((property) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)?.push(property)
    })
    return groups
  }, [properties])

  useEffect(() => {
    if (properties.length > 0 && selectedUnits.size === 0) {
      const allUnitIds = new Set<number>()
      properties.forEach((p) => allUnitIds.add(p.id))
      setSelectedUnits(allUnitIds)
    }
  }, [properties])

  const toggleBuilding = useCallback(
    (buildingName: string) => {
      if (selectedBuilding === buildingName) {
        setSelectedBuilding(null)
        setSelectedUnits(new Set())
      } else {
        const buildingUnits = buildingGroups.get(buildingName) || []
        const buildingUnitIds = new Set(buildingUnits.map((u) => u.id))
        setSelectedBuilding(buildingName)
        setSelectedUnits(buildingUnitIds)
      }
    },
    [selectedBuilding, buildingGroups],
  )

  const toggleUnit = useCallback(
    (unitId: number) => {
      const newSelectedUnits = new Set(selectedUnits)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      setSelectedUnits(newSelectedUnits)

      if (selectedBuilding) {
        const buildingUnits = buildingGroups.get(selectedBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit) => newSelectedUnits.has(unit.id))
        if (!allUnitsSelected) {
          setSelectedBuilding(null)
        }
      }
    },
    [selectedUnits, selectedBuilding, buildingGroups],
  )

  const selectAllProperties = useCallback(() => {
    if (selectedUnits.size === properties.length) {
      setSelectedUnits(new Set())
      setSelectedBuilding(null)
    } else {
      const allUnitIds = new Set<number>()
      properties.forEach((p) => allUnitIds.add(p.id))
      setSelectedUnits(allUnitIds)
      setSelectedBuilding(null)
    }
  }, [properties, selectedUnits])

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

  const getFilteredData = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const validData = data.filter((item) => item?.month)

    switch (dateRange) {
      case "month":
        return validData.filter((item) => {
          const monthParts = item.month?.split(" ")
          if (!monthParts || monthParts.length < 2) return false
          const [month, year] = monthParts
          const monthIndex = new Date(`${month} 1, ${year}`).getMonth()
          const itemYear = Number.parseInt(year)
          return monthIndex === currentMonth && itemYear === currentYear
        })

      case "quarter":
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
        return validData

      default:
        return validData
    }
  }

  const getChartData = () => {
    const filteredData = getFilteredData()

    if (selectedBuilding && buildingGroups.get(selectedBuilding)) {
      const buildingUnits = buildingGroups.get(selectedBuilding) || []
      const allUnitsSelected = buildingUnits.every((unit) => selectedUnits.has(unit.id))

      if (allUnitsSelected) {
        // Show aggregate for the building
        return filteredData.map((month) => {
          let realizedTotal = 0
          let futureTotal = 0
          buildingUnits.forEach((unit) => {
            if (month.byProperty?.[unit.id]) {
              realizedTotal += month.byProperty[unit.id].realized
              futureTotal += month.byProperty[unit.id].future
            }
          })
          return {
            month: month.month,
            [`${selectedBuilding} (Realized)`]: realizedTotal,
            [`${selectedBuilding} (Future)`]: futureTotal,
          }
        })
      } else {
        // Show individual units
        return filteredData.map((month) => {
          const monthData: any = { month: month.month }
          buildingUnits.forEach((unit) => {
            if (selectedUnits.has(unit.id) && month.byProperty?.[unit.id]) {
              monthData[`${unit.unit_name} (Realized)`] = month.byProperty[unit.id].realized
              monthData[`${unit.unit_name} (Future)`] = month.byProperty[unit.id].future
            }
          })
          return monthData
        })
      }
    } else {
      const allPropertiesSelected = selectedUnits.size === properties.length && properties.length > 0

      if (allPropertiesSelected) {
        // Show aggregate realized vs future
        return filteredData.map((month) => ({
          month: month.month,
          "Realized Revenue": month.realized,
          "Future Revenue": month.future,
        }))
      } else {
        // Show selected properties
        return filteredData.map((month) => {
          const monthData: any = { month: month.month }
          properties.forEach((property) => {
            if (selectedUnits.has(property.id) && month.byProperty?.[property.id]) {
              monthData[`${property.unit_name || property.property_name} (Realized)`] =
                month.byProperty[property.id].realized
              monthData[`${property.unit_name || property.property_name} (Future)`] =
                month.byProperty[property.id].future
            }
          })
          return monthData
        })
      }
    }
  }

  const CustomLegend = () => {
    const allPropertiesSelected = selectedUnits.size === properties.length && properties.length > 0

    if (allPropertiesSelected) {
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
    }

    return null
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
              {selectedUnits.size === properties.length
                ? "Realized vs. Future Revenue"
                : "Per-Property Revenue Comparison"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FilterButton value="month" label="Month" active={dateRange === "month"} />
            <FilterButton value="quarter" label="Quarter" active={dateRange === "quarter"} />
            <FilterButton value="ytd" label="YtD" active={dateRange === "ytd"} />
            <FilterButton value="custom" label="Custom" active={dateRange === "custom"} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "#CBD5E1" }}>
              Filter by property:
            </p>
          </div>

          {/* Level 1: Buildings + All Properties */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllProperties}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedUnits.size === properties.length && !selectedBuilding
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
              )}
            >
              All Properties
            </button>

            {Array.from(buildingGroups.entries()).map(([buildingName, units]) => {
              const allUnitsSelected = units.every((unit) => selectedUnits.has(unit.id))
              const someUnitsSelected = units.some((unit) => selectedUnits.has(unit.id))

              return (
                <button
                  key={buildingName}
                  onClick={() => toggleBuilding(buildingName)}
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
          {selectedBuilding && buildingGroups.get(selectedBuilding) && (
            <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
              <span className="text-xs font-medium" style={{ color: "#CBD5E1" }}>
                Units:
              </span>
              {buildingGroups.get(selectedBuilding)?.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => toggleUnit(unit.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selectedUnits.has(unit.id)
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

            {selectedUnits.size === properties.length && properties.length > 0 ? (
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
                {Object.keys(chartData[0] || {})
                  .filter((key) => key !== "month" && key.includes("(Realized)"))
                  .map((key, index) => {
                    const color = PROPERTY_COLORS[index % PROPERTY_COLORS.length]
                    const futureKey = key.replace("(Realized)", "(Future)")
                    return (
                      <React.Fragment key={key}>
                        <Bar
                          dataKey={key}
                          fill={color.realized}
                          stroke={color.border}
                          strokeWidth={1}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={20}
                        />
                        <Bar
                          dataKey={futureKey}
                          fill={color.future}
                          stroke={color.border}
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={20}
                        />
                      </React.Fragment>
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
