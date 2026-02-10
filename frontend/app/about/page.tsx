import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Logo href="/" />
          <nav>
            <Link href="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">About Bin-Pay</h1>
        <p className="text-gray-700 mb-6">Bin-Pay connects residents with their local waste management authorities to view and pay waste bin bills across Nigeria.</p>
        <div className="space-x-2">
          <Button asChild>
            <Link href="/help">Get Help</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
