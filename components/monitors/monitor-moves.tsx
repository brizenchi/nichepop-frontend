"use client"

import { ArrowDownRight, ArrowUpRight, ExternalLink, FilePlus2 } from "lucide-react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { cardStyles } from "@/components/radar/ui"
import { useNow } from "@/hooks/use-now"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/lib/utils/relative-time"
import type { RadarCompetitorMove } from "@/lib/types"

const PAGES_SHOWN = 5
const SHORT_IMPACT = 24

/** "/vs/pagepulse" for a competitor's page: the domain is already in the row. */
function pagePath(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}` || "/"
  } catch {
    return url
  }
}

/**
 * A monitor's competitor moves (backend #24): new pages found in a competitor's sitemap,
 * with links to them, price page changes, and top-10 entries, newest first.
 */
export function MonitorMoves({ moves }: { moves: RadarCompetitorMove[] }) {
  const dict = useT()
  const t = dict.monitorManage
  const locale = useLocale()
  const now = useNow()
  if (moves.length === 0) return <p className={cn(cardStyles, "px-5 py-8 text-center text-sm text-muted-foreground")}>{t.noMoves}</p>
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-radar-text">{dict.report.competitorMoves}</h2>
      <ul className={cn(cardStyles, "divide-y divide-radar-border")}>
        {moves.map((move, index) => {
          const Arrow = move.direction === "up" ? ArrowUpRight : ArrowDownRight
          const pages = move.what === "pages" ? (move.urls ?? []) : []
          const at = move.at ? Date.parse(move.at) : NaN
          const impact = move.impact || ""
          const longImpact = impact.length > SHORT_IMPACT
          const tone = move.direction === "up" ? "bg-radar-warning-soft text-radar-warning" : "bg-radar-success-soft text-radar-success"
          return (
            <li key={`${move.domain}-${move.what ?? ""}-${move.at ?? index}`} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-radar-text">
                    {move.domain}
                    {now > 0 && !Number.isNaN(at) && <span className="text-xs font-normal text-muted-foreground">{relativeTime(at, now, locale)}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-radar-text-3">{move.change}</p>
                </div>
                {impact && !longImpact && (
                  <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium", tone)}>
                    <Arrow className="h-3 w-3 shrink-0" />
                    {impact}
                  </span>
                )}
              </div>
              {/* The AI writes the impact as a sentence: it goes under the change, not in a chip. */}
              {longImpact && (
                <p className={cn("mt-1.5 inline-flex items-start gap-1 rounded-md px-1.5 py-1 text-xs", tone)}>
                  <Arrow className="mt-px h-3 w-3 shrink-0" />
                  {impact}
                </p>
              )}
              {pages.length > 0 && (
                <div className="mt-2 rounded-lg border border-border bg-subtle px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-body">
                    <FilePlus2 className="h-3.5 w-3.5 text-primary" />
                    {t.pages(pages.length)}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {pages.slice(0, PAGES_SHOWN).map((url) => (
                      <li key={url} className="min-w-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-primary hover:text-primary-hover">
                          {pagePath(url)}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {pages.length > PAGES_SHOWN && <p className="mt-1 text-xs text-muted-foreground">{t.morePages(pages.length - PAGES_SHOWN)}</p>}
                </div>
              )}
              {move.what !== "pages" && move.url && (
                <a href={move.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.openPage}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
