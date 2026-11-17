"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  User,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { NIGERIAN_STATES } from "@/lib/states-data";
import { authApi, ApiError } from "@/lib/api";
import {
  ACCOUNT_TYPES,
  AccountType,
  CATEGORY_FIELD_LABEL,
  ORGANIZATION_CATEGORIES,
} from "@/lib/account-types";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ACCOUNT_SECTION_COPY: Record<
  AccountType,
  { title: string; description: string }
> = {
  INDIVIDUAL: {
    title: "Personal Information",
    description: "Tell us about yourself to get started",
  },
  SCHOOL: {
    title: "School Registration Information",
    description:
      "Provide your school's registered details and primary contact.",
  },
  INDUSTRY: {
    title: "Industry Registration Information",
    description:
      "Provide your organisation's registered details and primary contact.",
  },
  INSTITUTION: {
    title: "Institution Registration Information",
    description:
      "Provide your institution's registered details and primary contact.",
  },
};

export default function RegisterPage() {
  const INLINE_ALERT_TIMEOUT_MS = 6000;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedState = searchParams.get("state");
  const verificationMode = searchParams.get("verifyEmail") === "1";
  const verificationEmailFromQuery = searchParams.get("email") || "";

  const [step, setStep] = useState(verificationMode ? 2 : 1);
  const [formData, setFormData] = useState({
    accountType: "INDIVIDUAL" as AccountType,
    organizationName: "",
    registrationNumber: "",
    contactPersonName: "",
    contactPersonPhone: "",
    organizationCategory: "",
    numberOfBins: "1",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: preSelectedState || "",
    lga: "",
    address: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState(
    verificationEmailFromQuery,
  );
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [didAutoResend, setDidAutoResend] = useState(false);
  const [errorDismissMs, setErrorDismissMs] = useState(INLINE_ALERT_TIMEOUT_MS);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, errorDismissMs);

    return () => clearTimeout(timer);
  }, [error, errorDismissMs]);

  const showInlineError = (
    message: string,
    dismissAfterMs: number = INLINE_ALERT_TIMEOUT_MS,
  ) => {
    setErrorDismissMs(dismissAfterMs);
    setError(message);
  };

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, INLINE_ALERT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [successMessage]);

  const passwordChecks = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    const autoResendVerificationCode = async () => {
      if (!verificationMode || !verificationEmailFromQuery || didAutoResend) {
        return;
      }

      setDidAutoResend(true);
      setIsResending(true);
      setError(null);

      try {
        await authApi.resendVerification({ email: verificationEmailFromQuery });
        setSuccessMessage(
          "We sent a fresh verification code to your email. Enter it below.",
        );
      } catch (err) {
        if (err instanceof ApiError) {
          showInlineError(
            err.message,
            err.data?.dismissAfterMs || INLINE_ALERT_TIMEOUT_MS,
          );
        } else {
          showInlineError("Unable to resend code right now. Please try again.");
        }
      } finally {
        setIsResending(false);
      }
    };

    autoResendVerificationCode();
  }, [didAutoResend, verificationEmailFromQuery, verificationMode]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "accountType" ? { organizationCategory: "" } : {}),
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const selectedStateData = formData.state
    ? NIGERIAN_STATES[formData.state]
    : null;

  const isOrganization = formData.accountType !== "INDIVIDUAL";
  const categoryOptions = isOrganization
    ? ORGANIZATION_CATEGORIES[
        formData.accountType as Exclude<AccountType, "INDIVIDUAL">
      ]
    : [];

  const validateForm = () => {
    if (isOrganization) {
      if (!formData.organizationName.trim()) {
        showInlineError("Registered organisation name is required");
        return false;
      }
      if (formData.registrationNumber.trim().length < 3) {
        showInlineError("Enter your CAC / registration number");
        return false;
      }
      if (!formData.organizationCategory) {
        showInlineError(
          `Select your ${CATEGORY_FIELD_LABEL[
            formData.accountType as Exclude<AccountType, "INDIVIDUAL">
          ].toLowerCase()}`,
        );
        return false;
      }
      if (!formData.contactPersonName.trim()) {
        showInlineError("Contact person name is required");
        return false;
      }
      if (
        !/^\+?[1-9]\d{1,14}$/.test(
          formData.contactPersonPhone.replace(/\s/g, ""),
        )
      ) {
        showInlineError("Enter a valid contact person phone number");
        return false;
      }
      if (!(parseInt(formData.numberOfBins, 10) >= 1)) {
        showInlineError("Number of bins must be at least 1");
        return false;
      }
    } else {
      if (!formData.firstName.trim()) {
        showInlineError("First name is required");
        return false;
      }
      if (!formData.lastName.trim()) {
        showInlineError("Last name is required");
        return false;
      }
    }
    if (!formData.email.trim()) {
      showInlineError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showInlineError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      showInlineError("Phone number is required");
      return false;
    }
    if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ""))) {
      showInlineError(
        "Please enter a valid phone number (e.g., +2348012345678)",
      );
      return false;
    }
    if (!formData.state) {
      showInlineError("Please select your state");
      return false;
    }
    if (!formData.password) {
      showInlineError("Password is required");
      return false;
    }
    if (!allPasswordChecksPass) {
      showInlineError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      );
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showInlineError("Passwords do not match");
      return false;
    }
    if (!formData.agreeToTerms) {
      showInlineError(
        "You must agree to the Terms of Service and Privacy Policy",
      );
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Register the user with the backend
      await authApi.register({
        email: formData.email.trim(),
        phone: formData.phone.replace(/\s/g, ""),
        password: formData.password,
        firstName: isOrganization ? undefined : formData.firstName.trim(),
        lastName: isOrganization ? undefined : formData.lastName.trim(),
        organizationName: isOrganization
          ? formData.organizationName.trim()
          : undefined,
        registrationNumber: isOrganization
          ? formData.registrationNumber.trim()
          : undefined,
        contactPersonName: isOrganization
          ? formData.contactPersonName.trim()
          : undefined,
        contactPersonPhone: isOrganization
          ? formData.contactPersonPhone.replace(/\s/g, "")
          : undefined,
        organizationCategory: isOrganization
          ? formData.organizationCategory
          : undefined,
        numberOfBins: isOrganization
          ? parseInt(formData.numberOfBins, 10)
          : undefined,
        accountType: formData.accountType,
        stateCode: formData.state,
        lgaId: formData.lga || undefined,
        address: formData.address.trim() || undefined,
      });

      setVerificationEmail(formData.email.trim());
      setSuccessMessage("Account created. Enter the code sent to your email.");

      // Registration successful - move to verification step
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        showInlineError(
          err.message,
          err.data?.dismissAfterMs || INLINE_ALERT_TIMEOUT_MS,
        );
      } else {
        showInlineError("Registration failed. Please try again.");
      }
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError(null);
    setSuccessMessage(null);
    const emailToVerify = verificationEmail || formData.email.trim();

    if (!emailToVerify) {
      showInlineError("Email is required to verify your account");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      showInlineError("Enter the 6-digit verification code from your email");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verifyEmail({
        email: emailToVerify,
        verificationCode: verificationCode.trim(),
      });

      setSuccessMessage("Email verified successfully.");
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError) {
        showInlineError(
          err.message,
          err.data?.dismissAfterMs || INLINE_ALERT_TIMEOUT_MS,
        );
      } else {
        showInlineError("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setSuccessMessage(null);
    const emailToVerify = verificationEmail || formData.email.trim();

    if (!emailToVerify) {
      showInlineError("Email is required to resend verification code");
      return;
    }

    setIsResending(true);

    try {
      await authApi.resendVerification({
        email: emailToVerify,
      });
      setSuccessMessage("A new verification code has been sent.");
    } catch (err) {
      if (err instanceof ApiError) {
        showInlineError(
          err.message,
          err.data?.dismissAfterMs || INLINE_ALERT_TIMEOUT_MS,
        );
      } else {
        showInlineError("Unable to resend code right now. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCompleteRegistration = async () => {
    // Clear tokens (optional - force fresh login)
    // This ensures users go through login flow for better security
    authApi.logout();

    // Redirect to login page
    router.push("/login");
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
          <Logo size="md" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            Create Your Account
          </h1>
          <p className="text-gray-600">
            Join thousands paying waste bills easily
          </p>
          {preSelectedState && selectedStateData && (
            <div className="mt-2 p-2 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                Setting up account for <strong>{selectedStateData.name}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`w-8 h-1 ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <div
              className={`w-8 h-1 ${step >= 3 ? "bg-green-600" : "bg-gray-200"}`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {ACCOUNT_SECTION_COPY[formData.accountType].title}
              </CardTitle>
              <CardDescription>
                {ACCOUNT_SECTION_COPY[formData.accountType].description}
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
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="accountType">Register as</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) =>
                    handleInputChange("accountType", value)
                  }
                >
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} - ₦{type.amount.toLocaleString()}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isOrganization ? (
                <>
                  <div>
                    <Label htmlFor="organizationName">
                      Registered Organisation Name
                    </Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) =>
                        handleInputChange("organizationName", e.target.value)
                      }
                      placeholder="As registered with CAC / the relevant authority"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="registrationNumber">
                        CAC / Registration Number
                      </Label>
                      <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "registrationNumber",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., RC1234567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="organizationCategory">
                        {
                          CATEGORY_FIELD_LABEL[
                            formData.accountType as Exclude<
                              AccountType,
                              "INDIVIDUAL"
                            >
                          ]
                        }
                      </Label>
                      <Select
                        value={formData.organizationCategory}
                        onValueChange={(value) =>
                          handleInputChange("organizationCategory", value)
                        }
                      >
                        <SelectTrigger id="organizationCategory">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPersonName">Contact Person</Label>
                      <Input
                        id="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={(e) =>
                          handleInputChange("contactPersonName", e.target.value)
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPersonPhone">
                        Contact Person Phone
                      </Label>
                      <Input
                        id="contactPersonPhone"
                        type="tel"
                        value={formData.contactPersonPhone}
                        onChange={(e) =>
                          handleInputChange(
                            "contactPersonPhone",
                            e.target.value,
                          )
                        }
                        placeholder="+234 800 123 4567"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="numberOfBins">Number of Bins</Label>
                    <Input
                      id="numberOfBins"
                      type="number"
                      min={1}
                      value={formData.numberOfBins}
                      onChange={(e) =>
                        handleInputChange("numberOfBins", e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Each bin is billed at your account rate. Your account is
                      reviewed by the state admin before billing starts.
                    </p>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">
                  {isOrganization
                    ? "Registered Business Email Address"
                    : "Email Address"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

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
                    placeholder="+234 800 123 4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange("state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NIGERIAN_STATES).map(([key, state]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        disabled={!state.isActive}
                      >
                        {state.name} {!state.isActive && "(Coming Soon)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStateData && (
                <div>
                  <Label htmlFor="lga">Local Government Area</Label>
                  <Select
                    value={formData.lga}
                    onValueChange={(value) => handleInputChange("lga", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedStateData.lgas.map((lga) => (
                        <SelectItem
                          key={lga}
                          value={lga.toLowerCase().replace(/\s+/g, "-")}
                        >
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    className="pl-10"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Your full address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="••••••••"
                  />
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      {passwordChecks.minLength ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.uppercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.lowercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.number ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span>One number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.special ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                  />
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="mt-2 text-xs text-red-500">
                        Passwords do not match
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    handleInputChange("agreeToTerms", checked as boolean)
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-green-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-green-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                onClick={handleRegister}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-green-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Email Verification */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Verify Your Email
              </CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to{" "}
                {verificationEmail || formData.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="text-center tracking-[0.4em]"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleVerifyEmail}
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>

              <Button
                variant="outline"
                onClick={handleResendVerification}
                className="w-full"
                disabled={isResending}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                {isResending ? "Resending..." : "Resend Code"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </div>
              <CardTitle>Account Created Successfully!</CardTitle>
              <CardDescription>
                Your email has been verified.{" "}
                {isOrganization
                  ? "Your organisation account is awaiting approval by the state admin. Billing starts once it is approved, and you will be notified."
                  : `You can now start paying your waste bills${
                      selectedStateData
                        ? ` in ${selectedStateData.name} state`
                        : ""
                    }.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCompleteRegistration}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Setting up your account..." : "Go to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
