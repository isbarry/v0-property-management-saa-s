"use client"

import { useEffect, useRef } from "react"
import lottie, { type AnimationItem } from "lottie-web"

export function LottieAnimation({
  animationPath = "/animations/data-analysis.json",
  backgroundColor = "transparent",
}: {
  animationPath?: string
  backgroundColor?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      if (animationRef.current) {
        animationRef.current.destroy()
      }

      try {
        animationRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: animationPath,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
          },
        })
      } catch (error) {
        console.error("[v0] Failed to load animation:", error)
      }
    }

    return () => {
      animationRef.current?.destroy()
    }
  }, [animationPath])

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: backgroundColor === "#ffffff" ? "#ffffff" : backgroundColor }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
