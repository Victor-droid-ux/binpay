"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, CreditCard, CheckCircle, Bell } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function DemoPage() {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: "Search Your Bin",
      description: "Enter your unique bin ID or search by address to find your waste bin registration.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      number: 2,
      icon: CreditCard,
      title: "View Your Bills",
      description: "See all pending and paid bills for your bin. Check bill amounts, due dates, and payment history.",
      color: "bg-green-100 text-green-600",
    },
    {
      number: 3,
      icon: CheckCircle,
      title: "Make Payment",
      description: "Pay securely using card, bank transfer, USSD, or mobile money. Powered by Paystack for secure transactions.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      number: 4,
      icon: Bell,
      title: "Get Notifications",
      description: "Receive SMS and email confirmations. Get reminders for upcoming bills so you never miss a payment.",
      color: "bg-orange-100 text-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo href="/" size="md" />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">How It Works</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pay Your Bills in <span className="text-green-600">4 Simple Steps</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Managing your waste bin bills has never been easier. Here's how Bin-Pay works
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8 mb-12">
            {steps.map((step, index) => (
              <Card key={step.number} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={`${step.color} p-8 md:w-48 flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
                          <step.icon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold">Step {step.number}</p>
                      </div>
                    </div>
                    <div className="p-8 flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600 text-lg">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Secure Payments</CardTitle>
                <CardDescription>Bank-grade encryption protects all your transactions</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Instant Confirmation</CardTitle>
                <CardDescription>Get immediate SMS and email receipts for all payments</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>24/7 Access</CardTitle>
                <CardDescription>Pay anytime, anywhere from your phone or computer</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6 text-green-50">
                Join thousands of Nigerians managing their waste bills effortlessly
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                  <Link href="/states">View Supported States</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Bin-Pay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
