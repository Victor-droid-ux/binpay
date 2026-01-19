"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Lock, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { authApi, ApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.email || !formData.password) {
        setError("Email and password are required")
        setIsLoading(false)
        return
      }

      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      })

      // Verify user has SUPER_ADMIN role
      if (response.user.role !== "SUPER_ADMIN") {
        setError("Access denied. Super admin privileges required.")
        authApi.logout() // Clear any tokens
        setIsLoading(false)
        return
      }

      // Redirect to super admin dashboard
      router.push("/super-admin")
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      console.error("Super admin login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <Logo size="md" className="justify-center mb-4" />
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-red-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Login</h1>
          </div>
          <p className="text-gray-600">Access the system administration dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Super Administrator Sign In</CardTitle>
            <CardDescription>Sign in to manage the entire Bin-Pay system across all states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="superadmin@binpay.gov.ng"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember me
                </Label>
              </div>
            </div>

            <Button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Link href="/super-admin/forgot-password" className="text-sm text-red-600 hover:underline">
                Need help accessing your account?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Critical Security Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                This is a highly restricted super administrator portal. All activities are monitored and logged. Only
                authorized personnel with explicit permission should access this system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
