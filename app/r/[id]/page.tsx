import type { Metadata } from "next"
import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Sparkles } from "lucide-react"
import { Footer } from "@/components/footer"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { Navbar } from "@/components/navbar"
import { ReportView } from "@/components/radar/report-view"
import { getSharedReport } from "@/lib/api/reports"
import { PUBLIC_DELAY_HOURS } from "@/lib/data/radar"
import { getDictionary, type Locale } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

// The metadata and the page read the same shared report once per request.
const loadReport = cache(async (shareId: string, locale: Locale) => (await getSharedReport(shareId, locale))?.report ?? null)

type Params = { id: string }
type SearchParams = { lang?: string }

export async function generateMetadata({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { id } = await params
  const { lang } = await searchParams
  const locale = await getRequestLocale(lang)
  const t = getDictionary(locale).share
  const report = await loadReport(id, locale)
  if (!report) return { title: t.notFound }

  // Words still inside the Pro window stay out of search results until it passes.
  const fresh = report.kind === "keyword" && report.wordAgeHours !== null && report.wordAgeHours < PUBLIC_DELAY_HOURS
  const title = t.meta[report.kind](report.query)
  const path = `/r/${id}`
  return {
    title,
    description: report.headline,
    alternates: {
      canonical: locale === "zh" ? `${path}?lang=zh` : path,
      languages: { en: path, "zh-CN": `${path}?lang=zh`, "x-default": path },
    },
    // Only keyword reports past the Pro window are indexed; idea, product and market reports stay out of search.
    robots: report.kind === "keyword" && !fresh ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${title} — NichePop`, description: report.headline, locale: locale === "zh" ? "zh_CN" : "en_US" },
  }
}

export default async function SharedReportPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { id } = await params
  const { lang } = await searchParams
  const locale = await getRequestLocale(lang)
  const t = getDictionary(locale).share
  const report = await loadReport(id, locale)
  if (!report) notFound()
  const cta = t.cta[report.kind]
  // Keyword readers often want the same word checked; for products and sites they bring their own.
  const askHref = report.kind === "keyword" ? `/ask?q=${encodeURIComponent(report.query)}` : "/ask"

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen bg-subtle">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t.badge}
          </p>
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
            <ReportView report={report} shared />
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-foreground px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{cta}</p>
              <p className="mt-1 text-sm text-white/70">{t.ctaText}</p>
            </div>
            <Link
              href={askHref}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t.tryFree}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </LocaleProvider>
  )
}
