import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Bin-Pay - Waste Bill Payments Across Nigeria",
    template: "%s | Bin-Pay",
  },
  description:
    "Pay your waste bin bills easily across all 36 Nigerian states and FCT. Fast, secure, and reliable waste management bill payments.",
  keywords: ["waste management", "bill payment", "Nigeria", "LAWMA", "AEPB", "waste bills"],
  authors: [{ name: "Bin-Pay Team" }],
  creator: "Bin-Pay",
  publisher: "Bin-Pay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://binpay.ng"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bin-Pay - Waste Bill Payments Across Nigeria",
    description: "Pay your waste bin bills easily across all 36 Nigerian states and FCT.",
    url: "https://binpay.ng",
    siteName: "Bin-Pay",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Bin-Pay Logo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bin-Pay - Waste Bill Payments Across Nigeria",
    description: "Pay your waste bin bills easily across all 36 Nigerian states and FCT.",
    images: ["/logo.png"],
    creator: "@binpay_ng",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
