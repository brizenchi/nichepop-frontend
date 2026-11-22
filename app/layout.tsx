import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AccountProvider } from "@/hooks/use-account"
import { getSiteUrl } from "@/lib/seo/site-url"
import "./globals.css"

// Hum type: Plus Jakarta Sans for display + body, JetBrains Mono for labels.
// Chinese falls back to the system CJK faces listed in app/tokens.css.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  preload: true,
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
})

const ICON_VERSION = 2

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "NichePop - Low Competition Keyword Research Tool",
    template: "%s | NichePop",
  },
  description: "Spot trends early, ask an AI analyst whether they are worth building, and keep watch on products and markets. Built for indie developers.",
  keywords: [
    "trending keywords",
    "profitable niches",
    "keyword research",
    "real-time insights",
    "low-competition keywords",
    "AI analysis",
    "social listening",
    "niche discovery"
  ],
  authors: [{ name: "NichePop" }],
  creator: "NichePop",
  publisher: "NichePop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'NichePop - Low Competition Keyword Research Tool',
    description: 'Find trending keyword opportunities with real-time data and competition signals.',
    siteName: 'NichePop',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'NichePop - Keyword Research Tool',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NichePop - Low Competition Keyword Research Tool',
    description: 'Find low-competition keyword opportunities faster with real-time trend data.',
    images: ['/twitter-image.png'],
    creator: '@nichepop',
  },
  // Bump ICON_VERSION whenever the logo changes: browsers cache favicons by URL and
  // otherwise keep showing the old one.
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "32x32" },
      { url: `/icon.svg?v=${ICON_VERSION}`, type: "image/svg+xml" },
    ],
    apple: `/apple-icon.png?v=${ICON_VERSION}`,
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased">
        <AccountProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </AccountProvider>
      </body>
    </html>
  )
}
