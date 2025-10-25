"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface RevenueChartProps {
  currentMonth: number
  lastMonth: number
}

export function RevenueChart({ currentMonth, lastMonth }: RevenueChartProps) {
  const data = [
    { name: "Last Month", revenue: lastMonth },
    { name: "This Month", revenue: currentMonth },
  ]

  const percentageChange = ((currentMonth - lastMonth) / lastMonth) * 100

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-sans text-lg font-semibold text-foreground">Revenue Snapshot</CardTitle>
        <p className="text-sm text-muted-foreground">
          {percentageChange > 0 ? "+" : ""}
          {percentageChange.toFixed(1)}% from last month
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`GMD ${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
