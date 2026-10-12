'use client'

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Clock } from "lucide-react"

const blogPosts = [
  {
    slug: 'how-to-find-low-competition-keywords',
    title: 'How to Find Low Competition Keywords Using Reddit',
    description: 'Discover untapped keyword opportunities by analyzing Reddit discussions. Learn proven strategies to find low-competition keywords with high potential.',
    category: 'Keyword Research',
    readTime: '8 min read',
    publishedAt: '2026-02-01',
    author: 'NichePop Team',
  },
  {
    slug: 'keyword-opportunity-score-explained',
    title: 'Keyword Opportunity Score: What It Means & How to Use It',
    description: 'Understanding opportunity scores can transform your keyword research. Learn how to interpret and leverage this metric for better results.',
    category: 'Tutorial',
    readTime: '6 min read',
    publishedAt: '2026-02-02',
    author: 'NichePop Team',
  },
  {
    slug: 'nichepop-vs-ahrefs-comparison',
    title: 'NichePop vs Ahrefs: Honest Comparison for 2026',
    description: 'Comparing features, pricing, and value. Find out which keyword research tool is right for your needs and budget.',
    category: 'Comparison',
    readTime: '10 min read',
    publishedAt: '2026-02-03',
    author: 'NichePop Team',
  },
  {
    slug: 'estimate-keyword-profitability',
    title: 'How to Estimate Keyword Profitability (With Examples)',
    description: 'Learn the exact formula to calculate potential revenue from keywords. Real examples and actionable insights included.',
    category: 'Strategy',
    readTime: '7 min read',
    publishedAt: '2026-02-03',
    author: 'NichePop Team',
  },
  {
    slug: 'how-to-evaluate-keyword-worth',
    title: 'How to Evaluate if a Keyword is Worth Targeting: 7 Key Metrics Explained',
    description: 'Learn how to scientifically evaluate keyword value using 7 core metrics including search volume, competition, profit estimation, and more. Stop wasting time on low-value keywords.',
    category: 'Tutorial',
    readTime: '15 min read',
    publishedAt: '2026-03-01',
    author: 'NichePop Team',
  },
  {
    slug: 'openclaw-reddit-demand-analysis',
    title: 'OpenClaw Is Trending — 8 Business Opportunities from Reddit User Demands',
    description: 'We analyzed hundreds of Reddit posts about OpenClaw using NichePop to uncover real user demands. Discover 8 validated business opportunities in the OpenClaw AI agent ecosystem.',
    category: 'Market Research',
    readTime: '12 min read',
    publishedAt: '2026-03-05',
    author: 'NichePop Team',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="relative overflow-hidden bg-[#FAFAFA] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#FAFAFA]" />
          <div className="absolute top-24 right-[-4rem] hidden h-52 w-52 rounded-full bg-[#F3F600]/28 lg:block" />
          <div className="absolute top-40 left-2 hidden h-48 w-20 overflow-hidden bg-[#FFECE2]/78 lg:block">
            <div
              className="absolute inset-0 opacity-75"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(ellipse at 24% 28%, transparent 0 12px, rgba(255,255,255,0.38) 13px 14px, transparent 15px 27px), repeating-radial-gradient(ellipse at 72% 66%, transparent 0 14px, rgba(255,255,255,0.34) 15px 16px, transparent 17px 31px)",
                backgroundSize: "180px 220px, 210px 180px",
                backgroundPosition: "-46px -28px, -74px 26px",
              }}
            />
          </div>
          <div className="absolute right-5 top-48 hidden h-56 w-20 overflow-hidden bg-[#F7B6D8]/72 lg:block">
            <div
              className="absolute inset-0 opacity-58"
              style={{
                backgroundImage:
                  "linear-gradient(62deg, transparent 0 37%, rgba(255,255,255,0.26) 38% 45%, transparent 46% 100%), linear-gradient(-62deg, transparent 0 37%, rgba(255,255,255,0.24) 38% 45%, transparent 46% 100%), repeating-linear-gradient(62deg, rgba(218,74,154,0.12) 0 1px, transparent 1px 36px), repeating-linear-gradient(-62deg, rgba(218,74,154,0.11) 0 1px, transparent 1px 36px)",
                backgroundSize: "54px 68px, 54px 68px, 54px 68px, 54px 68px",
              }}
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.45)_55%,transparent_100%)] bg-[size:34px_34px] opacity-45" />
        </div>
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center space-y-6 mb-16">
            <Badge className="bg-[#F7F4FF] text-[#7D4CE6] border-[#E8E1F4] px-4 py-1.5 backdrop-blur-sm">
              Blog
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Keyword Research Tips & Guides
            </h1>

            <p className="text-lg sm:text-xl text-[#6E677D] max-w-2xl mx-auto leading-relaxed font-light">
              Expert insights on finding profitable keywords, analyzing competition, and discovering trending niches
            </p>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full cursor-pointer border-[#E8E1F4] bg-white transition-all duration-300 hover:-translate-y-2 hover:border-[#D8CCF2] hover:shadow-[0_24px_48px_rgba(77,54,42,0.08)]">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs border-[#E8E1F4] text-[#7D4CE6]">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-[#6E677D] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2 text-[#111111] hover:text-[#1479D6] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-[#6E677D]">
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-[#6E677D]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-[#1479D6]">
                        Read more
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="border-2 border-[#D8CCF2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F4FF_50%,#EFE9FF_100%)] shadow-[0_24px_56px_rgba(77,54,42,0.1)]">
              <CardContent className="p-12 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ready to Find Your Next Keyword Opportunity?
                </h2>
                <p className="text-[#6E677D] max-w-2xl mx-auto font-light">
                  Put these strategies into action with NichePop's real-time keyword research tool
                </p>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-[#111111] px-10 py-6 text-lg font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111111]/92 hover:shadow-[0_18px_34px_rgba(17,17,17,0.14)]">
                    Start Exploring Keywords
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
