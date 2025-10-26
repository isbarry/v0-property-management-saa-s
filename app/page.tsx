"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { AnimationRolodex } from "@/components/auth/animation-rolodex"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // router.push("/dashboard")
  }, [router])

  return (
    <div className="flex min-h-screen relative">
      <div
        className="absolute top-6 left-6 z-50 animate-in fade-in-0 zoom-in-50 duration-[720ms] delay-700"
        style={{ animationFillMode: "both" }}
      >
        <Image src="/logo.svg" alt="Tabax Logo" width={80} height={80} className="h-20 w-20" />
      </div>

      {/* Left half - Animation rolodex */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-50 to-cyan-50 items-center justify-center">
        <div className="mt-[119px]">
          <AnimationRolodex />
        </div>
      </div>

      {/* Right half - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1
              className="font-sans text-5xl font-bold tracking-tight bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] bg-clip-text text-transparent animate-in fade-in-0 zoom-in-50 duration-[720ms] delay-700"
              style={{ animationFillMode: "both" }}
            >
              Tabax
            </h1>
            <p className="mt-2 text-gray-600">Manage your properties with ease</p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
