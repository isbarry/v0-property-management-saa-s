"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sessionStorage.setItem("showLogoTransition", "true")
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("[v0] Sign in form values:", {
      email,
      password: password ? "***" + password.slice(-3) : "EMPTY",
      passwordLength: password?.length || 0,
    })

    try {
      const requestBody = { email, password }
      console.log("[v0] Request body being sent:", {
        email: requestBody.email,
        hasPassword: !!requestBody.password,
        passwordLength: requestBody.password?.length || 0,
      })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in")
      }

      setSuccess("Sign in successful! Redirecting...")
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("[v0] Sign in error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      sessionStorage.removeItem("showLogoTransition")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sessionStorage.setItem("showLogoTransition", "true")
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    try {
      console.log("[v0] Attempting sign up...")
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response content-type:", response.headers.get("content-type"))

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      setSuccess("Account created successfully! Redirecting...")
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("[v0] Sign up error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      sessionStorage.removeItem("showLogoTransition")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      setSuccess("Password reset instructions have been sent to your email.")
    } catch (err) {
      console.error("[v0] Forgot password error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#3a3a3a] border border-[#4a4a4a]">
          <TabsTrigger
            value="signin"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0ce6f0] data-[state=active]:to-[#2256f7] data-[state=active]:text-white text-gray-400"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0ce6f0] data-[state=active]:to-[#2256f7] data-[state=active]:text-white text-gray-400"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <Card className="bg-[#3a3a3a] border-[#4a4a4a] text-white">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="test@propertymanager.com"
                    required
                    disabled={isLoading}
                    className="bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showSignInPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      disabled={isLoading}
                    >
                      {showSignInPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-[#0ce6f0] hover:text-[#2256f7]"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="mt-6">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] hover:from-[#0bd4de] hover:to-[#1e4ad9] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card className="bg-[#3a3a3a] border-[#4a4a4a] text-white">
            <CardHeader>
              <CardTitle className="text-white">Create Account</CardTitle>
              <CardDescription className="text-gray-400">Enter your details to create a new account</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                    className="bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    className="bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      minLength={8}
                      className="bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      disabled={isLoading}
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#0ce6f0] to-[#2256f7] hover:from-[#0bd4de] hover:to-[#1e4ad9] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
