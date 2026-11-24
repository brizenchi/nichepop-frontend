/* Hallmark · genre: playful · macrostructure: workbench (live list) · design-system: design.md · designed-as-app */
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Footer } from "@/components/footer"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { Navbar } from "@/components/navbar"
import { LockedWordRow, WordRow } from "@/components/radar/word-row"
import { ComingSoon } from "@/components/workspace/resource-states"
import { isComingSoon, listNiches } from "@/lib/api/niches"
import { PUBLIC_DELAY_HOURS, isFreshWord } from "@/lib/data/radar"
import { DEMO_MODE } from "@/lib/demo"
import { getDictionary, localizedHref, type Locale } from "@/lib/i18n"
import type { RadarWord } from "@/lib/types"

/** Today's public list, read on the server as a visitor: the API holds back words found in the last 48 hours. */
async function loadWords(locale: Locale): Promise<RadarWord[] | null> {
  try {
    return (await listNiches({ locale })).items
  } catch (error) {
    // Until the trend library is live the page says so; other failures are real errors.
    if (isComingSoon(error)) return null
    throw error
  }
}

export async function NewKeywordsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const t = dict.newKeywords
  const pricingHref = localizedHref("/pricing", locale)
  const words = await loadWords(locale)
  const allWords = words ?? []
  const publicWords = allWords.filter((w) => !isFreshWord(w)).sort((a, b) => a.firstSeenHoursAgo - b.firstSeenHoursAgo)
  const lockedWords = allWords.filter(isFreshWord)
  const avg = (values: number[]) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0)
  const sitesThen = avg(publicWords.map((w) => w.sitesThen))
  const sitesNow = avg(publicWords.map((w) => w.sitesNow))

  return (
    <LocaleProvider locale={locale} remember>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main>
          <section className="pb-12 pt-36 sm:pt-44">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <h1 className="display-s max-w-3xl text-foreground">
                {t.title(PUBLIC_DELAY_HOURS)}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-body">
                {t.text(PUBLIC_DELAY_HOURS)}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={pricingHref} className="btn btn--lg">
                  {t.ctaEarlier(PUBLIC_DELAY_HOURS)}
                  <ArrowRight className="btn__arrow h-4 w-4" />
                </Link>
                <Link href="/start" className="btn btn--soft btn--lg">
                  {dict.common.startFree}
                </Link>
              </div>

              {words && (
                <>
                  <dl className="mt-10 flex max-w-2xl flex-wrap divide-x divide-rule-strong rounded-2xl bg-card py-3 shadow-card ring-1 ring-rule">
                    {[
                      { label: t.statPublished, value: publicWords.length },
                      { label: t.statProOnly, value: lockedWords.length },
                      { label: t.statSites, value: `${sitesThen} → ${sitesNow}` },
                    ].map((stat) => (
                      <div key={stat.label} className="min-w-0 flex-1 px-4 sm:px-5">
                        <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">{t.statNote}</p>
                </>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            {words ? (
              <>
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t.publishedToday}</h2>
                <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-rule">
                  {publicWords.map((word) => (
                    <WordRow key={word.id} word={word} showTimeGap askHref={`/ask?q=${encodeURIComponent(word.keyword)}`} />
                  ))}
                </ul>

                <div className="mt-10 flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-semibold text-foreground">{t.inProWindow}</h2>
                  <Link href={pricingHref} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-sky-ink hover:text-primary-hover">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.unlockNow}
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-rule overflow-hidden rounded-2xl border-2 border-dashed border-rule-strong bg-paper-2">
                  {lockedWords.map((word) => (
                    <LockedWordRow key={word.id} word={word} unlockInHours={PUBLIC_DELAY_HOURS - word.firstSeenHoursAgo} />
                  ))}
                </ul>
              </>
            ) : (
              <ComingSoon text={dict.states.newKeywordsSoon} />
            )}
          </section>

          <section className="border-t-2 border-ink bg-paper-2 py-16">
            <dl className="mx-auto max-w-5xl divide-y divide-rule-strong px-4 sm:px-6">
              {t.howTo.map((item) => (
                <div key={item.title} className="grid gap-2 py-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-8">
                  <dt className="text-base font-semibold text-foreground">{item.title}</dt>
                  <dd className="max-w-2xl text-sm leading-relaxed text-body">{item.text}</dd>
                </div>
              ))}
            </dl>
            {DEMO_MODE && <p className="mx-auto mt-8 max-w-5xl px-4 text-xs text-muted-foreground sm:px-6">{dict.common.demoNote}</p>}
          </section>
        </main>

        <Footer />
      </div>
    </LocaleProvider>
  )
}
