"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { paymentsApi } from "@/lib/api"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference")
      
      if (!reference) {
        setStatus("failed")
        setMessage("No payment reference found")
        return
      }

      try {
        const response = await paymentsApi.verify(reference)
        
        if (response.payment?.status === "completed" || response.message?.includes("already verified")) {
          setStatus("success")
          setMessage("Payment successful!")
          setPaymentDetails(response.payment)
        } else {
          setStatus("failed")
          setMessage(response.error || "Payment verification failed")
        }
      } catch (err: any) {
        setStatus("failed")
        setMessage(err.message || "Payment verification failed")
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="md" className="justify-center mb-4" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {status === "loading" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "failed" && "Payment Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              {status === "loading" && (
                <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
              )}
              {status === "success" && (
                <CheckCircle className="w-16 h-16 text-green-600" />
              )}
              {status === "failed" && (
                <XCircle className="w-16 h-16 text-red-600" />
              )}
            </div>

            <div className="text-center">
              <p className="text-gray-600">{message}</p>
            </div>

            {paymentDetails && status === "success" && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">₦{paymentDetails.amount?.toLocaleString()}</span>
                </div>
                {paymentDetails.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-sm">{paymentDetails.transactionRef}</span>
                  </div>
                )}
                {paymentDetails.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At:</span>
                    <span className="text-sm">
                      {new Date(paymentDetails.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {status === "success" && (
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              )}
              {status === "failed" && (
                <>
                  <Button className="w-full" asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard">Try Again</Link>
                  </Button>
                </>
              )}
              {status === "loading" && (
                <p className="text-center text-sm text-gray-500">
                  Please wait while we verify your payment...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
