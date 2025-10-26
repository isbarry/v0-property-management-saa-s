"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function Dots() {
  const meshRef = useRef<THREE.Points>(null)

  // Create 8000 dots with random positions
  const particles = useMemo(() => {
    const positions = new Float32Array(8000 * 3)
    const velocities = new Float32Array(8000 * 3)

    for (let i = 0; i < 8000; i++) {
      // Random positions in a sphere
      const radius = Math.random() * 15 + 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Random velocities for floating effect
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }

    return { positions, velocities }
  }, [])

  // Animate the dots
  useFrame((state) => {
    if (!meshRef.current) return

    // Rotate the entire particle system
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2

    // Animate individual particles
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < 8000; i++) {
      positions[i * 3] += particles.velocities[i * 3]
      positions[i * 3 + 1] += particles.velocities[i * 3 + 1]
      positions[i * 3 + 2] += particles.velocities[i * 3 + 2]

      // Bounce back if too far
      const distance = Math.sqrt(positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2)

      if (distance > 20) {
        particles.velocities[i * 3] *= -1
        particles.velocities[i * 3 + 1] *= -1
        particles.velocities[i * 3 + 2] *= -1
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={8000} array={particles.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#2256f7"
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function WebGLDots() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800">
      <Canvas camera={{ position: [0, 0, 25], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <Dots />
      </Canvas>
    </div>
  )
}
