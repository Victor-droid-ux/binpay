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

        <p className="text-gray-700 mb-6">Bin-Pay is a full-stack platform that helps residents across Nigeria view and pay waste bin bills. It connects users, state waste management authorities, and administrators in a single system — supporting all 36 states + FCT.</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li>Multi-state coverage (36 states + FCT)</li>
            <li>Role-based access: User, State Admin, Super Admin</li>
            <li>Secure payments via Paystack</li>
            <li>Bill lookup by BIN ID and payment history</li>
            <li>Admin dashboards and reporting</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Architecture</h2>
          <p className="text-gray-700">Bin-Pay is split into a TypeScript Express backend and a Next.js frontend. The repository contains `backend/` for API and `frontend/` for the Next.js app.</p>
        </section>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/help">Help Center</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="https://github.com/Victor-droid-ux/binpay/blob/main/README.md" target="_blank">View Repo Docs</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
