import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function HelpPage() {
  const repo = "https://github.com/Victor-droid-ux/binpay/blob/main"

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
        <h1 className="text-3xl font-bold mb-4">Help & Support</h1>

        <p className="text-gray-700 mb-6">Find documentation and support links below. For urgent issues, email support@binpay.ng.</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Documentation</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li>
              <a href={`${repo}/README.md`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Project README</a>
            </li>
            <li>
              <a href={`${repo}/SMS_FEATURE.md`} target="_blank" rel="noreferrer" className="text-blue-600 underline">SMS Feature Notes</a>
            </li>
            <li>
              <a href={`${repo}/DEPLOYMENT.md`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Deployment Guide</a>
            </li>
            <li>
              <a href={`${repo}/EMAIL_SETUP.md`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Email Setup</a>
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Quick Troubleshooting</h2>
          <ol className="list-decimal pl-6 text-gray-700">
            <li>Ensure backend is running (see `backend/README` and run `npm run dev`).</li>
            <li>Confirm environment variables in `backend/.env` and `frontend/.env.local`.</li>
            <li>Run `npm run build` in `frontend` if you see unexpected routing issues.</li>
          </ol>
        </section>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="mailto:support@binpay.ng">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
