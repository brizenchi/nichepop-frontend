"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { PricingModal } from "@/components/pricing-modal"
import { AiFilterBar } from "@/components/radar/ai-filter-bar"
import { WordFilters } from "@/components/radar/word-filters"
import { LockedWordRow, WordRow } from "@/components/radar/word-row"
import { TrendsMonthView } from "@/components/trends/month-view"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { ComingSoon, EmptyState, ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useAccount } from "@/hooks/use-account"
import { useRadarWatchlist } from "@/hooks/use-radar-watchlist"
import { useResource } from "@/hooks/use-resource"
import { isComingSoon, listNiches } from "@/lib/api/niches"
import { PUBLIC_DELAY_HOURS, demoWatchlist, isFreshWord } from "@/lib/data/radar"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { DEFAULT_FILTERS, applyFilters, type RadarFilters } from "@/lib/utils/radar-filters"

type PreviewPlan = "free" | "pro"
type View = "live" | "month"

export default function TrendsPage() {
  const locale = useLocale()
  const t = useT()
  const { plan: accountPlan } = useAccount()
  const { watchlist: savedWatchlist, loaded } = useRadarWatchlist()
  const [previewPlan, setPreviewPlan] = useState<PreviewPlan | null>(null)
  const [filters, setFilters] = useState<RadarFilters>(DEFAULT_FILTERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [view, setView] = useState<View>("live")

  const isPaidMember = accountPlan !== "free"
  // Previewing the other plan is a demo feature; real readers see their own plan.
  const plan: PreviewPlan = (DEMO_MODE ? previewPlan : null) ?? (isPaidMember ? "pro" : "free")
  const watchlist = savedWatchlist ?? (DEMO_MODE ? demoWatchlist : null)

  const load = useCallback(() => listNiches({ locale }), [locale])
  const niches = useResource(load)
  const allWords = useMemo(() => niches.data?.items ?? [], [niches.data])
  const roots = useMemo(() => Array.from(new Set(allWords.map((w) => w.root))), [allWords])
  const categories = useMemo(() => Array.from(new Set(allWords.map((w) => w.category))), [allWords])
  const words = applyFilters(allWords, filters)
  const lockedCount = allWords.filter(isFreshWord).length
  const [lockedBold, lockedRest] = t.radar.lockedBanner(lockedCount, PUBLIC_DELAY_HOURS)
  // The demo header always shows two fresh words; real data counts them.
  const newThisHour = DEMO_MODE ? 2 : allWords.filter((w) => w.firstSeenHoursAgo < 1).length

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.radar.title}</h1>
            <p className={cn("mt-2 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground", !loaded && "invisible")}>
              {newThisHour > 0 && (
                <>
                  <span className="relative mr-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="font-medium text-success">{t.radar.newThisHour(newThisHour)}</span> ·{" "}
                </>
              )}
              {/* The demo header claims an update time; real builds have none until the trend library reports it (frontend#8). */}
              {DEMO_MODE ? t.radar.updated(watchlist?.roots.length ?? 0) : t.radar.watching(watchlist?.roots.length ?? 0)}{" "}
              <Link href="/trends/setup" className="font-medium text-primary hover:text-primary-hover">
                {t.radar.editRoots}
              </Link>
            </p>
          </div>
          {DEMO_MODE && (
            <div className="flex shrink-0 items-center gap-2" role="group" aria-label={t.radar.previewAs}>
              <span className="text-xs text-muted-foreground">{t.radar.previewAs}</span>
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {(["free", "pro"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setPreviewPlan(option)}
                    aria-pressed={plan === option}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      plan === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option === "free" ? t.radar.previewFree : t.radar.previewPro}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="mt-6 inline-flex rounded-lg bg-muted p-0.5" role="tablist">
          {(["live", "month"] as const).map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={view === option}
              onClick={() => setView(option)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                view === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "live" ? t.radar.tabLive : t.radar.tabMonth}
            </button>
          ))}
        </div>

        {view === "month" && (
          <div className="mt-6">
            <TrendsMonthView />
          </div>
        )}

        {view === "live" && plan === "free" && lockedCount > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-body">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">{lockedBold}</strong>
                {lockedRest}
              </span>
            </p>
            <button onClick={() => setShowPricing(true)} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
              <Sparkles className="h-3.5 w-3.5" />
              {t.radar.seeNow}
            </button>
          </div>
        )}

        {view === "live" && (
          <>
            <div className="mt-8">
              <AiFilterBar onApply={setFilters} />
            </div>

            <div className="mt-4">
              <WordFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
                roots={roots}
                resultCount={words.length}
                totalCount={allWords.length}
                isPro={plan === "pro"}
                onUpgrade={() => setShowPricing(true)}
              />
            </div>

            {niches.error ? (
              isComingSoon(niches.error) ? (
                <ComingSoon text={t.states.trendsSoon} className="mt-4" />
              ) : (
                <ErrorState error={niches.error} onRetry={() => void niches.reload()} className="mt-4" />
              )
            ) : niches.loading ? (
              <LoadingState className="mt-4" />
            ) : allWords.length === 0 ? (
              <EmptyState title={t.states.noTrends} className="mt-4" />
            ) : (
              <ul className={cn(cardStyles, "mt-4 divide-y divide-border")}>
                {words.length === 0 && (
                  <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                    {t.radar.empty}{" "}
                    <button onClick={() => setFilters(DEFAULT_FILTERS)} className="font-medium text-primary hover:text-primary-hover cursor-pointer">
                      {t.radar.resetFilters}
                    </button>
                  </li>
                )}
                {words.map((word) =>
                  plan === "free" && isFreshWord(word) ? (
                    <LockedWordRow key={word.id} word={word} unlockInHours={PUBLIC_DELAY_HOURS - word.firstSeenHoursAgo} />
                  ) : (
                    <WordRow
                      key={word.id}
                      word={word}
                      askHref={`/ask?q=${encodeURIComponent(word.keyword)}`}
                      showBuild
                      expanded={expandedId === word.id}
                      onToggle={() => setExpandedId(expandedId === word.id ? null : word.id)}
                    />
                  ),
                )}
              </ul>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t.radar.legend} {DEMO_MODE && t.common.demoNote}
            </p>
          </>
        )}
      </main>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.radar.upgradeFeature} />
    </div>
  )
}
