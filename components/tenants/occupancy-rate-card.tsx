"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import type { Property } from "@/lib/types"

interface OccupancyRateCardProps {
  selectedProperties: string[]
  selectedPeriod: string
  properties: Property[]
}

const PROPERTY_COLORS: Record<string, string> = {
  "1": "#10B981",
  "2": "#EF4444",
  "3": "#10B981",
  "4": "#EF4444",
  "5": "#F59E0B",
  "6": "#F59E0B",
}

export function OccupancyRateCard({ selectedProperties, selectedPeriod, properties }: OccupancyRateCardProps) {
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOccupancyData()
  }, [selectedProperties, selectedPeriod])

  const fetchOccupancyData = async () => {
    setLoading(true)
    try {
      // For now, calculate occupancy from reservations
      // TODO: Create a dedicated API endpoint for occupancy metrics
      const response = await fetch("/api/reservations")
      if (response.ok) {
        const data = await response.json()
        // Calculate occupancy rates from reservation data
        // This is a simplified calculation - in production, you'd want more sophisticated logic
        const currentMonth = new Date().toLocaleString("default", { month: "short" })

        const calculatedData = [
          {
            month: currentMonth,
            portfolioAverage: 0, // Will be calculated from properties
            properties: {} as Record<string, number>,
          },
        ]

        // Calculate occupancy for each property
        selectedProperties.forEach((propertyId) => {
          const propertyReservations =
            data.reservations?.filter((r: any) => r.property_id?.toString() === propertyId) || []

          // Simple calculation: if property has active reservations, it's occupied
          const occupancyRate = propertyReservations.length > 0 ? 75 : 0
          calculatedData[0].properties[propertyId] = occupancyRate
        })

        // Calculate portfolio average
        const rates = Object.values(calculatedData[0].properties)
        calculatedData[0].portfolioAverage =
          rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0

        setOccupancyData(calculatedData)
      }
    } catch (error) {
      console.error("[v0] Error fetching occupancy data:", error)
      setOccupancyData([])
    } finally {
      setLoading(false)
    }
  }

  // Transform data for the chart
  const chartData = occupancyData.map((item) => {
    const dataPoint: Record<string, number | string> = {
      month: item.month,
      portfolioAverage: item.portfolioAverage,
    }

    selectedProperties.forEach((propertyId) => {
      const property = properties.find((p) => p.id === propertyId)
      if (property) {
        dataPoint[property.name] = item.properties[propertyId] || 0
      }
    })

    return dataPoint
  })

  // Calculate stats
  const currentData = occupancyData[occupancyData.length - 1]
  const previousData = occupancyData[occupancyData.length - 2]

  const currentAverage = currentData?.portfolioAverage || 0
  const previousAverage = previousData?.portfolioAverage || currentAverage
  const trend = currentAverage - previousAverage

  // Find best performer
  const bestPerformer = selectedProperties.reduce(
    (best, propertyId) => {
      const property = properties.find((p) => p.id === propertyId)
      const rate = currentData?.properties[propertyId] || 0
      if (rate > best.rate) {
        return {
          propertyId,
          propertyName: property?.name || "Unknown",
          rate,
        }
      }
      return best
    },
    { propertyId: "", propertyName: "", rate: 0 },
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-sans text-lg font-semibold text-foreground">Occupancy Rate</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedPeriod === "mtd" && "Month to Date"}
            {selectedPeriod === "qtd" && "Quarter to Date"}
            {selectedPeriod === "ytd" && "Year to Date"}
            {selectedPeriod === "12m" && "Last 12 Months"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No occupancy data available yet</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolioAverage"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Portfolio Average"
                />
                {selectedProperties.map((propertyId) => {
                  const property = properties.find((p) => p.id === propertyId)
                  if (!property) return null
                  return (
                    <Line
                      key={propertyId}
                      type="monotone"
                      dataKey={property.name}
                      stroke={PROPERTY_COLORS[propertyId] || "#6B7280"}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={property.name}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 grid gap-4 border-t border-border pt-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Average</p>
                <p className="font-sans text-2xl font-bold text-foreground">{currentAverage.toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trend</p>
                <div className="flex items-center gap-2">
                  <p className="font-sans text-2xl font-bold text-foreground">
                    {trend > 0 ? "+" : ""}
                    {trend.toFixed(0)}%
                  </p>
                  {trend > 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  ) : trend < 0 ? (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">vs last period</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Best Performer</p>
                <p className="font-sans text-2xl font-bold text-foreground">
                  {bestPerformer.propertyName
                    ? `${bestPerformer.propertyName}: ${bestPerformer.rate.toFixed(0)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
