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

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.nichepop.app',
          },
        ],
        destination: 'https://nichepop.app/:path*',
        permanent: true,
      },
      {
        source: '/compare',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/compare/ahrefs',
        destination: '/blog/nichepop-vs-ahrefs-comparison',
        permanent: true,
      },
      {
        source: '/compare/semrush',
        destination: '/blog',
        permanent: true,
      },
    ]
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

export default nextConfig
