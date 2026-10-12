import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Run A Marketing Dashboard, Then Upgrade For Follow-up',
  description: 'NichePop lets founders preview a marketing dashboard for free, then pay for validation and continuous customer follow-up workflows.',
  keywords: [
    'startup idea validation',
    'idea discovery tool',
    'market opportunity finder',
    'founder marketing dashboard',
    'product follow-up tool',
    'indie hacker idea validation',
    'startup pain point research',
    'find real users for startup',
    'market signal follow-up',
    'public discussion research',
  ],
  openGraph: {
    title: 'NichePop - Marketing Dashboard First, Tools Second',
    description: 'Preview a marketing dashboard for free, then unlock validation and continuous follow-up workflows.',
    type: 'website',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'NichePop marketing dashboard workflow',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NichePop - Marketing Dashboard First, Tools Second',
    description: 'Preview a marketing dashboard for free, then unlock validation and continuous follow-up workflows.',
    images: ['/twitter-image.png'],
  },
  alternates: {
    canonical: '/',
  },
}
