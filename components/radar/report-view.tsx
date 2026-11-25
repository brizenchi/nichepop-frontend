"use client"

import { useState, type ReactNode } from "react"
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown, CheckCircle2, Database, Lightbulb, Lock, Map, Package, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AskTool, CompetitorRow, IdeaReport, KeywordReport, MarketReport, ProductReport, RadarReport, ReportScore, ReportSource } from "@/lib/types"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { localizedHref } from "@/lib/i18n"
import { ActionList } from "./action-list"
import { MentionCard } from "./mention-card"
import { VerdictBadge } from "./word-row"

const TONE: Record<ReportScore["tone"], string> = {
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
}

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight }
const TREND_TONE = { up: "text-warning", down: "text-success", flat: "text-muted-foreground" }
const KIND_ICON = { keyword: Search, idea: Lightbulb, product: Package, market: Map }
const IDEA_VERDICT = { go: "bg-success-soft text-success", pivot: "bg-warning-soft text-warning", no: "bg-muted text-muted-foreground" }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function LockedNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-subtle px-4 py-3 text-sm text-muted-foreground">
      <Lock className="h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

function ScoreGrid({ scores, sources }: { scores: ReportScore[]; sources?: AskTool[] }) {
  const t = useT()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {scores.map((score, index) => (
        <div key={score.label} className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", TONE[score.tone])} />
            {score.label}
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">{score.value}</p>
          <p className="mt-1 text-xs leading-relaxed text-body">{score.note}</p>
          {sources?.[index] && (
            <p className="mt-2 text-[11px] text-faint">
              {t.report.source}: {t.tools[sources[index]]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function CompetitorList({ rows }: { rows: CompetitorRow[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {rows.map((row) => {
        const Trend = TREND_ICON[row.trend]
        return (
          <li key={row.domain} className="px-4 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-foreground">{row.domain}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Trend className={cn("h-3.5 w-3.5", TREND_TONE[row.trend])} />
                  {row.traffic}
                </span>
                <span>{row.pricing}</span>
                <span>{row.overlap}</span>
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-body">{row.note}</p>
          </li>
        )
      })}
    </ul>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 text-sm text-body">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
            {index + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  )
}

function MetricGrid({ metrics }: { metrics: { label: string; value: string; note?: string; delta?: string }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {metric.value}
            {metric.delta && <span className="ml-1.5 text-xs font-medium text-success">{metric.delta}</span>}
          </dd>
          {metric.note && <p className="mt-1 text-xs leading-relaxed text-body">{metric.note}</p>}
        </div>
      ))}
    </dl>
  )
}

/** Missing points (null) are skipped; the line joins the ones around them. */
function Sparkline({ data }: { data: (number | null)[] }) {
  const known = data.filter((v): v is number => v !== null)
  if (known.length < 2) return null
  const max = Math.max(...known)
  const min = Math.min(...known)
  const points = data
    .map((v, i) => (v === null ? null : `${(i / (data.length - 1)) * 100},${38 - ((v - min) / Math.max(1, max - min)) * 34}`))
    .filter((point) => point !== null)
    .join(" ")
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-20 w-full" aria-hidden>
      <polygon points={`0,40 ${points} 100,40`} className="fill-primary/10" />
      <polyline points={points} fill="none" strokeWidth="2" className="stroke-primary" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Monthly searches and difficulty; a figure the data did not have reads as unknown. */
function VolumeKd({ volume, kd }: { volume: number | null; kd: number | null }) {
  const t = useT().report
  return (
    <>
      {volume === null ? t.unknown : `${volume.toLocaleString("en-US")}/mo`} · KD {kd ?? t.unknown}
    </>
  )
}

/** Reports from the API carry an RFC 3339 time; demo reports a display date. */
function reportDate(createdAt: string, locale: string) {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(createdAt)) return createdAt
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
}

function KeywordReportBody({ report, shared }: { report: KeywordReport; shared: boolean }) {
  const t = useT().report
  const serpRows = shared ? report.serp.slice(0, 3) : report.serp
  return (
    <div className="space-y-8">
      <ScoreGrid scores={report.scores} sources={report.scoreSources} />

      <Section title={t.returnOnEffort}>
        <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm leading-relaxed text-foreground">{report.roi}</p>
      </Section>

      {report.traps.length > 0 && (
        <Section title={t.traps}>
          <ul className="space-y-2">
            {report.traps.map((trap) => (
              <li key={trap} className="flex gap-2 text-sm text-body">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                {trap}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t.topTen}>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <tbody className="divide-y divide-border">
              {serpRows.map((row) => (
                <tr key={row.rank}>
                  <td className="w-10 px-4 py-2.5 tabular-nums text-muted-foreground">{row.rank}</td>
                  <td className="px-2 py-2.5 font-medium text-foreground">{row.domain}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{row.pageType}</td>
                  <td className="px-4 py-2.5 text-body">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shared && report.serp.length > serpRows.length && (
          <div className="mt-2">
            <LockedNote>{t.moreResults(report.serp.length - serpRows.length)}</LockedNote>
          </div>
        )}
      </Section>

      <Section title={t.nextSteps}>
        {shared ? (
          <LockedNote>{t.planLocked}</LockedNote>
        ) : (
          <ol className="space-y-2">
            {report.nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-body">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  )
}

function IdeaReportBody({ report, shared }: { report: IdeaReport; shared: boolean }) {
  const t = useT().report
  return (
    <div className="space-y-8">
      <Section title={t.demand}>
        <ScoreGrid scores={report.demand} />
      </Section>
      <Section title={t.alternatives}>
        <CompetitorList rows={shared ? report.alternatives.slice(0, 2) : report.alternatives} />
      </Section>
      {shared ? (
        <LockedNote>{t.moreLocked}</LockedNote>
      ) : (
        <>
          <Section title={t.complaints}>
            <ul className="space-y-2">
              {report.complaints.map((complaint) => (
                <li key={complaint.text} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-lg bg-subtle px-3 py-2.5 text-sm">
                  <span className="text-foreground">“{complaint.text}”</span>
                  <span className="text-xs text-muted-foreground">
                    {complaint.source} · {complaint.count}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={t.monetization}>
            <NumberedList items={report.monetization} />
          </Section>
          <Section title={t.angle}>
            <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm leading-relaxed text-foreground">{report.angle}</p>
          </Section>
        </>
      )}
    </div>
  )
}

function ProductReportBody({ report, shared }: { report: ProductReport; shared: boolean }) {
  const t = useT().report
  const locale = useLocale()
  return (
    <div className="space-y-8">
      <Section title={t.ownerMetrics}>
        <MetricGrid metrics={report.ownerMetrics} />
      </Section>
      <Section title={t.competitors}>
        <CompetitorList rows={shared ? report.competitors.slice(0, 2) : report.competitors} />
      </Section>
      {shared ? (
        <LockedNote>{t.moreLocked}</LockedNote>
      ) : (
        <>
          <Section title={t.gaps}>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <tbody className="divide-y divide-border">
                  {report.gaps.map((gap) => (
                    <tr key={gap.keyword}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{gap.keyword}</td>
                      <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                        <VolumeKd volume={gap.volume} kd={gap.kd} />
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">{gap.owner}</td>
                      <td className="px-4 py-2.5 text-body">{gap.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title={t.channels}>
            <div className="grid gap-3 sm:grid-cols-3">
              {report.channels.map((channel, index) => (
                <div key={`${channel.source}-${index}`} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">{channel.label}</p>
                  <p className="mt-1.5 text-base font-semibold text-foreground">{channel.volume}</p>
                  <p className="mt-1 text-xs leading-relaxed text-body">{channel.note}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title={t.mentions}>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {report.mentions.map((mention) => (
                <MentionCard key={mention.id} mention={mention} />
              ))}
            </ul>
          </Section>
          <Section title={t.moves}>
            <ActionList actions={report.actions} locked={false} onUpgrade={() => (window.location.href = localizedHref("/pricing", locale))} />
          </Section>
        </>
      )}
    </div>
  )
}

function MarketReportBody({ report, shared }: { report: MarketReport; shared: boolean }) {
  const t = useT().report
  return (
    <div className="space-y-8">
      <Section title={t.metrics}>
        <MetricGrid metrics={report.metrics} />
        <div className="mt-3 rounded-xl border border-border bg-card px-4 pb-2 pt-3">
          <p className="text-xs text-muted-foreground">{t.trend30}</p>
          <Sparkline data={report.trend} />
        </div>
      </Section>
      <Section title={t.players}>
        <CompetitorList rows={shared ? report.players.slice(0, 2) : report.players} />
      </Section>
      {shared ? (
        <LockedNote>{t.moreLocked}</LockedNote>
      ) : (
        <>
          <Section title={t.rising}>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-sm">
                <tbody className="divide-y divide-border">
                  {report.rising.map((row) => (
                    <tr key={row.keyword}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{row.keyword}</td>
                      <td className="px-2 py-2.5 font-medium text-success">{row.growth}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        <VolumeKd volume={row.volume} kd={row.kd} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title={t.openings}>
            <NumberedList items={report.openings} />
          </Section>
        </>
      )}
    </div>
  )
}

/** The data calls behind a report, so every claim can be traced to where it came from. */
function SourcesSection({ sources }: { sources: ReportSource[] }) {
  const t = useT()
  return (
    <section className="border-t border-border pt-5">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        {t.report.sources}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <span key={`${source.tool}-${index}`} className="rounded-md border border-border bg-subtle px-2 py-1 text-xs text-body">
            {t.tools[source.tool]} <span className="tabular-nums text-muted-foreground">{t.tools.calls(source.calls)}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

interface ReportViewProps {
  report: RadarReport
  /** Shared pages show a summary and lock the rest. */
  shared?: boolean
  /** In chat, older reports start collapsed to their header. */
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function ReportView({ report, shared = false, collapsible = false, defaultExpanded = true }: ReportViewProps) {
  const t = useT()
  const locale = useLocale()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const KindIcon = KIND_ICON[report.kind]
  const open = !collapsible || expanded

  return (
    <article className="radar-theme space-y-6">
      <header>
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <KindIcon className="h-3.5 w-3.5" />
          {t.reports.kinds[report.kind].title} · {reportDate(report.createdAt, locale)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{report.query}</h2>
          {report.kind === "keyword" && <VerdictBadge verdict={report.verdict} />}
          {report.kind === "idea" && (
            <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold", IDEA_VERDICT[report.verdict])}>{t.report.ideaVerdicts[report.verdict]}</span>
          )}
        </div>
        <p className="mt-2 flex items-start gap-2 text-base text-body">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
          {report.headline}
        </p>
        {collapsible && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover cursor-pointer"
          >
            {expanded ? t.ask.collapse : t.ask.expand}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </header>

      {open && (
        <>
          {report.kind === "keyword" && <KeywordReportBody report={report} shared={shared} />}
          {report.kind === "idea" && <IdeaReportBody report={report} shared={shared} />}
          {report.kind === "product" && <ProductReportBody report={report} shared={shared} />}
          {report.kind === "market" && <MarketReportBody report={report} shared={shared} />}
          {report.sources && <SourcesSection sources={report.sources} />}
        </>
      )}
    </article>
  )
}
