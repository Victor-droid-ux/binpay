"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Mail, Lock, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { NIGERIAN_STATES } from "@/lib/states-data"
import { authApi, ApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    stateCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError("Email and password are required")
        setIsLoading(false)
        return
      }

      // Login via API
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      })

      // Verify user has STATE_ADMIN role
      if (response.user.role !== "STATE_ADMIN") {
        setError("Access denied. State admin privileges required.")
        authApi.logout()
        setIsLoading(false)
        return
      }

      // Verify state code matches if selected
      if (formData.stateCode && response.user.stateCode !== formData.stateCode) {
        setError(`You are not authorized for ${NIGERIAN_STATES[formData.stateCode]?.name}. You manage ${NIGERIAN_STATES[response.user.stateCode]?.name}.`)
        authApi.logout()
        setIsLoading(false)
        return
      }

      // Redirect to state admin dashboard
      router.push("/admin/dashboard")
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      console.error("Admin login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  const activeStates = Object.entries(NIGERIAN_STATES).filter(([_, state]) => state.isActive)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <Logo size="md" className="justify-center mb-4" />
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">State Admin Login</h1>
          </div>
          <p className="text-gray-600">Access your state waste management dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administrator Sign In</CardTitle>
            <CardDescription>Sign in to manage waste bills and payments for your state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="state">State/Authority</Label>
              <Select value={formData.stateCode} onValueChange={(value) => handleInputChange("stateCode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {activeStates.map(([key, state]) => (
                    <SelectItem key={key} value={key}>
                      {state.name} - {state.wasteAuthority.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  placeholder="admin@authority.gov.ng"
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

            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Link href="/admin/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="border-t pt-4">
              <p className="text-center text-sm text-gray-600">
                Need admin access?{" "}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Contact Super Admin
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Security Notice</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a secure administrator portal. All activities are logged and monitored. Only authorized
                personnel should access this system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
