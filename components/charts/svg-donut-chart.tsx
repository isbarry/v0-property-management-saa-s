"use client"

import { useState } from "react"

interface DonutSegment {
  name: string
  value: number
  color: string
  percentage?: string | number
}

interface SVGDonutChartProps {
  data: DonutSegment[]
  size?: number
  innerRadius?: number
  outerRadius?: number
  formatValue?: (value: number) => string
}

export function SVGDonutChart({
  data,
  size = 250,
  innerRadius = 60,
  outerRadius = 100,
  formatValue = (value) => value.toString(),
}: SVGDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // If no data or total is 0, show empty state
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={outerRadius - innerRadius}
            opacity={0.2}
          />
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-sm"
          >
            No data
          </text>
        </svg>
      </div>
    )
  }

  if (data.length === 1) {
    const segment = data[0]
    const centerX = size / 2
    const centerY = size / 2
    const strokeWidth = outerRadius - innerRadius

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={centerX}
            cy={centerY}
            r={(outerRadius + innerRadius) / 2}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            className="transition-opacity duration-200"
            style={{
              opacity: hoveredIndex === null || hoveredIndex === 0 ? 1 : 0.5,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-foreground">{segment.name}</p>
            <p className="text-sm font-semibold text-foreground">{formatValue(segment.value)}</p>
            <p className="text-xs text-muted-foreground">100.0%</p>
          </div>
        )}
      </div>
    )
  }

  // Calculate center point
  const centerX = size / 2
  const centerY = size / 2

  // Function to create arc path
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + outerR * Math.cos(startAngleRad)
    const y1 = centerY + outerR * Math.sin(startAngleRad)
    const x2 = centerX + outerR * Math.cos(endAngleRad)
    const y2 = centerY + outerR * Math.sin(endAngleRad)
    const x3 = centerX + innerR * Math.cos(endAngleRad)
    const y3 = centerY + innerR * Math.sin(endAngleRad)
    const x4 = centerX + innerR * Math.cos(startAngleRad)
    const y4 = centerY + innerR * Math.sin(startAngleRad)

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `
  }

  // Calculate angles for each segment
  let currentAngle = -90 // Start at top
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    return {
      ...item,
      startAngle,
      endAngle,
      percentage,
      path: createArcPath(startAngle, endAngle, innerRadius, outerRadius),
    }
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.path}
              fill={segment.color}
              stroke="hsl(var(--background))"
              strokeWidth={2}
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
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-xs font-medium text-foreground">{segments[hoveredIndex].name}</p>
          <p className="text-sm font-semibold text-foreground">{formatValue(segments[hoveredIndex].value)}</p>
          <p className="text-xs text-muted-foreground">{segments[hoveredIndex].percentage.toFixed(1)}%</p>
        </div>
      )}
    </div>
  )
}
