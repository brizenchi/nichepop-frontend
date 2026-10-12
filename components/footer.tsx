"use client"

import Link from "next/link"
import { Mail } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F4FF_48%,#EFE9FF_100%)] text-[#111111]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(125,76,230,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(125,76,230,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <Link href="/" className="group mb-4 flex items-center gap-2">
                <BrandLogo
                  size="lg"
                  markClassName="transition-all duration-200 group-hover:drop-shadow-[0_0_12px_rgba(125,76,230,0.24)]"
                  textClassName="font-black"
                />
              </Link>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#6E677D]">
                NichePop gives you three clear jobs: browse opportunities in Ideas DB for free, analyze any idea's business potential for free, then upgrade when you want a Reddit marketing workflow that keeps running.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="mailto:support@nichepop.app"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E1F4] bg-white/90 text-[#6E677D] transition-all duration-200 hover:border-[#7D4CE6]/30 hover:text-[#7D4CE6]"
                  aria-label="Email us"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#111111]">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Reddit Marketing
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#111111]">Core Features</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard/ideas" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Ideas DB
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/validate" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Idea Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/monitor" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Reddit Marketing Panel
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#111111]">Fit</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/use-cases/bloggers" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Indie Hackers
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases/content-creators" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    SaaS Founders
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases/ecommerce" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Product Builders
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases/affiliate-marketing" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Growth Teams
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#111111]">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:support@nichepop.app" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-[#6E677D] transition-colors duration-200 hover:text-[#7D4CE6]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E8E1F4] py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-sm text-[#6E677D] sm:text-left">© {currentYear} NichePop. All rights reserved.</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 text-center text-[clamp(5rem,18vw,14rem)] font-black tracking-[-0.06em] text-[#7D4CE6]/[0.07]">
        nichepop
      </div>
    </footer>
  )
}
