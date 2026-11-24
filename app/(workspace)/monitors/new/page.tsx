"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowLeft, BarChart3, Check, CheckCircle2, Clock, Hash, Map, Package } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { usePlan } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { Field, Toggle } from "@/components/radar/form"
import { TagInput } from "@/components/radar/tag-input"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { ApiErrorNotice } from "@/components/account/ui"
import { useMonitors, useXEstimate } from "@/hooks/use-monitors"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { cleanDomain } from "@/lib/utils/domain"
import { defaultXQuery, narrowXQuery, quotaFit } from "@/lib/data/monitors"
import { cn } from "@/lib/utils"
import type { MonitorKind, MonitorTrack } from "@/lib/types"

const CHANNELS = ["email", "telegram", "discord", "slack", "feishu"]
const MAX_COMPETITORS = 10
const MAX_RANK_KEYWORDS = 20

const splitParam = (value: string | null) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [])

export default function NewMonitorPage() {
  return (
    <Suspense>
      <NewMonitorForm />
    </Suspense>
  )
}

function NewMonitorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dict = useT()
  const t = dict.monitors
  const { custom, loaded, add } = useMonitors()
  const { limits, xPostsLeft } = usePlan()
  const { gate, dialog } = useAuthGate()

  const [kind, setKind] = useState<MonitorKind>("keyword")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [site, setSite] = useState("")
  const [xQuery, setXQuery] = useState("")
  const [queryEdited, setQueryEdited] = useState(false)
  const [competitors, setCompetitors] = useState<string[]>([])
  const [rankKeywords, setRankKeywords] = useState<string[]>([])
  const [tracks, setTracks] = useState<MonitorTrack[]>(["mentions", "competitors", "rankings", "trends"])
  const [realtime, setRealtime] = useState(true)
  const [channels, setChannels] = useState<string[]>(["email"])
  const [webhook, setWebhook] = useState("")
  const [gscConnected, setGscConnected] = useState(false)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [showPricing, setShowPricing] = useState(false)

  // Prefill from "Build it" on the radar or "Monitor this" in Ask AI.
  useEffect(() => {
    const prefillName = searchParams.get("name")
    if (!prefillName) return
    const requested = searchParams.get("kind")
    const prefillKind: MonitorKind = requested === "product" || requested === "market" ? requested : "keyword"
    setKind(prefillKind)
    setName(prefillName)
    setCompetitors(splitParam(searchParams.get("competitors")))
    const keywords = splitParam(searchParams.get("keywords"))
    setRankKeywords(keywords.length ? keywords : prefillKind === "keyword" ? [prefillName] : [])
  }, [searchParams])

  // Free monitors don't read X: rankings and competitors only.
  const xLocked = limits.xPosts === 0
  useEffect(() => {
    if (xLocked) setTracks((prev) => prev.filter((track) => track !== "mentions"))
  }, [xLocked])

  // The X search follows the name until the user edits it.
  useEffect(() => {
    if (!queryEdited) setXQuery(defaultXQuery(kind, name))
  }, [kind, name, queryEdited])

  const daily = useXEstimate(xQuery, !xLocked && tracks.includes("mentions"))
  const fit = quotaFit(daily ?? 0, xPostsLeft)
  // Paused monitors do not count towards the plan.
  const atLimit = loaded && custom.filter((monitor) => monitor.status !== "paused").length >= limits.monitors
  const toggleTrack = (track: MonitorTrack, on: boolean) => setTracks((prev) => (on ? [...prev, track] : prev.filter((x) => x !== track)))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(true)
      return
    }
    gate("monitor", create)
  }

  const create = async () => {
    const product = kind === "product"
    const monitorTracks = kind === "market" ? tracks.filter((track) => track !== "rankings") : tracks
    setSaving(true)
    setSaveError(null)
    try {
      const monitor = await add({
        kind,
        name: product ? cleanDomain(name) : kind === "market" ? name.trim() : name.trim().toLowerCase(),
        description: kind === "keyword" ? "" : description.trim(),
        site: product ? cleanDomain(name) : cleanDomain(site),
        xQuery,
        competitors,
        rankKeywords: kind === "market" ? [] : rankKeywords,
        tracks: monitorTracks,
        delivery: realtime && limits.checkEvery === "hour" ? "realtime" : "digest",
        channels,
        webhook: webhook.trim() || undefined,
      })
      router.push(`/monitors/${monitor.id}`)
    } catch (failure) {
      setSaveError(failure)
      setSaving(false)
    }
  }

  const fitStyles = {
    ok: { icon: CheckCircle2, className: "border-success/30 bg-success-soft text-success", label: t.estimateOk },
    tight: { icon: Clock, className: "border-warning/30 bg-warning-soft text-warning", label: t.estimateTight(fit.days) },
    over: { icon: AlertTriangle, className: "border-destructive/30 bg-danger-soft text-destructive", label: t.estimateOver(fit.days) },
  }[fit.status]

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
        <Link href="/monitors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{t.newTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.newIntro}</p>

        <form onSubmit={submit} className={cn(cardStyles, "mt-8 divide-y divide-border")}>
          <div className="grid gap-3 p-5 sm:grid-cols-3" role="radiogroup">
            {(
              [
                { value: "keyword", icon: Hash, label: t.kindKeyword, hint: t.kindKeywordHint },
                { value: "product", icon: Package, label: t.kindProduct, hint: t.kindProductHint },
                { value: "market", icon: Map, label: t.kindMarket, hint: t.kindMarketHint },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={kind === option.value}
                onClick={() => setKind(option.value)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                  kind === option.value ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
                )}
              >
                <option.icon className={cn("mt-0.5 h-4 w-4 shrink-0", kind === option.value ? "text-primary" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {kind === "market" && (
            <Field label={t.marketName} htmlFor="monitor-name">
              <input
                id="monitor-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(false)
                }}
                placeholder={t.marketPlaceholder}
                className={inputStyles}
              />
              <label htmlFor="monitor-description" className="block pt-2 text-xs font-medium text-muted-foreground">
                {t.description}
              </label>
              <input id="monitor-description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles} />
            </Field>
          )}

          {kind === "market" ? null : kind === "keyword" ? (
            <Field label={t.name} htmlFor="monitor-name">
              <input
                id="monitor-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(false)
                }}
                placeholder={t.namePlaceholder}
                className={inputStyles}
              />
              <label htmlFor="monitor-site" className="block pt-2 text-xs font-medium text-muted-foreground">
                {t.site} · {t.siteHint}
              </label>
              <input id="monitor-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder={t.sitePlaceholder} className={inputStyles} />
            </Field>
          ) : (
            <Field label={t.productUrl} htmlFor="monitor-name">
              <input
                id="monitor-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(false)
                }}
                placeholder={t.productUrlPlaceholder}
                className={inputStyles}
              />
              <label htmlFor="monitor-description" className="block pt-2 text-xs font-medium text-muted-foreground">
                {t.description}
              </label>
              <input
                id="monitor-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                className={inputStyles}
              />
              <p className="text-xs text-muted-foreground">{t.descriptionHelp}</p>
            </Field>
          )}

          <Field
            label={t.xSearch}
            htmlFor="monitor-query"
            hint={xLocked ? <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">PRO</span> : t.xSearchHint}
            action={<Toggle checked={tracks.includes("mentions")} onChange={(on) => (xLocked ? setShowPricing(true) : toggleTrack("mentions", on))} label={t.xSearch} />}
          >
            {xLocked && <p className="text-xs text-muted-foreground">{t.xLocked}</p>}
            {tracks.includes("mentions") && (
              <>
                <input
                  id="monitor-query"
                  value={xQuery}
                  onChange={(e) => {
                    setXQuery(e.target.value)
                    setQueryEdited(true)
                  }}
                  placeholder={kind === "keyword" ? '"driftbound codes" -is:retweet' : '("yourproduct" OR "yourproduct.com") -is:retweet'}
                  className={cn(inputStyles, "font-mono text-[13px]")}
                />
                {xQuery.trim() && daily !== null && (
                  <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5 text-sm", fitStyles.className)}>
                    <fitStyles.icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{t.estimate(daily)}</span>
                    <span className="text-xs">· {fitStyles.label}</span>
                    {fit.status !== "ok" && name.trim() && narrowXQuery(xQuery, name) !== xQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setXQuery(narrowXQuery(xQuery, name))
                          setQueryEdited(true)
                        }}
                        className="ml-auto rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border hover:bg-subtle cursor-pointer"
                      >
                        {t.narrow}
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{t.xHelp}</p>
              </>
            )}
          </Field>

          <Field
            label={t.competitors}
            hint={t.competitorsHint}
            action={<Toggle checked={tracks.includes("competitors")} onChange={(on) => toggleTrack("competitors", on)} label={t.competitors} />}
          >
            {tracks.includes("competitors") && (
              <TagInput values={competitors} onChange={setCompetitors} max={MAX_COMPETITORS} placeholder={t.competitorsPlaceholder} normalize={cleanDomain} />
            )}
          </Field>

          {kind !== "market" && (
            <Field label={t.rankKeywords} action={<Toggle checked={tracks.includes("rankings")} onChange={(on) => toggleTrack("rankings", on)} label={t.rankKeywords} />}>
              {tracks.includes("rankings") && (
                <>
                  <TagInput values={rankKeywords} onChange={setRankKeywords} max={MAX_RANK_KEYWORDS} placeholder={t.rankKeywordsPlaceholder} normalize={(v) => v.trim().toLowerCase()} />
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground ring-1 ring-border">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{t.gscTitle}</p>
                      <p className="text-xs text-muted-foreground">{t.gscText}</p>
                    </div>
                    <button type="button" onClick={() => setGscConnected((v) => !v)} className={cn(buttonStyles.secondary, "h-8 shrink-0 px-3", gscConnected && "text-success")}>
                      {gscConnected && <Check className="h-3.5 w-3.5" />}
                      {gscConnected ? t.connected : t.connect}
                    </button>
                  </div>
                </>
              )}
            </Field>
          )}

          <Field label={t.trends} action={<Toggle checked={tracks.includes("trends")} onChange={(on) => toggleTrack("trends", on)} label={t.trends} />}>
            <p className="text-xs text-muted-foreground">{t.trendsText}</p>
          </Field>

          <Field
            label={t.delivery}
            action={<Toggle checked={realtime && limits.checkEvery === "hour"} onChange={(on) => (limits.checkEvery === "hour" ? setRealtime(on) : setShowPricing(true))} label={t.realtime} />}
          >
            <p className="flex items-center gap-2 text-sm text-foreground">
              {t.realtime}
              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">PRO</span>
            </p>
            <p className="text-xs text-muted-foreground">{t.realtimeText}</p>
            <p className="pt-2 text-xs font-medium text-muted-foreground">{t.channels}</p>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((channel) => {
                const on = channels.includes(channel)
                return (
                  <button
                    key={channel}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChannels((prev) => (on ? prev.filter((c) => c !== channel) : [...prev, channel]))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer",
                      on ? "border-primary bg-primary-soft font-medium text-primary" : "border-border bg-card text-body hover:border-primary/40",
                    )}
                  >
                    {t.channelNames[channel]}
                  </button>
                )
              })}
            </div>
            {channels.some((c) => c !== "email") && (
              <>
                <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder={t.webhook} aria-label={t.webhook} className={cn(inputStyles, "font-mono text-[13px]")} />
                <p className="text-xs text-muted-foreground">{t.webhookHelp}</p>
              </>
            )}
          </Field>

          <div className="space-y-3 bg-subtle p-5">
            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive" role="alert">
                {t.errorName}
              </p>
            )}
            {atLimit ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-body">{t.limitReached(limits.monitors)}</p>
                <button type="button" onClick={() => setShowPricing(true)} className={cn(buttonStyles.primary, "h-10")}>
                  {dict.common.upgrade}
                </button>
              </div>
            ) : (
              <button type="submit" disabled={saving} className={cn(buttonStyles.primary, "h-10 w-full")}>
                {t.save}
              </button>
            )}
            <ApiErrorNotice error={saveError} />
          </div>
        </form>
      </main>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.title} />
      {dialog}
    </div>
  )
}
