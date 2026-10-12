'use client'

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/breadcrumb"
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2 } from "lucide-react"
import type { ReactNode } from "react"

interface BlogArticleLayoutProps {
  title: string
  description: string
  category: string
  readTime: string
  publishedAt: string
  author: string
  children: ReactNode
}

export function BlogArticleLayout({
  title,
  description,
  category,
  readTime,
  publishedAt,
  author,
  children,
}: BlogArticleLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="relative overflow-hidden bg-[#FAFAFA] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#FAFAFA]" />
          <div className="absolute top-24 right-[-4rem] hidden h-48 w-48 rounded-full bg-[#F3F600]/24 lg:block" />
          <div className="absolute top-32 left-2 hidden h-44 w-16 overflow-hidden bg-[#FFECE2]/78 lg:block" />
          <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.35)_55%,transparent_100%)] bg-[size:34px_34px] opacity-40" />
        </div>
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Blog", href: "/blog" },
              { label: title, href: "" },
            ]}
            className="mb-8"
          />

          {/* Back to Blog */}
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-8 -ml-2 text-[#6E677D] hover:text-[#111111] hover:bg-[#F7F4FF]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <article className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-[#E8E1F4] text-[#7D4CE6]">{category}</Badge>
                <span className="text-sm text-[#6E677D] flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readTime}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-[#111111]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {title}
              </h1>

              <p className="text-xl text-[#6E677D] leading-relaxed font-light">
                {description}
              </p>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4 text-sm text-[#6E677D]">
                  <span>By {author}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="border-[#E8E1F4] bg-transparent text-[#111111] hover:bg-[#F3EDFF] hover:border-[#7D4CE6]">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Separator className="bg-[#E8E1F4]" />

            {/* Article Content */}
            <div className="prose prose-lg max-w-none
              [&>h2]:text-[#111111] [&>h2]:font-bold [&>h2]:text-2xl [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:font-[Space_Grotesk]
              [&>h3]:text-[#111111] [&>h3]:font-semibold [&>h3]:text-xl [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:font-[Space_Grotesk]
              [&>p]:text-[#6E677D] [&>p]:leading-relaxed [&>p]:mb-4
              [&>ul]:text-[#6E677D] [&>ul]:space-y-2 [&>ul]:mb-6
              [&>ol]:text-[#6E677D] [&>ol]:space-y-2 [&>ol]:mb-6
              [&>li]:text-[#6E677D] [&>li]:leading-relaxed
              [&>strong]:text-[#111111] [&>strong]:font-semibold
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-8 [&_table]:text-sm [&_table]:rounded-lg [&_table]:overflow-hidden
              [&_thead]:bg-[#F7F4FF]
              [&_th]:border [&_th]:border-[#E8E1F4] [&_th]:p-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[#111111]
              [&_td]:border [&_td]:border-[#E8E1F4] [&_td]:p-4 [&_td]:text-[#6E677D]
              [&_tbody_tr]:bg-[#F7F4FF]/50 [&_tbody_tr:hover]:bg-[#EFE9FF] [&_tbody_tr]:transition-colors
              [&_.overflow-x-auto]:rounded-lg [&_.overflow-x-auto]:border [&_.overflow-x-auto]:border-[#E8E1F4]">
              {children}
            </div>

            <Separator className="my-12 bg-[#E8E1F4]" />

            {/* CTA Section */}
            <Card className="border-2 border-[#D8CCF2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F4FF_50%,#EFE9FF_100%)] shadow-[0_24px_56px_rgba(77,54,42,0.1)]">
              <CardContent className="p-8 text-center space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-[#111111]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ready to Find Your Next Keyword?
                </h2>
                <p className="text-[#6E677D] font-light">
                  Use NichePop to discover trending keywords with low competition
                </p>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-[#111111] px-10 py-6 text-lg font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111111]/92 hover:shadow-[0_18px_34px_rgba(17,17,17,0.14)]">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
