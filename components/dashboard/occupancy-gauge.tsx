"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OccupancyGaugeProps {
  rate: number
}

export function OccupancyGauge({ rate }: OccupancyGaugeProps) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (rate / 100) * circumference

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-sans text-lg font-semibold text-foreground">Occupancy Rate</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-muted"
            />
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-sans text-3xl font-bold text-foreground">{rate}%</span>
            <span className="text-xs text-muted-foreground">Occupied</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
