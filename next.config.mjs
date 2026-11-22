import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'

// A production build must know the API and its own address: sign-in, payments
// and Stripe's return links use them (lib/env.ts). Demo builds run without the API.
function checkProductionEnv() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return
  const missing = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_APP_URL'].filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) {
    throw new Error(`Set ${missing.join(' and ')} for a production build (e.g. https://api.nichepop.app/api/v1 and https://nichepop.app), or NEXT_PUBLIC_DEMO_MODE=true for a demo without the API.`)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development practices
  reactStrictMode: true,

  images: {
    // Enable Next.js image optimization for better performance
    unoptimized: false,
    // Add image formats for better compression
    formats: ['image/avif', 'image/webp'],
  },

  // Enable compression
  compress: true,

  // Optimize production builds
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for better performance
  experimental: {
    // Enable optimistic client cache
    optimisticClientCache: true,
    // Optimize CSS
    optimizeCss: true,
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) checkProductionEnv()
  return nextConfig
}
