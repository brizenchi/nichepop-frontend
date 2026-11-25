"use client"

import { useCallback, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Check, Circle, Hash, Hourglass, Loader2, Map, Package, Pause, Pencil, Play, Trash2, XCircle } from "lucide-react"
import { AccountGate, ApiErrorNotice } from "@/components/account/ui"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { PricingModal } from "@/components/pricing-modal"
import { ActionList } from "@/components/radar/action-list"
import { INTENT_STYLES, MentionCard, isHighIntent } from "@/components/radar/mention-card"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { MiniTrend } from "@/components/radar/word-row"
import { ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useAccount } from "@/hooks/use-account"
import { useMonitor, useMonitorFeed, usePolling } from "@/hooks/use-monitors"
import { useNow } from "@/hooks/use-now"
import { deleteMonitor, pauseMonitor, resumeMonitor } from "@/lib/api/monitors"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/lib/utils/relative-time"
import type { MentionIntent, Monitor, MonitorFeed } from "@/lib/types"
import { MonitorSaveError } from "./monitor-errors"
import { MonitorMoves } from "./monitor-moves"
import { usePlan } from "./use-plan"

type Tab = "mentions" | "competitors" | "rankings" | "trends" | "suggestions"
const INTENTS: MentionIntent[] = ["alternatives", "recommendation", "pain", "advice", "money", "launch"]
/** While a new monitor waits for its first check, the page asks again this often. */
const FIRST_CHECK_POLL_MS = 20_000

function Empty({ children }: { children: ReactNode }) {
  return <p className={cn(cardStyles, "px-5 py-8 text-center text-sm text-muted-foreground")}>{children}</p>
}

function MentionsTab({ feed }: { feed: MonitorFeed }) {
  const t = useT()
  const [intent, setIntent] = useState<MentionIntent | "all">("all")
  if (feed.mentions.length === 0) return <Empty>{t.monitorManage.noMentions}</Empty>
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

function CompetitorsTab({ feed, monitor }: { feed: MonitorFeed; monitor: Monitor }) {
  const t = useT().monitorManage
  return (
    <div className="space-y-4">
      <MonitorMoves moves={feed.competitorMoves} />
      {monitor.competitors.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">{t.watching}</span>
          {monitor.competitors.map((domain) => (
            <span key={domain} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-body">
              {domain}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t.noCompetitors}</p>
      )}
    </div>
  )
}

function RankingsTab({ feed, monitor }: { feed: MonitorFeed; monitor: Monitor }) {
  const dict = useT()
  const t = dict.monitors
  const tm = dict.monitorManage
  if (feed.rankings.length === 0) return <Empty>{tm.noRankKeywords}</Empty>
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
                <td className="px-2 py-3 tabular-nums text-foreground">
                  {row.position ? (
                    `#${row.position}`
                  ) : (
                    // The API says how deep it looked: depth 0 means no measurement yet.
                    <span className="text-muted-foreground">{row.depth === undefined ? t.notRanking : row.depth > 0 ? tm.notInTop(row.depth) : tm.notChecked}</span>
                  )}
                </td>
                <td className="px-2 py-3 tabular-nums">
                  {row.change !== 0 && (
                    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", row.change > 0 ? "text-success" : "text-warning")}>
                      {row.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(row.change)}
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 tabular-nums text-muted-foreground">{row.volume ? row.volume.toLocaleString("en-US") : "–"}</td>
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
  const dict = useT()
  const t = dict.monitors
  if (feed.trends.length === 0) return <Empty>{dict.monitorManage.trendsSoon}</Empty>
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

/** Before the first results: what has happened so far, and what the first check said if it failed. */
function FirstCheck({ monitor }: { monitor: Monitor }) {
  const t = useT().monitorManage
  const locale = useLocale()
  const now = useNow()
  const failed = monitor.lastCheck && !monitor.lastCheck.ok
  const next = monitor.nextCheckAt && now > 0 ? relativeTime(monitor.nextCheckAt, now, locale) : null
  const steps: { state: "done" | "now" | "failed" | "later"; text: ReactNode }[] = [
    { state: "done", text: t.stepSaved },
    failed
      ? { state: "failed", text: <>{t.firstCheckFailed} {monitor.lastCheck?.error && <span className="text-muted-foreground">{monitor.lastCheck.error}</span>}</> }
      : { state: "now", text: next && (monitor.nextCheckAt ?? 0) > now ? t.stepCheck(next) : t.stepCheckSoon },
    { state: "later", text: t.stepResults },
  ]
  const icons = { done: Check, now: Loader2, failed: XCircle, later: Circle }
  return (
    <div className={cn(cardStyles, "p-6")}>
      <p className="text-base font-semibold text-foreground">{t.firstCheckTitle}</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const Icon = icons[step.state]
          return (
            <li key={index} className="flex items-start gap-2.5 text-sm">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  step.state === "done" && "text-success",
                  step.state === "now" && "animate-spin text-primary",
                  step.state === "failed" && "text-destructive",
                  step.state === "later" && "text-faint",
                )}
              />
              <span className={step.state === "later" ? "text-muted-foreground" : "text-body"}>{step.text}</span>
            </li>
          )
        })}
      </ol>
      {failed && next && <p className="mt-3 text-xs text-muted-foreground">{t.nextCheck(next)}</p>}
      <p className="mt-4 text-xs text-muted-foreground">{t.autoRefresh}</p>
    </div>
  )
}

