"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Hash, Map, Package, Plus, Swords, Zap } from "lucide-react"
import { AccountGate } from "@/components/account/ui"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { NotificationSettings } from "@/components/monitors/notification-settings"
import { usePlan } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { isHighIntent } from "@/components/radar/mention-card"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useMonitorFeed, useMonitors } from "@/hooks/use-monitors"
import { useNow } from "@/hooks/use-now"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/lib/utils/relative-time"
import type { Monitor } from "@/lib/types"

function QuotaBar({ label, used, max }: { label: string; used: number; max: number }) {
  return (
    <div className={cn(cardStyles, "flex-1 px-4 py-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 h-1.5 rounded-full bg-border">
        {max > 0 && <div className={cn("h-1.5 rounded-full", used >= max ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(100, (used / max) * 100)}%` }} />}
      </div>
    </div>
  )
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const dict = useT()
  const t = dict.monitors
  const locale = useLocale()
  const now = useNow()
  const { limits } = usePlan()
  // A saved monitor that never finished a check has no feed to ask for.
  const { data: feed } = useMonitorFeed(DEMO_MODE || monitor.lastCheckedAt !== undefined ? monitor.id : null)
  const hourly = monitor.checkEverySeconds ? monitor.checkEverySeconds <= 3600 : limits.checkEvery === "hour"
  const checkedAt = monitor.lastCheckedAt ?? (feed && now > 0 ? now - feed.lastCheckedMinutes * 60_000 : undefined)
  const KindIcon = monitor.kind === "keyword" ? Hash : monitor.kind === "market" ? Map : Package
  const stats = feed
    ? [
        { icon: Zap, label: t.highIntentCount(feed.mentions.filter(isHighIntent).length), tone: "text-primary" },
        { icon: ArrowUpRight, label: t.rankingsUp(feed.rankings.filter((r) => r.change > 0).length), tone: "text-success" },
        { icon: Swords, label: t.movesCount(feed.competitorMoves.length), tone: "text-warning" },
      ]
    : []

  return (
    <Link href={`/monitors/${monitor.id}`} className={cn(cardStyles, "group flex min-w-0 flex-col p-5 transition-colors hover:border-primary/40")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 font-medium text-body ring-1 ring-border">
          <KindIcon className="h-3 w-3" />
          {t.kinds[monitor.kind]}
        </span>
        {monitor.demo && <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary">{t.example}</span>}
        {monitor.status === "paused" && <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">{dict.states.paused}</span>}
        {monitor.lastCheck && !monitor.lastCheck.ok && (
          <span className="rounded-md bg-danger-soft px-1.5 py-0.5 font-medium text-destructive">{dict.monitorManage.checkFailedBadge}</span>
        )}
        <span className="ml-auto">{checkedAt && now > 0 ? dict.monitorManage.checkedAt(relativeTime(checkedAt, now, locale), hourly) : t.pending}</span>
      </div>
      <p className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">{monitor.name}</p>
      {monitor.description && <p className="mt-0.5 text-sm text-muted-foreground">{monitor.description}</p>}
      {monitor.tracks.includes("mentions") && <p className="mt-2 truncate font-mono text-xs text-faint">{monitor.xQuery}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {monitor.tracks.map((track) => (
          <span key={track} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-body">
            {t.tracks[track]}
          </span>
        ))}
      </div>
      {stats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
          {stats.map((stat) => (
            <span key={stat.label} className="inline-flex items-center gap-1 text-body">
              <stat.icon className={cn("h-3.5 w-3.5", stat.tone)} />
              {stat.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function MonitorsPage() {
  const t = useT()
  const tm = t.monitors

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{tm.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tm.intro}</p>
          </div>
          <Link href="/monitors/new" className={cn(buttonStyles.primary, "h-10 shrink-0")}>
            <Plus className="h-4 w-4" />
            {tm.new}
          </Link>
        </header>

        {/* Real builds keep monitors on the account; demo builds show the examples to anyone. */}
        {DEMO_MODE ? (
          <MonitorList />
        ) : (
          <div className="mt-6">
            <AccountGate>
              <MonitorList />
            </AccountGate>
          </div>
        )}

        {DEMO_MODE && <p className="mt-6 text-xs text-muted-foreground">{t.common.demoNote}</p>}
      </main>
    </div>
  )
}

function MonitorList() {
  const t = useT()
  const tm = t.monitors
  const { monitors, custom, loaded, error, reload, limits: listLimits } = useMonitors()
  const plan = usePlan()
  const [showPricing, setShowPricing] = useState(false)
  // The list's own limits (GET /monitors) are the freshest; demo builds use the plan's.
  const maxMonitors = listLimits?.monitors ?? plan.limits.monitors
  const xPosts = listLimits?.x_posts ?? plan.limits.xPosts
  const xPostsUsed = listLimits?.x_posts_used ?? plan.xPostsUsed
  // Paused monitors do not count towards the plan.
  const active = custom.filter((monitor) => monitor.status !== "paused").length

  if (error) return <ErrorState error={error} onRetry={() => void reload()} className="mt-6" />
  if (!loaded) return <LoadingState className="mt-6" />

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <QuotaBar label={tm.quotaMonitors(active, maxMonitors)} used={active} max={maxMonitors} />
        <QuotaBar label={xPosts > 0 ? tm.quotaPosts(xPostsUsed, xPosts) : tm.xQuotaLocked} used={xPostsUsed} max={xPosts} />
      </div>
      {active >= maxMonitors && (
        <div className={cn(cardStyles, "mt-3 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between")}>
          <p className="text-sm text-body">{tm.limitReached(maxMonitors)}</p>
          <button type="button" onClick={() => setShowPricing(true)} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
            {t.common.upgrade}
          </button>
        </div>
      )}

      {monitors.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={t.states.noMonitors}
          text={t.states.noMonitorsText}
          action={
            <Link href="/monitors/new" className={cn(buttonStyles.primary, "h-9")}>
              <Plus className="h-4 w-4" />
              {t.states.createMonitor}
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}

      {/* Push settings live on the account; demo builds have no account to keep them on. */}
      {!DEMO_MODE && <NotificationSettings className="mt-8" />}
      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={tm.title} />
    </>
  )
}
