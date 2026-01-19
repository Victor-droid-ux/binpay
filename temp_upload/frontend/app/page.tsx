import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, CreditCard, Bell, Shield } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function HomePage() {
  const features = [
    {
      icon: MapPin,
      title: "All 36 States + FCT",
      description: "Pay waste bin bills across Nigeria - from Lagos LAWMA to Abuja AEPB",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Multiple payment options with bank-grade security",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss a payment with automated notifications",
    },
    {
      icon: Shield,
      title: "Verified Authorities",
      description: "Direct integration with official waste management authorities",
    },
  ]

  const supportedStates = [
    { name: "Enugu", authority: "ESWAMA", color: "bg-green-100 text-green-800" },
    { name: "Lagos", authority: "LAWMA", color: "bg-blue-100 text-blue-800" },
    { name: "Abuja", authority: "AEPB", color: "bg-purple-100 text-purple-800" },
    { name: "Rivers", authority: "RIWAMA", color: "bg-orange-100 text-orange-800" },
    { name: "Kano", authority: "KANSEMA", color: "bg-red-100 text-red-800" },
    { name: "Ogun", authority: "OGSEMA", color: "bg-indigo-100 text-indigo-800" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo href="/" size="md" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/states" className="text-gray-600 hover:text-gray-900">
              Supported States
            </Link>
            <Link href="/help" className="text-gray-600 hover:text-gray-900">
              Help
            </Link>
            <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </nav>
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
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Pay Your Waste Bin Bills
            <span className="text-green-600"> Anywhere in Nigeria</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {"The easiest way to check and pay your waste management bills across all 36 states and FCT. Fast, secure, and reliable."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link href="/register">Start Paying Bills</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3" asChild>
              <Link href="/demo">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Bin-Pay?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We make waste bill payments simple, fast, and accessible for every Nigerian
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported States */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-lg mx-4 shadow-sm">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported States & Authorities</h2>
          <p className="text-gray-600">We work with official waste management authorities across Nigeria</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {supportedStates.map((state, index) => (
            <div key={index} className="text-center">
              <Badge variant="secondary" className={`${state.color} mb-2 w-full justify-center py-2`}>
                {state.name}
              </Badge>
              <p className="text-sm text-gray-600">{state.authority}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/states">View All 37 States & Authorities</Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600">Simple steps to pay your waste bin bills</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Enter Your Details</h3>
            <p className="text-gray-600">Provide your location and waste bin ID to lookup your bill</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Verify & Pay</h3>
            <p className="text-gray-600">Review your bill details and make secure payment</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Receipt</h3>
            <p className="text-gray-600">Download your receipt and track payment history</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Nigerians who trust Bin-Pay for their waste bill payments
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="md" />
              </div>
              <p className="text-gray-400">Making waste bill payments simple and accessible across Nigeria.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/states" className="hover:text-white">
                    Supported States
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@binpay.ng</li>
                <li>Phone: +234 800 BIN-PAY</li>
                <li>Hours: 24/7 Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Bin-Pay. All rights reserved. Licensed by CBN.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
