"use client"

import { useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Eye } from "lucide-react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { cardStyles } from "@/components/radar/ui"
import { ComingSoon, ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useResource } from "@/hooks/use-resource"
import { getMonthTrends, isComingSoon } from "@/lib/api/niches"
import type { MonthlyTrend } from "@/lib/data/trends"
import { cn } from "@/lib/utils"

function Line({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / Math.max(1, max - min)) * 27}`).join(" ")
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={points} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const STATUS_STYLES: Record<MonthlyTrend["status"], string> = {
  rising: "bg-success-soft text-success",
  peaked: "bg-warning-soft text-warning",
  fading: "bg-muted text-muted-foreground",
}

/** The last 30 days: which categories heated up, how many trends we found each week, what grew most. */
export function TrendsMonthView() {
  const locale = useLocale()
  const t = useT()
  const tr = t.radar
  const load = useCallback(() => getMonthTrends(locale), [locale])
  const month = useResource(load)

  if (month.error) {
    return isComingSoon(month.error) ? <ComingSoon text={t.states.monthSoon} /> : <ErrorState error={month.error} onRetry={() => void month.reload()} />
  }
  if (!month.data) return <LoadingState />
  const { categories: categoryMomentum, weekly: weeklyNewTrends, trends: monthly } = month.data
  const maxWeek = Math.max(1, ...weeklyNewTrends)

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{tr.monthIntro}</p>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{tr.categories}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryMomentum.map((c) => (
            <div key={c.category} className={cn(cardStyles, "p-4")}>
              <p className="text-xs font-medium text-muted-foreground">{t.word.categories[c.category] ?? c.category}</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", c.change >= 0 ? "text-success" : "text-warning")}>
                {c.change >= 0 ? "+" : ""}
                {c.change}%
              </p>
              <p className="text-xs text-muted-foreground">{tr.newTrends(c.newTrends)}</p>
              <Line data={c.trend} className="mt-3 h-10 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{tr.weekly}</h2>
        <div className={cn(cardStyles, "flex h-40 items-end gap-4 px-5 pb-4 pt-6")}>
          {weeklyNewTrends.map((count, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-semibold tabular-nums text-foreground">{count}</span>
              <div className="w-full max-w-16 rounded-t-md bg-primary/80" style={{ height: `${(count / maxWeek) * 70}%` }} />
              <span className="text-[11px] text-muted-foreground">{tr.week(i + 1)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{tr.grewMost}</h2>
        <ul className={cn(cardStyles, "divide-y divide-border")}>
          {monthly.map((trend) => (
            <li key={trend.keyword} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center sm:gap-6">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground">{trend.keyword}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {t.word.categories[trend.category] ?? trend.category}
                  <span className="font-medium text-success">+{trend.change.toLocaleString("en-US")}%</span>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[trend.status])}>{tr.status[trend.status]}</span>
                  <span>{tr.peakedAgo(trend.peakDaysAgo)}</span>
                </p>
              </div>
              <Line data={trend.trend} className="h-10 w-full" />
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/ask?${new URLSearchParams({ q: trend.keyword }).toString()}`} className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover">
                  {t.word.askAi}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/monitors/new?${new URLSearchParams({ kind: "keyword", name: trend.keyword }).toString()}`}
                  className="inline-flex items-center gap-1 font-medium text-body hover:text-foreground"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t.word.buildIt}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
