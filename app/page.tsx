"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // router.push("/dashboard")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2d2d2d] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className="flex justify-center animate-in fade-in-0 zoom-in-50 duration-[720ms] delay-700"
            style={{ animationFillMode: "both" }}
          >
            <Image src="/logo.svg" alt="Tabax Logo" width={117} height={117} className="h-[117px] w-[117px]" />
          </div>
          <h1 className="font-sans text-5xl font-bold tracking-tight bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] bg-clip-text text-transparent">
            Tabax
          </h1>
          <p className="mt-2 text-gray-400">Manage your properties with ease</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
