"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { NIGERIAN_STATES, getActiveStates, getStatesByRegion, searchStates, type StateData } from "@/lib/states-data"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Google Maps embed URLs for each state
const STATE_MAPS: Record<string, { embedUrl: string; description: string }> = {
  lagos: {
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253682.62697814634!2d3.1191679!3d6.5243793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos!5e0!3m2!1sen!2sng!4v1694123456789!5m2!1sen!2sng",
    description: "Comprehensive waste management coverage across all 20 Local Government Areas in Lagos State. LAWMA operates in 5 major zones covering Lagos Island, Lagos Mainland, Surulere, Ikeja, and Ikorodu regions."
  },
  fct: {
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d252230.02926364106!2d7.3986474!3d9.0764785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104e0baf7da48d0d%3A0x99a8fe4168c50bc8!2sAbuja!5e0!3m2!1sen!2sng!4v1694123456789!5m2!1sen!2sng",
    description: "Full environmental protection services across all 6 Area Councils in the Federal Capital Territory. AEPB maintains service zones in Abuja Municipal, Gwagwalada, Kuje, Bwari, Kwali, and Abaji."
  },
  enugu: {
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d507394.77441234!2d6.7227018!3d6.5126673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x105b662586cf0979%3A0x27595621a4034717!2sEnugu!5e0!3m2!1sen!2sng!4v1694123456789!5m2!1sen!2sng",
    description: "Complete waste management services across all 17 Local Government Areas in Enugu State. ESWAMA operates in 5 strategic zones covering Enugu, Nsukka, Oji River, Awgu, and Udi regions."
  }
}

interface BackendState {
  name: string
  code: string
  capital: string
  authorityName: string
  authorityFullName: string
  authorityWebsite?: string
  authorityPhone?: string
  authorityEmail?: string
  headquarters: string
  binIdFormat: string
  billCycle: string
  averageBill: number
  isActive: boolean
  lgas: { name: string }[]
  zones: { name: string }[]
  _count?: {
    bills: number
    payments: number
    lgas: number
    zones: number
  }
}

