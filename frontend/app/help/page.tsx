import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function HelpPage() {
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
        <h1 className="text-3xl font-bold mb-4">Help Center</h1>
        <p className="text-gray-700 mb-6">Find FAQs and support resources to help you use Bin-Pay.</p>
        <div className="space-x-2">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
