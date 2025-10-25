"use client"

import { useState, useEffect, type ReactNode } from "react"

interface MinimumLoadingWrapperProps {
  children: ReactNode
  loadingContent: ReactNode
  minimumMs?: number
}

export function MinimumLoadingWrapper({ children, loadingContent, minimumMs = 1000 }: MinimumLoadingWrapperProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log("[v0] MinimumLoadingWrapper mounted, waiting", minimumMs, "ms")
    const timer = setTimeout(() => {
      console.log("[v0] MinimumLoadingWrapper ready, showing content")
      setIsReady(true)
    }, minimumMs)

    return () => clearTimeout(timer)
  }, [minimumMs])

  if (!isReady) {
    return <>{loadingContent}</>
  }

  return <>{children}</>
}