/** When it was checked, when it is checked next, and anything that went wrong. */
function CheckStatus({ monitor, feed }: { monitor: Monitor; feed: MonitorFeed | null }) {
  const dict = useT()
  const t = dict.monitorManage
  const locale = useLocale()
  const now = useNow()
  const { limits } = usePlan()
  const hourly = monitor.checkEverySeconds ? monitor.checkEverySeconds <= 3600 : limits.checkEvery === "hour"
  // Demo feeds only know how many minutes ago they were checked.
  const checkedAt = monitor.lastCheckedAt ?? (feed && now > 0 ? now - feed.lastCheckedMinutes * 60_000 : undefined)
  const paused = monitor.status === "paused"
  return (
    <div className="text-xs text-muted-foreground lg:text-right">
      <p>{checkedAt && now > 0 ? t.checkedAt(relativeTime(checkedAt, now, locale), hourly) : dict.monitors.pending}</p>
      {!paused && monitor.nextCheckAt && now > 0 && <p className="mt-0.5">{t.nextCheck(relativeTime(Math.max(monitor.nextCheckAt, now), now, locale))}</p>}
      {feed && <p className="mt-0.5">{dict.monitors.postsToday(feed.postsToday)}</p>}
    </div>
  )
}

function Warnings({ monitor }: { monitor: Monitor }) {
  const t = useT().monitorManage
  const check = monitor.lastCheck
  // `detail` is the backend's own words (e.g. which data source failed): kept, in small print.
  const items: { text: string; detail?: string }[] = []
  if (check && !check.ok) items.push({ text: `${t.checkFailed(check.failures)} ${t.retryNext}`, detail: check.error })
  if (check?.ok && check.failedFetches > 0) items.push({ text: t.partial(check.failedFetches) })
  for (const notice of check?.notices ?? []) {
    if (notice === "x_quota_exhausted") items.push({ text: t.xQuotaUsed })
    else if (notice.startsWith("daily_limit:")) items.push({ text: t.dailyLimit(notice.slice("daily_limit:".length)) })
  }
  if (monitor.pushFailures) items.push({ text: t.pushFailed(monitor.pushFailures), detail: monitor.lastPushError })
  if (items.length === 0) return null
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item.text} role="status" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-body">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span className="min-w-0">
            {item.text}
            {item.detail && <span className="mt-0.5 block break-words font-mono text-xs text-muted-foreground">{item.detail}</span>}
          </span>
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
  const dict = useT()
  const t = dict.monitors
  const tm = dict.monitorManage
  const { refresh: refreshUsage } = useAccount()
  const { data: monitor, loading, error, reload } = useMonitor(id)
  const { data: feed, loading: feedLoading, error: feedError, reload: reloadFeed } = useMonitorFeed(monitor ? id : null)
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "mentions")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<unknown>(null)
  const [deleteError, setDeleteError] = useState<unknown>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPricing, setShowPricing] = useState(false)

  // A saved monitor that has not finished a check yet has no results (the feed is null). Its
  // first check runs within minutes: keep asking until it is done.
  const neverChecked = !DEMO_MODE && !!monitor && !monitor.demo && monitor.lastCheckedAt === undefined
  const waiting = neverChecked && monitor?.status === "active"
  const poll = useCallback(() => {
    void reload()
    void reloadFeed()
  }, [reload, reloadFeed])
  usePolling(waiting, poll, FIRST_CHECK_POLL_MS)

  if (error || !monitor) {
    return (
      <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
        <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          {error ? (
            <ErrorState error={error} onRetry={() => void reload()} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t.notFound}</p>
              <Link href="/monitors" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            </>
          )}
        </main>
      </div>
    )
  }

  const paused = monitor.status === "paused"
  const run = async (action: () => Promise<unknown>, setError: (error: unknown) => void) => {
    setBusy(true)
    setActionError(null)
    setDeleteError(null)
    try {
      await action()
      void refreshUsage()
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }
  // Resuming is refused with PLAN_LIMIT_REACHED when the plan has no monitor left.
  const togglePause = () =>
    run(async () => {
      await (paused ? resumeMonitor(id) : pauseMonitor(id))
      await Promise.all([reload(), reloadFeed()])
    }, setActionError)
  const remove = () =>
    run(async () => {
      await deleteMonitor(id)
      router.push("/monitors")
    }, setDeleteError)

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
              {paused && <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">{dict.states.paused}</span>}
            </div>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-foreground">{monitor.name}</h1>
            {monitor.description && <p className="mt-1 text-sm text-muted-foreground">{monitor.description}</p>}
          </div>
          <CheckStatus monitor={monitor} feed={feed} />
        </header>

        {!monitor.demo && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/monitors/${monitor.id}/edit`} className={cn(buttonStyles.secondary, "h-9")}>
              <Pencil className="h-4 w-4" />
              {tm.edit}
            </Link>
            <button type="button" onClick={() => void togglePause()} disabled={busy} className={cn(buttonStyles.secondary, "h-9")}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {paused ? tm.resume : tm.pause}
            </button>
            {!DEMO_MODE && (
              <Link href="/monitors#notifications" className="inline-flex h-9 items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
                <Bell className="h-3.5 w-3.5" />
                {monitor.delivery === "realtime" ? tm.deliveryRealtime : tm.deliveryDigest}
              </Link>
            )}
          </div>
        )}
        {paused && <p className="mt-3 text-sm text-body">{tm.paused}</p>}
        <div className="mt-3 empty:hidden">
          <MonitorSaveError error={actionError} onUpgrade={() => setShowPricing(true)} />
        </div>
        <Warnings monitor={monitor} />

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
          ) : !feed ? (
            neverChecked ? (
              paused ? <Empty>{tm.pausedNoResults}</Empty> : <FirstCheck monitor={monitor} />
            ) : feedLoading ? (
              <LoadingState />
            ) : (
              <div className={cn(cardStyles, "flex flex-col items-start gap-3 p-6")}>
                <Hourglass className="h-5 w-5 text-primary" />
                <p className="text-base font-semibold text-foreground">{t.pending}</p>
                <p className="max-w-xl text-sm text-body">{t.pendingText}</p>
                <Link href={`/monitors/${exampleId}`} className={cn(buttonStyles.secondary, "h-9")}>
                  {t.seeExample}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )
          ) : (
            <>
              {activeTab === "mentions" && <MentionsTab feed={feed} />}
              {activeTab === "competitors" && <CompetitorsTab feed={feed} monitor={monitor} />}
              {activeTab === "rankings" && <RankingsTab feed={feed} monitor={monitor} />}
              {activeTab === "trends" && <TrendsTab feed={feed} />}
              {activeTab === "suggestions" &&
                (feed.suggestions.length === 0 ? (
                  <Empty>{tm.noSuggestions}</Empty>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t.suggestionsNote}</p>
                    <ActionList actions={feed.suggestions} locked={false} onUpgrade={() => undefined} />
                  </div>
                ))}
            </>
          )}
        </div>

        {!monitor.demo && (
          <div className="mt-10 border-t border-border pt-6">
            {confirmDelete ? (
              <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-body">{tm.deleteConfirm}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)} className={cn(buttonStyles.ghost, "h-9")}>
                    {tm.cancel}
                  </button>
                  <button type="button" onClick={() => void remove()} disabled={busy} className={cn(buttonStyles.secondary, "h-9 text-destructive hover:text-destructive")}>
                    <Trash2 className="h-4 w-4" />
                    {tm.deleteYes}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className={cn(buttonStyles.ghost, "h-9 text-destructive hover:text-destructive")}>
                <Trash2 className="h-4 w-4" />
                {t.delete}
              </button>
            )}
            <div className="mt-3 empty:hidden">
              <ApiErrorNotice error={deleteError} />
            </div>
          </div>
        )}
      </main>
      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.title} />
    </div>
  )
}
