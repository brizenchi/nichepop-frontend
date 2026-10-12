'use client'

export function PricingSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'NichePop Ideas DB, Idea Analysis, and Reddit Marketing',
    description: 'Free Ideas DB, free idea analysis, and a paid Reddit marketing workflow for founders and small teams.',
    brand: {
      '@type': 'Brand',
      name: 'NichePop',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
        description: 'Use the free Ideas DB and run free idea analysis with source-backed signals.',
      },
      {
        '@type': 'Offer',
        name: 'Reddit Marketing Monthly',
        price: '49',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
        description: 'Unlock the Reddit marketing panel with thread discovery, reply suggestions, lead tracking, and saved follow-up workflow.',
      },
      {
        '@type': 'Offer',
        name: 'Reddit Marketing Yearly',
        price: '490',
        priceCurrency: 'USD',
        billingDuration: 'P1Y',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
        description: 'Reddit marketing plan billed annually.',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
