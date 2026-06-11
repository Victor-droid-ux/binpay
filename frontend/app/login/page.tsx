"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Mail, Lock, Phone, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { authApi, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [otpMode, setOtpMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    otpCode: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const redirectByRole = (role: string) => {
    if (role === "SUPER_ADMIN") {
      router.push("/super-admin");
      router.refresh();
    } else if (role === "STATE_ADMIN") {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (loginMethod === "email" && !formData.email) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }
      if (loginMethod === "phone" && !formData.phone) {
        setError("Phone number is required");
        setIsLoading(false);
        return;
      }
      if (!formData.password) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // Call API
      const credentials =
        loginMethod === "email"
          ? { email: formData.email, password: formData.password }
          : { phone: formData.phone, password: formData.password };

      const response = await authApi.login(credentials);

      // Store user info and redirect based on role
      redirectByRole(response.user.role);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.data?.requiresEmailVerification) {
          const email =
            typeof err.data?.email === "string"
              ? err.data.email
              : formData.email;
          router.push(
            `/register?verifyEmail=1&email=${encodeURIComponent(email)}`,
          );
          return;
        }
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setSuccess(null);

    if (!formData.phone) {
      setError("Phone number is required for OTP login");
      return;
    }

    setIsSendingOtp(true);

    try {
      await authApi.sendLoginOtp({
        phone: formData.phone.replace(/\s/g, ""),
      });
      setOtpSent(true);
      setSuccess("OTP sent. Enter the 6-digit code to continue.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.data?.requiresEmailVerification) {
          const email =
            typeof err.data?.email === "string"
              ? err.data.email
              : formData.email;
          router.push(
            `/register?verifyEmail=1&email=${encodeURIComponent(email)}`,
          );
          return;
        }
        setError(err.message);
      } else {
        setError("Unable to send OTP. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setSuccess(null);

    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }

    if (formData.otpCode.trim().length !== 6) {
      setError("Enter the 6-digit OTP code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.verifyLoginOtp({
        phone: formData.phone.replace(/\s/g, ""),
        otpCode: formData.otpCode.trim(),
      });
      redirectByRole(response.user.role);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.data?.requiresEmailVerification) {
          const email =
            typeof err.data?.email === "string"
              ? err.data.email
              : formData.email;
          router.push(
            `/register?verifyEmail=1&email=${encodeURIComponent(email)}`,
          );
          return;
        }
        setError(err.message);
      } else {
        setError("OTP verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <Logo size="md" className="justify-center" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred login method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Login Method Toggle */}
            {!otpMode && (
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === "email"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === "phone"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Phone
                </button>
              </div>
            )}

            {/* Email Login */}
            {!otpMode && loginMethod === "email" && (
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
                    placeholder="john@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Phone Login */}
            {(otpMode || loginMethod === "phone") && (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="+234 800 123 4567"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {!otpMode && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    onKeyPress={handleKeyPress}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {otpMode && otpSent && (
              <div>
                <Label htmlFor="otpCode">OTP Code</Label>
                <Input
                  id="otpCode"
                  value={formData.otpCode}
                  onChange={(e) =>
                    handleInputChange(
                      "otpCode",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  placeholder="123456"
                  maxLength={6}
                  className="tracking-[0.4em] text-center"
                  disabled={isLoading}
                />
              </div>
            )}

            {!otpMode && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      handleInputChange("rememberMe", checked as boolean)
                    }
                  />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {!otpMode ? (
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            ) : otpSent ? (
              <Button
                onClick={handleVerifyOtp}
                className="w-full"
                disabled={isLoading || formData.otpCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            ) : (
              <Button
                onClick={handleSendOtp}
                className="w-full"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? "Sending OTP..." : "Send OTP"}
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setError(null);
                setSuccess(null);
                if (otpMode) {
                  setOtpMode(false);
                  setOtpSent(false);
                  setFormData((prev) => ({ ...prev, otpCode: "" }));
                } else {
                  setOtpMode(true);
                  setOtpSent(false);
                }
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              {otpMode ? "Back to Password Login" : "Login with OTP"}
            </Button>

            {otpMode && otpSent && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? "Resending..." : "Resend OTP"}
              </Button>
            )}

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-green-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
