"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { AccountGate, ApiErrorNotice, useAccountDate } from "@/components/account/ui"
import { useLocale, usePick, useT } from "@/components/i18n/locale-provider"
import { usePlan } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { usePageReturn } from "@/components/use-page-return"
import { useAccount } from "@/hooks/use-account"
import { useAccountResource } from "@/hooks/use-account-resource"
import { useMonitors } from "@/hooks/use-monitors"
import { creditNote, creditSource } from "@/lib/account"
import { signedCredits } from "@/lib/customer-records"
import { DEMO_MODE } from "@/lib/demo"
import { getMonitorFeed } from "@/lib/data/monitors"
import { DEMO_POINTS_USED, demoPointHistory } from "@/lib/data/plans"
import { listCreditTransactions } from "@/lib/operations-api"
import { cn } from "@/lib/utils"

function Meter({ label, value, used, max, hint }: { label: string; value: string; used: number; max: number; hint?: string }) {
  return (
    <div className={cn(cardStyles, "flex-1 p-4")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <div className="mt-2 h-1.5 rounded-full bg-border">
        {max > 0 && <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (used / max) * 100)}%` }} />}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const loadRecent = (token: string) => listCreditTransactions(token, 1)

/** This month's points, monitors and X posts from GET /usage, and the latest point transactions. */
function AccountUsage() {
  const t = useT()
  const tu = t.usage
  const pick = usePick()
  const formatDate = useAccountDate()
  const { session, usage, usageError, refresh } = useAccount()
  const recent = useAccountResource(session?.token || "", loadRecent)
  const { revalidate } = recent
  usePageReturn(useCallback(() => void Promise.all([refresh(), revalidate()]), [refresh, revalidate]))

  if (!usage && usageError) return <ApiErrorNotice error={usageError} onRetry={() => void refresh()} />
  if (!usage) return <p role="status" className="text-sm text-muted-foreground">{t.account.gate.loading}</p>
  const rows = (recent.data?.items ?? []).slice(0, 10)

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Meter label={tu.left} value={usage.credits.balance.toLocaleString("en-US")} used={usage.credits.balance} max={Math.max(usage.credits.balance, usage.credits.monthly)} hint={tu.leftHint(usage.credits.monthly)} />
        <Meter label={tu.usedThisMonth} value={usage.credits.used_this_month.toLocaleString("en-US")} used={usage.credits.used_this_month} max={usage.credits.monthly} />
        <Meter label={tu.monitors} value={tu.used(usage.monitors.used, usage.monitors.limit)} used={usage.monitors.used} max={usage.monitors.limit} />
        <Meter label={tu.xPosts} value={usage.x_posts.limit > 0 ? tu.used(usage.x_posts.used, usage.x_posts.limit) : tu.xLocked} used={usage.x_posts.used} max={usage.x_posts.limit} />
        {usage.api_keys.limit > 0 && (
          <Meter label={tu.apiKeys} value={tu.used(usage.api_keys.used, usage.api_keys.limit)} used={usage.api_keys.used} max={usage.api_keys.limit} />
        )}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{tu.recent}</h2>
          <Link href="/credits" className="text-xs font-medium text-primary hover:text-primary-hover">{tu.allHistory} →</Link>
        </div>
        <ApiErrorNotice error={recent.error} onRetry={() => void recent.refresh()} />
        {!recent.error && (
          <ul className={cn(cardStyles, "divide-y divide-border text-sm")}>
            {rows.map((item) => {
              const description = creditNote(item)
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{pick(creditSource(item))}</span>
                    <span className="block truncate text-xs text-muted-foreground">{formatDate(item.created_at)}{description ? ` · ${description}` : ""}</span>
                  </span>
                  <span className={cn("shrink-0 font-semibold tabular-nums", item.amount > 0 ? "text-success" : "text-foreground")}>{signedCredits(item.amount)}</span>
                </li>
              )
            })}
            {rows.length === 0 && (
              <li className="px-4 py-6 text-center text-muted-foreground">{recent.loading ? t.account.credits.loading : t.account.credits.empty}</li>
            )}
          </ul>
        )}
      </section>
    </>
  )
}

/** The demo usage page for signed-out demo visits (NEXT_PUBLIC_DEMO_MODE). */
function DemoUsage() {
  const locale = useLocale()
  const t = useT()
  const tu = t.usage
  const { plan, limits, xPostsUsed } = usePlan()
  const { monitors } = useMonitors()
  const dateFormat = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })
  const xByMonitor = monitors.flatMap((monitor) => {
    const feed = getMonitorFeed(monitor.id, locale)
    return feed && monitor.tracks.includes("mentions") ? [{ monitor, posts: feed.postsThisMonth }] : []
  })

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Meter label={tu.points} value={tu.used(DEMO_POINTS_USED[plan], limits.points)} used={DEMO_POINTS_USED[plan]} max={limits.points} />
        <Meter label={tu.xPosts} value={limits.xPosts > 0 ? tu.used(xPostsUsed, limits.xPosts) : tu.xLocked} used={xPostsUsed} max={limits.xPosts} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{tu.history}</h2>
        <div className={cn(cardStyles, "overflow-x-auto")}>
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{tu.date}</th>
                <th className="px-2 py-2.5 font-medium">{tu.task}</th>
                <th className="px-2 py-2.5 font-medium">{tu.query}</th>
                <th className="px-4 py-2.5 text-right font-medium">{tu.cost}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demoPointHistory(plan).map((charge, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{dateFormat.format(new Date(`${charge.date}T12:00:00Z`))}</td>
                  <td className="px-2 py-2.5 text-body">{charge.task === "followUp" ? tu.followUp : t.reports.kinds[charge.task].short}</td>
                  <td className="px-2 py-2.5 text-foreground">{charge.query}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">−{charge.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {limits.xPosts > 0 && xByMonitor.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{tu.byMonitor}</h2>
          <ul className={cn(cardStyles, "divide-y divide-border text-sm")}>
            {xByMonitor.map(({ monitor, posts }) => (
              <li key={monitor.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0 truncate text-foreground">{monitor.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{tu.posts(posts)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-muted-foreground">{t.common.demoNote}</p>
    </>
  )
}

/** Where this month's AI points and X posts went, so the point system stays trustworthy. */
export default function UsagePage() {
  const t = useT()
  const tu = t.usage
  const { ready, isAuthenticated } = useAccount()
  const { plan } = usePlan()
  const [showPricing, setShowPricing] = useState(false)

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{tu.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tu.intro}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-body">
              {tu.plan}: <strong className="text-foreground">{tu.planNames[plan]}</strong>
            </span>
            {plan !== "premium" && (
              <button onClick={() => setShowPricing(true)} className={cn(buttonStyles.primary, "h-9")}>
                {t.common.upgrade}
              </button>
            )}
          </div>
        </header>

        <div className="mt-6">
          {ready && !isAuthenticated && DEMO_MODE ? <DemoUsage /> : <AccountGate><AccountUsage /></AccountGate>}
        </div>
      </main>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={tu.points} />
    </div>
  )
}