export default function StatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedState, setSelectedState] = useState<StateData | null>(null)
  const [backendStates, setBackendStates] = useState<BackendState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useBackendData, setUseBackendData] = useState(false)

  const regions = getStatesByRegion()
  const activeStates = getActiveStates()

  useEffect(() => {
    const fetchStates = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/admin/states`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch states from backend')
        }

        const data = await response.json()
        setBackendStates(data.states || [])
        setUseBackendData(true)
      } catch (err) {
        console.error('Error fetching states:', err)
        setError('Using local state data. Backend unavailable.')
        // Fall back to local data
        setUseBackendData(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStates()
  }, [])

  const filteredStates = () => {
    if (useBackendData && backendStates.length > 0) {
      // Convert backend states to StateData format
      let states = backendStates.map(s => ({
        name: s.name,
        code: s.code,
        capital: s.capital,
        population: 0, // Not in backend model
        lgas: s.lgas.map(l => l.name),
        wasteAuthority: {
          name: s.authorityName,
          fullName: s.authorityFullName,
          code: s.authorityName,
          headquarters: s.headquarters,
          phone: s.authorityPhone,
          email: s.authorityEmail,
          website: s.authorityWebsite,
          binIdFormat: s.binIdFormat,
          billCycle: s.billCycle as "monthly" | "quarterly" | "annually",
          averageBill: s.averageBill,
          paymentMethods: ['card', 'bank_transfer', 'ussd'],
          zones: s.zones.map(z => z.name),
        },
        isActive: s.isActive,
      } as StateData))

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        states = states.filter(s => 
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.capital.toLowerCase().includes(query) ||
          s.wasteAuthority.name.toLowerCase().includes(query)
        )
      }

      return states
    }

    // Fallback to local data
    let states = searchQuery ? searchStates(searchQuery) : Object.values(NIGERIAN_STATES)

    if (selectedRegion !== "all") {
      const regionStates = regions[selectedRegion as keyof typeof regions] || []
      states = states.filter((state) =>
        regionStates.includes(Object.keys(NIGERIAN_STATES).find((key) => NIGERIAN_STATES[key] === state) || ""),
      )
    }

    return states
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const renderStateMap = () => {
    if (!selectedState) return null

    // Get the state code in lowercase for lookup
    const stateCode = selectedState.code.toLowerCase()
    const mapData = STATE_MAPS[stateCode]

    // If no map data available for this state, don't render anything
    if (!mapData) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {selectedState.name} State Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 rounded-lg overflow-hidden border">
            <iframe
              src={mapData.embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${selectedState.name} State Map`}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Coverage Area:</strong> All {selectedState.lgas.length} Local Government Areas
            </p>
            <p>
              <strong>Service Zones:</strong> {selectedState.wasteAuthority.zones.join(", ")}
            </p>
            <p>
              <strong>Authority:</strong> {selectedState.wasteAuthority.fullName}
            </p>
            <p className="mt-2">{mapData.description}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo href="/" size="sm" />
              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-gray-900">Supported States & Authorities</h1>
                <p className="text-sm text-gray-600">Waste management across Nigeria</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading states...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && (
          <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total States</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {useBackendData ? backendStates.length : Object.keys(NIGERIAN_STATES).length}
                  </p>
                  <p className="text-xs text-gray-500">States + FCT</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active States</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {useBackendData ? backendStates.filter(s => s.isActive).length : activeStates.length}
                  </p>
                  <p className="text-xs text-gray-500">Fully operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total LGAs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {useBackendData 
                      ? backendStates.reduce((sum, s) => sum + (s._count?.lgas || s.lgas.length), 0)
                      : Object.values(NIGERIAN_STATES).reduce((sum, s) => sum + s.lgas.length, 0)
                    }
                  </p>
                  <p className="text-xs text-gray-500">Local governments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Monthly Bill</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {useBackendData && backendStates.length > 0
                      ? formatCurrency(
                          backendStates.reduce((sum, s) => sum + s.averageBill, 0) / backendStates.length
                        )
                      : formatCurrency(
                          Object.values(NIGERIAN_STATES).reduce((sum, s) => sum + s.wasteAuthority.averageBill, 0) / 
                          Object.keys(NIGERIAN_STATES).length
                        )
                    }
                  </p>
                  <p className="text-xs text-gray-500">Across all states</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search states, capitals, or waste authorities..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North Central">North Central</SelectItem>
              <SelectItem value="North East">North East</SelectItem>
              <SelectItem value="North West">North West</SelectItem>
              <SelectItem value="South East">South East</SelectItem>
              <SelectItem value="South South">South South</SelectItem>
              <SelectItem value="South West">South West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStates().map((state) => (
                <Card
                  key={state.code}
                  className={`cursor-pointer transition-all hover:shadow-lg ${!state.isActive ? "opacity-60" : ""}`}
                  onClick={() => setSelectedState(state)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{state.name}</span>
                        {state.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </CardTitle>
                      <Badge variant="outline">{state.code}</Badge>
                    </div>
                    <CardDescription>
                      Capital: {state.capital} • {state.lgas.length} LGAs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{state.wasteAuthority.name}</p>
                        <p className="text-xs text-gray-500">{state.wasteAuthority.fullName}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Bill:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(state.wasteAuthority.averageBill)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Billing:</span>
                        <Badge variant="secondary" className="text-xs">
                          {state.wasteAuthority.billCycle}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {state.wasteAuthority.paymentMethods.slice(0, 3).map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method.replace("_", " ")}
                          </Badge>
                        ))}
                        {state.wasteAuthority.paymentMethods.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{state.wasteAuthority.paymentMethods.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <div className="space-y-4">
              {filteredStates().map((state) => (
                <Card
                  key={state.code}
                  className={`cursor-pointer transition-all hover:shadow-md ${!state.isActive ? "opacity-60" : ""}`}
                  onClick={() => setSelectedState(state)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{state.name}</h3>
                          {state.isActive ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <Badge variant="outline">{state.code}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(state.wasteAuthority.averageBill)}
                        </p>
                        <p className="text-sm text-gray-500">{state.wasteAuthority.billCycle}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Capital: <span className="font-medium">{state.capital}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          LGAs: <span className="font-medium">{state.lgas.length}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Authority: <span className="font-medium">{state.wasteAuthority.name}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Population: <span className="font-medium">{state.population.toLocaleString()}</span>
                        </p>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-1">
                          {state.wasteAuthority.paymentMethods.map((method) => (
                            <Badge key={method} variant="outline" className="text-xs">
                              {method.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* State Detail Modal */}
        {selectedState && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold">{selectedState.name} State</h2>
                    {selectedState.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setSelectedState(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* State Information */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          State Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">State Code</p>
                            <p className="font-semibold">{selectedState.code}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Capital</p>
                            <p className="font-semibold">{selectedState.capital}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Population</p>
                            <p className="font-semibold">{selectedState.population.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">LGAs</p>
                            <p className="font-semibold">{selectedState.lgas.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Local Government Areas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {selectedState.lgas.map((lga) => (
                            <Badge key={lga} variant="outline" className="justify-start">
                              {lga}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {renderStateMap()}
                  </div>

                  {/* Waste Authority Information */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Waste Management Authority</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg">{selectedState.wasteAuthority.name}</h4>
                          <p className="text-gray-600">{selectedState.wasteAuthority.fullName}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{selectedState.wasteAuthority.headquarters}</span>
                          </div>
                          {selectedState.wasteAuthority.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{selectedState.wasteAuthority.phone}</span>
                            </div>
                          )}
                          {selectedState.wasteAuthority.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{selectedState.wasteAuthority.email}</span>
                            </div>
                          )}
                          {selectedState.wasteAuthority.website && (
                            <div className="flex items-center space-x-2">
                              <Globe className="w-4 h-4 text-gray-500" />
                              <a
                                href={selectedState.wasteAuthority.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Billing Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Average Bill</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(selectedState.wasteAuthority.averageBill)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Billing Cycle</p>
                            <Badge className="mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {selectedState.wasteAuthority.billCycle}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-2">Bin ID Format</p>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {selectedState.wasteAuthority.binIdFormat}
                          </code>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-3">Payment Methods</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedState.wasteAuthority.paymentMethods.map((method) => (
                              <Button
                                key={method}
                                variant="outline"
                                size="sm"
                                className="hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                                asChild
                              >
                                <Link href={`/login?redirect=/dashboard&paymentMethod=${method}`}>
                                  <CreditCard className="w-3 h-3 mr-2" />
                                  {method.replace("_", " ").toUpperCase()}
                                </Link>
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Click a payment method to get started
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-2">Service Zones</p>
                          <div className="grid grid-cols-1 gap-1">
                            {selectedState.wasteAuthority.zones.map((zone) => (
                              <Badge key={zone} variant="secondary" className="justify-start">
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedState.isActive && (
                      <Button className="w-full" asChild>
                        <Link href={`/register?state=${selectedState.code.toLowerCase()}`}>
                          Start Paying Bills in {selectedState.name}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Paying Your Waste Bills?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of Nigerians who trust Bin-Pay for convenient, secure waste bill payments across all
                supported states and territories.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">See Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
