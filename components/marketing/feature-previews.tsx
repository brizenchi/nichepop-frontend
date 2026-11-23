"use client"

import { Bot, Sparkles, Swords } from "lucide-react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { MentionCard } from "@/components/radar/mention-card"
import { MiniTrend, ScoreBadge, VerdictBadge } from "@/components/radar/word-row"
import { getDemoMentions } from "@/lib/data/mentions"
import { getMonitorFeed } from "@/lib/data/monitors"
import { getDemoWords } from "@/lib/data/radar"
import { REPORT_PLANS, reportFor } from "@/lib/data/reports"
import { cn } from "@/lib/utils"

const frame = "overflow-hidden rounded-2xl bg-raised shadow-lift ring-1 ring-rule"

/** The previews show demo data, so they say so (frontend#7). */
function ExampleTag() {
  const t = useT()
  return <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">{t.monitors.example}</span>
}

/** Static previews of the three workspace places, built from the real components and demo data. */
export function TrendPreview() {
  const locale = useLocale()
  const t = useT()
  const words = getDemoWords(locale)
    .filter((w) => w.verdict !== "skip")
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  return (
    <div className={frame}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-subtle px-4 py-3 text-xs">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          {t.radar.title}
          <ExampleTag />
        </span>
        <span className="flex items-center gap-1.5 font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t.radar.newThisHour(2)}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {words.map((word) => (
          <li key={word.id} className="flex items-center gap-3 px-4 py-3">
            <ScoreBadge word={word} showDelta={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{word.keyword}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {t.word.categories[word.category] ?? word.category} · <span className="font-medium text-success">{t.word.growth(word.growthPct, word.growthWindow)}</span>
              </p>
            </div>
            <MiniTrend data={word.trend} verdict={word.verdict} className="hidden h-7 w-20 sm:block" />
            <VerdictBadge verdict={word.verdict} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChatPreview() {
  const locale = useLocale()
  const t = useT()
  const report = reportFor("", "idea", locale)
  const plan = REPORT_PLANS.idea
  return (
    <div className={cn(frame, "space-y-4 p-5")}>
      <ExampleTag />
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{t.ask.starters.idea}</p>
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-soft text-sky-ink">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm leading-relaxed text-foreground">{t.ask.intro.idea(report.query)}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper p-3.5 ring-1 ring-rule">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.reports.kinds.idea.title}</p>
              <p className="text-xs text-muted-foreground">{t.ask.estimate(plan.estimate[0], plan.estimate[1])}</p>
            </div>
            <span className="btn btn--sm pointer-events-none" aria-hidden>
              <Sparkles className="h-3.5 w-3.5" />
              {t.ask.generate(t.reports.kinds.idea.label)}
            </span>
          </div>
          {report.kind === "idea" && (
            <div className="rounded-xl bg-paper p-3.5 ring-1 ring-rule">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                {report.query}
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">{t.report.ideaVerdicts[report.verdict]}</span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-body">{report.headline}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MonitorPreview() {
  const locale = useLocale()
  const t = useT()
  const mentions = getDemoMentions(locale).slice(0, 2)
  const move = getMonitorFeed("mon-pagepulse", locale)?.competitorMoves.find((m) => m.domain === "pingward.com")
  return (
    <div className={frame}>
      <div className="border-b border-border bg-subtle px-4 pt-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          {t.home.previewMonitor}
          <ExampleTag />
        </p>
        <div className="mt-2 flex gap-4 text-xs">
          {(["mentions", "competitors", "rankings"] as const).map((tab, i) => (
            <span key={tab} className={cn("pb-2", i === 0 ? "border-b-2 border-sky font-semibold text-foreground" : "text-muted-foreground")}>
              {t.monitors.tabs[tab]}
            </span>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {mentions.map((mention) => (
          <MentionCard key={mention.id} mention={mention} showDraft={false} />
        ))}
        {move && (
          <li className="flex items-start gap-2 px-5 py-3 text-sm">
            <Swords className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span className="text-body">
              <span className="font-medium text-foreground">{move.domain}</span> · {move.change}
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}
