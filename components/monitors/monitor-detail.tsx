"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Hash, Hourglass, Map, Package, Trash2 } from "lucide-react"
import { AccountGate, ApiErrorNotice } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { ActionList } from "@/components/radar/action-list"
import { CompetitorMovesList } from "@/components/radar/brief-lists"
import { INTENT_STYLES, MentionCard, isHighIntent } from "@/components/radar/mention-card"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { MiniTrend } from "@/components/radar/word-row"
import { ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useAccount } from "@/hooks/use-account"
import { useMonitorFeed, useMonitors } from "@/hooks/use-monitors"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import type { MentionIntent, Monitor, MonitorFeed } from "@/lib/types"
import { usePlan } from "./use-plan"

type Tab = "mentions" | "competitors" | "rankings" | "trends" | "suggestions"
const INTENTS: MentionIntent[] = ["alternatives", "recommendation", "pain", "advice", "money", "launch"]

function MentionsTab({ feed }: { feed: MonitorFeed }) {
  const t = useT()
  const [intent, setIntent] = useState<MentionIntent | "all">("all")
  const themes = INTENTS.filter((value) => feed.themes?.[value] || feed.mentions.some((m) => m.intent === value))
  const mentions = intent === "all" ? feed.mentions : feed.mentions.filter((m) => m.intent === intent)
  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.mentions.themesTitle}</h3>
          {intent !== "all" && (
            <button onClick={() => setIntent("all")} className="text-xs font-medium text-primary hover:text-primary-hover cursor-pointer">
              {t.mentions.all} · {feed.mentions.length}
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((value) => {
            const count = feed.mentions.filter((m) => m.intent === value).length
            const active = intent === value
            return (
              <button
                key={value}
                onClick={() => setIntent(active ? "all" : value)}
                aria-pressed={active}
                className={cn(cardStyles, "p-3.5 text-left transition-colors cursor-pointer", active ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", INTENT_STYLES[value])}>{t.mentions.intents[value]}</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{count}</span>
                </span>
                {feed.themes?.[value] && <span className="mt-2 block text-xs leading-relaxed text-body">{feed.themes[value]}</span>}
              </button>
            )
          })}
        </div>
      </section>
      <p className="text-xs text-muted-foreground">{t.monitors.intentNote}</p>
      <ul className={cn(cardStyles, "divide-y divide-border")}>
        {mentions.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">{t.monitors.noPosts}</li>}
        {mentions.map((mention) => (
          <MentionCard key={mention.id} mention={mention} />
        ))}
      </ul>
    </div>
  )
}

function RankingsTab({ feed, monitor }: { feed: MonitorFeed; monitor: Monitor }) {
  const t = useT().monitors
  return (
    <div className="space-y-3">
      {monitor.site && <p className="text-xs text-muted-foreground">{t.rankingsFor(monitor.site)}</p>}
      <div className={cn(cardStyles, "overflow-x-auto")}>
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">{t.keyword}</th>
              <th className="px-2 py-2.5 font-medium">{t.position}</th>
              <th className="px-2 py-2.5 font-medium">{t.change}</th>
              <th className="px-2 py-2.5 font-medium">{t.volume}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {feed.rankings.map((row) => (
              <tr key={row.keyword}>
                <td className="px-4 py-3 font-medium text-foreground">{row.keyword}</td>
                <td className="px-2 py-3 tabular-nums text-foreground">{row.position ? `#${row.position}` : <span className="text-muted-foreground">{t.notRanking}</span>}</td>
                <td className="px-2 py-3 tabular-nums">
                  {row.change !== 0 && (
                    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", row.change > 0 ? "text-success" : "text-warning")}>
                      {row.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(row.change)}
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 tabular-nums text-muted-foreground">{row.volume.toLocaleString("en-US")}</td>
                <td className="px-4 py-3">
                  {row.trend.length > 1 && <MiniTrend data={row.trend.map((position) => 100 - position)} verdict="build" className="h-6 w-20" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrendsTab({ feed }: { feed: MonitorFeed }) {
  const t = useT().monitors
  return (
    <ul className={cn(cardStyles, "divide-y divide-border")}>
      {feed.trends.map((trend) => (
        <li key={trend.topic} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              {trend.topic}
              <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-medium text-success">{trend.growth}</span>
            </p>
            <p className="mt-1 text-sm text-body">{trend.note}</p>
          </div>
          <Link
            href={`/ask?${new URLSearchParams({ q: trend.topic }).toString()}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            {t.askAbout}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

const TABS: Tab[] = ["mentions", "competitors", "rankings", "trends", "suggestions"]

export function MonitorDetail({ id, initialTab }: { id: string; initialTab?: string }) {
  const { ready, isAuthenticated } = useAccount()
  // Real builds keep monitors on the account: signed-out readers are asked to sign in.
  if (!DEMO_MODE && !(ready && isAuthenticated)) {
    return (
      <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
        <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <AccountGate>{null}</AccountGate>
        </main>
      </div>
    )
  }
  return <MonitorView id={id} initialTab={initialTab} />
}

function MonitorView({ id, initialTab }: { id: string; initialTab?: string }) {
  const router = useRouter()
  const t = useT().monitors
  const { monitors, loaded, error, reload, remove } = useMonitors()
  const { limits } = usePlan()
  const monitor = monitors.find((m) => m.id === id)
  const { data: feed, loading: feedLoading, error: feedError, reload: reloadFeed } = useMonitorFeed(monitor ? id : null)
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "mentions")
  const [deleteError, setDeleteError] = useState<unknown>(null)

  if (error || !loaded) {
    return (
      <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
        <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          {error ? <ErrorState error={error} onRetry={() => void reload()} /> : <LoadingState />}
        </main>
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
        {loaded && (
          <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
            <p className="text-sm text-muted-foreground">{t.notFound}</p>
            <Link href="/monitors" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>
          </main>
        )}
      </div>
    )
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    ...(monitor.tracks.includes("mentions") ? [{ id: "mentions" as const, label: t.tabs.mentions, count: feed?.mentions.filter(isHighIntent).length }] : []),
    ...(monitor.tracks.includes("competitors") ? [{ id: "competitors" as const, label: t.tabs.competitors, count: feed?.competitorMoves.length }] : []),
    ...(monitor.tracks.includes("rankings") ? [{ id: "rankings" as const, label: t.tabs.rankings }] : []),
    ...(monitor.tracks.includes("trends") ? [{ id: "trends" as const, label: t.tabs.trends }] : []),
    { id: "suggestions" as const, label: t.tabs.suggestions, count: feed?.suggestions.length },
  ]
  const activeTab = tabs.some((x) => x.id === tab) ? tab : tabs[0].id
  const KindIcon = monitor.kind === "keyword" ? Hash : monitor.kind === "market" ? Map : Package
  const exampleId = { keyword: "mon-driftbound", product: "mon-pagepulse", market: "mon-ai-video" }[monitor.kind]

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Link href="/monitors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <header className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-card px-1.5 py-0.5 font-medium text-body ring-1 ring-border">
                <KindIcon className="h-3 w-3" />
                {t.kinds[monitor.kind]}
              </span>
              {monitor.demo && <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary">{t.example}</span>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{monitor.name}</h1>
            {monitor.description && <p className="mt-1 text-sm text-muted-foreground">{monitor.description}</p>}
          </div>
          <div className="text-xs text-muted-foreground lg:text-right">
            <p>{feed ? t.checked(feed.lastCheckedMinutes, limits.checkEvery === "hour") : t.firstCheck}</p>
            {feed && <p className="mt-0.5">{t.postsToday(feed.postsToday)}</p>}
          </div>
        </header>

        {monitor.tracks.includes("mentions") && (
          <p className="mt-4 truncate rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-body">
            <span className="mr-2 font-sans font-medium text-muted-foreground">{t.query}</span>
            {monitor.xQuery}
          </p>
        )}

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border" aria-label={monitor.name}>
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={activeTab === item.id ? "page" : undefined}
              className={cn(
                "relative shrink-0 px-3 pb-2.5 pt-1 text-sm transition-colors cursor-pointer",
                activeTab === item.id ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.count ? <span className="ml-1.5 rounded-full bg-primary-soft px-1.5 text-[11px] font-semibold text-primary">{item.count}</span> : null}
              {activeTab === item.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="mt-5">
          {feedError ? (
            <ErrorState error={feedError} onRetry={() => void reloadFeed()} />
          ) : feedLoading ? (
            <LoadingState />
          ) : !feed ? (
            <div className={cn(cardStyles, "flex flex-col items-start gap-3 p-6")}>
              <Hourglass className="h-5 w-5 text-primary" />
              <p className="text-base font-semibold text-foreground">{t.pending}</p>
              <p className="max-w-xl text-sm text-body">{t.pendingText}</p>
              {DEMO_MODE && (
                <Link href={`/monitors/${exampleId}`} className={cn(buttonStyles.secondary, "h-9")}>
                  {t.seeExample}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <>
              {activeTab === "mentions" && <MentionsTab feed={feed} />}
              {activeTab === "competitors" && (
                <div className="space-y-4">
                  <CompetitorMovesList moves={feed.competitorMoves} />
                  <div className="flex flex-wrap gap-1.5">
                    {monitor.competitors.map((domain) => (
                      <span key={domain} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-body">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "rankings" && <RankingsTab feed={feed} monitor={monitor} />}
              {activeTab === "trends" && <TrendsTab feed={feed} />}
              {activeTab === "suggestions" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t.suggestionsNote}</p>
                  <ActionList actions={feed.suggestions} locked={false} onUpgrade={() => undefined} />
                </div>
              )}
            </>
          )}
        </div>

        {!monitor.demo && (
          <div className="mt-10 border-t border-border pt-6">
            <button
              onClick={async () => {
                setDeleteError(null)
                try {
                  await remove(monitor.id)
                  router.push("/monitors")
                } catch (failure) {
                  setDeleteError(failure)
                }
              }}
              className={cn(buttonStyles.ghost, "h-9 text-destructive hover:text-destructive")}
            >
              <Trash2 className="h-4 w-4" />
              {t.delete}
            </button>
            <ApiErrorNotice error={deleteError} />
          </div>
        )}
      </main>
    </div>
  )
}
