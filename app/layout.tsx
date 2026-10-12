import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from "@/hooks/useAuth"
import { getSiteUrl } from "@/lib/seo/site-url"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: 'swap',
  preload: true,
  fallback: ['monospace']
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "NichePop - Free Ideas DB, Free Idea Analysis, Paid Reddit Marketing",
    template: "%s | NichePop",
  },
  description: "Browse opportunities in a free Ideas DB, run free idea analysis, and upgrade only when you want a Reddit marketing panel with threads, reply ideas, and lead follow-up.",
  keywords: [
    "ideas database",
    "startup opportunity database",
    "idea analysis tool",
    "business opportunity analysis",
    "reddit marketing tool",
    "reddit lead generation",
    "founder research workflow",
    "indie hacker tools",
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
    title: 'NichePop - Free Ideas DB, Free Idea Analysis, Paid Reddit Marketing',
    description: 'Use the free Ideas DB and free idea analysis first. Pay only for the Reddit marketing panel when you need execution.',
    siteName: 'NichePop',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'NichePop founder workflow',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NichePop - Free Ideas DB, Free Idea Analysis, Paid Reddit Marketing',
    description: 'Use the free Ideas DB and free idea analysis first. Pay only for the Reddit marketing panel when you need execution.',
    images: ['/twitter-image.png'],
    creator: '@nichepop',
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} bg-background font-sans text-foreground antialiased`}>
        <AuthProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  )
}
