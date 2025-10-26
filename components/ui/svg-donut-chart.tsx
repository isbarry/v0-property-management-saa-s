"use client"

import { useState } from "react"

interface DonutChartData {
  name: string
  value: number
  percentage: string
  color: string
}

interface SVGDonutChartProps {
  data: DonutChartData[]
  size?: number
  innerRadius?: number
  outerRadius?: number
  formatValue?: (value: number) => string
}

export function SVGDonutChart({
  data,
  size = 200,
  innerRadius = 50,
  outerRadius = 80,
  formatValue = (value) => value.toString(),
}: SVGDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const centerX = size / 2
  const centerY = size / 2

  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Generate path data for each segment
  const generateSegments = () => {
    let currentAngle = -90 // Start at top

    return data.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      // Convert angles to radians
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      // Calculate outer arc points
      const x1 = centerX + outerRadius * Math.cos(startRad)
      const y1 = centerY + outerRadius * Math.sin(startRad)
      const x2 = centerX + outerRadius * Math.cos(endRad)
      const y2 = centerY + outerRadius * Math.sin(endRad)

      // Calculate inner arc points
      const x3 = centerX + innerRadius * Math.cos(endRad)
      const y3 = centerY + innerRadius * Math.sin(endRad)
      const x4 = centerX + innerRadius * Math.cos(startRad)
      const y4 = centerY + innerRadius * Math.sin(startRad)

      // Determine if arc should be large
      const largeArc = angle > 180 ? 1 : 0

      // Create path
      const path = [
        `M ${x1} ${y1}`, // Move to start of outer arc
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`, // Outer arc
        `L ${x3} ${y3}`, // Line to start of inner arc
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`, // Inner arc
        "Z", // Close path
      ].join(" ")

      currentAngle = endAngle

      return {
        path,
        color: item.color,
        name: item.name,
        value: item.value,
        percentage: item.percentage,
      }
    })
  }

  const segments = generateSegments()

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.path}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
              className="transition-opacity duration-200"
              style={{
                opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.5,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </g>
        ))}

        {/* Center circle for donut effect */}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="hsl(var(--card))" />

        {/* Center text */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-sm font-semibold"
        >
          Total
        </text>
        <text
          x={centerX}
          y={centerY + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-xs"
        >
          {formatValue(total)}
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="text-xs font-medium text-foreground">{segments[hoveredIndex].name}</div>
          <div className="text-xs text-muted-foreground">
            {formatValue(segments[hoveredIndex].value)} ({segments[hoveredIndex].percentage}%)
          </div>
        </div>
      )}
    </div>
  )
}
