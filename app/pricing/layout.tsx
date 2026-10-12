import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Reddit Marketing Plans',
  description: 'Ideas DB and Idea Analysis are free. Pay only when you want the Reddit marketing panel, lead tracking, and ongoing follow-up workflow.',
  keywords: [
    'reddit marketing pricing',
    'reddit lead generation pricing',
    'startup opportunity tool pricing',
    'idea analysis tool pricing',
    'reddit workflow subscription',
    'founder marketing tool pricing',
  ],
  openGraph: {
    title: 'NichePop Pricing - Pay Only For Reddit Marketing',
    description: 'Free Ideas DB and free Idea Analysis. Upgrade when you want the Reddit marketing workflow.',
    type: 'website',
    images: [{
      url: '/og-image-pricing.png',
      width: 1200,
      height: 630,
      alt: 'NichePop Pricing Plans',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NichePop Pricing - Pay Only For Reddit Marketing',
    description: 'Free Ideas DB and free Idea Analysis. Upgrade when you want the Reddit marketing workflow.',
    images: ['/twitter-image-pricing.png'],
  },
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
