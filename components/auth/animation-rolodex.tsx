"use client"

import { useState, useEffect } from "react"
import { LottieAnimation } from "./lottie-animation"

export function AnimationRolodex() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const animations = [
    {
      id: 1,
      component: <LottieAnimation animationPath="/animations/data-analysis.json" />,
      backgroundColor: "bg-white",
    },
    {
      id: 2,
      component: <LottieAnimation animationPath="/animations/data-analysis.json" />,
      backgroundColor: "bg-white",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animations.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [animations.length])

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <div className="relative w-[400px] h-[400px]" style={{ perspective: "1000px" }}>
        {animations.map((animation, index) => {
          const isActive = index === currentIndex
          const offset = index - currentIndex

          let transform = ""
          let opacity = 0
          let zIndex = 0

          if (isActive) {
            transform = "translateZ(0px) rotateX(0deg)"
            opacity = 1
            zIndex = 30
          } else if (offset > 0) {
            transform = `translateZ(-${offset * 2.6}px) translateY(-${offset * 3.9}px) rotateX(-2deg)`
            opacity = 0.4
            zIndex = 30 - offset
          } else {
            transform = `translateZ(${offset * 2.6}px) translateY(${Math.abs(offset) * 3.9}px) rotateX(2deg)`
            opacity = 0.2
            zIndex = 30 + offset
          }

          return (
            <div
              key={animation.id}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                transform,
                opacity,
                zIndex,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className={`w-full h-full ${animation.backgroundColor} rounded-3xl shadow-2xl overflow-hidden border border-gray-200`}
              >
                {animation.component}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
