"use client"

import { useState, type ReactNode } from "react"
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Hash, Map, Package } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { Field, Toggle } from "@/components/radar/form"
import { TagInput } from "@/components/radar/tag-input"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { useAccount } from "@/hooks/use-account"
import { useXEstimate } from "@/hooks/use-monitors"
import { cleanDomain } from "@/lib/utils/domain"
import { defaultXQuery, narrowXQuery, quotaFit, type MonitorDraft } from "@/lib/data/monitors"
import { cn } from "@/lib/utils"
import type { MonitorKind, MonitorTrack } from "@/lib/types"
import { MonitorSaveError } from "./monitor-errors"
import { usePlan } from "./use-plan"

/** Push channels other than email: the backend sends email only until backend #25's second step. */
const SOON_CHANNELS = ["telegram", "discord", "slack", "feishu"]
const MAX_COMPETITORS = 10
const MAX_RANK_KEYWORDS = 20

export const NEW_MONITOR: MonitorDraft = {
  kind: "keyword",
  name: "",
  description: "",
  site: "",
  xQuery: "",
  competitors: [],
  rankKeywords: [],
  tracks: ["mentions", "competitors", "rankings", "trends"],
  delivery: "realtime",
  channels: ["email"],
}

type MonitorFormProps = {
  initial: MonitorDraft
  /** Editing a saved monitor: its kind and name cannot change (the API's PATCH has neither). */
  editing?: boolean
  saving: boolean
  error: unknown
  /** Creating with no monitor left on the plan: the form offers an upgrade instead. */
  atLimit?: boolean
  submitLabel: string
  onSubmit: (draft: MonitorDraft) => void
  onUpgrade: () => void
  /** Below the submit button, e.g. a cancel link. */
  footer?: ReactNode
}

/** The settings of a monitor, for /monitors/new and /monitors/[id]/edit. */
export function MonitorForm({ initial, editing = false, saving, error, atLimit = false, submitLabel, onSubmit, onUpgrade, footer }: MonitorFormProps) {
  const dict = useT()
  const t = dict.monitors
  const tm = dict.monitorManage
  const { user } = useAccount()
  const { limits, xPostsLeft } = usePlan()

  const [kind, setKind] = useState<MonitorKind>(initial.kind)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [site, setSite] = useState(initial.site)
  const [editedQuery, setEditedQuery] = useState(initial.xQuery)
  // A new monitor's X search follows its name until the user edits it.
  const [queryEdited, setQueryEdited] = useState(editing)
  const xQuery = queryEdited ? editedQuery : defaultXQuery(kind, name)
  const editQuery = (value: string) => {
    setEditedQuery(value)
    setQueryEdited(true)
  }
  const [competitors, setCompetitors] = useState(initial.competitors)
  const [rankKeywords, setRankKeywords] = useState(initial.rankKeywords)
  const [tracks, setTracks] = useState<MonitorTrack[]>(initial.tracks)
  const [realtime, setRealtime] = useState(initial.delivery === "realtime")
  const [nameMissing, setNameMissing] = useState(false)

  // Free monitors don't read X (rankings and competitors only); the API refuses mentions for them.
  const xLocked = limits.xPosts === 0
  const hourly = limits.checkEvery === "hour"
  const on = (track: MonitorTrack) => tracks.includes(track) && !(track === "mentions" && xLocked)
  const toggleTrack = (track: MonitorTrack, value: boolean) => setTracks((prev) => (value ? [...prev, track] : prev.filter((x) => x !== track)))

  const daily = useXEstimate(xQuery, on("mentions"))
  const fit = quotaFit(daily ?? 0, xPostsLeft)
  const fitStyles = {
    ok: { icon: CheckCircle2, className: "border-success/30 bg-success-soft text-success", label: t.estimateOk },
    tight: { icon: Clock, className: "border-warning/30 bg-warning-soft text-warning", label: t.estimateTight(fit.days) },
    over: { icon: AlertTriangle, className: "border-destructive/30 bg-danger-soft text-destructive", label: t.estimateOver(fit.days) },
  }[fit.status]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameMissing(true)
      return
    }
    const product = kind === "product"
    onSubmit({
      kind,
      name: editing ? initial.name : product ? cleanDomain(name) : kind === "market" ? name.trim() : name.trim().toLowerCase(),
      description: kind === "keyword" ? "" : description.trim(),
      site: product ? cleanDomain(name) : cleanDomain(site),
      xQuery,
      competitors,
      rankKeywords: kind === "market" ? [] : rankKeywords,
      tracks: tracks.filter((track) => on(track) && !(kind === "market" && track === "rankings")),
      delivery: realtime && hourly ? "realtime" : "digest",
      // Whatever was saved stays; new monitors push to email.
      channels: initial.channels ?? ["email"],
      webhook: initial.webhook,
    })
  }

  const nameInput = (placeholder: string) =>
    editing ? (
      <p id="monitor-name" className="rounded-lg border border-border bg-subtle px-3 py-2 text-sm font-medium text-foreground">
        {name}
      </p>
    ) : (
      <input
        id="monitor-name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setNameMissing(false)
        }}
        placeholder={placeholder}
        className={inputStyles}
      />
    )

  return (
    <form onSubmit={submit} className={cn(cardStyles, "mt-8 divide-y divide-border")}>
      {!editing && (
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
      )}

      {kind === "market" ? (
        <Field label={t.marketName} htmlFor="monitor-name">
          {nameInput(t.marketPlaceholder)}
          <label htmlFor="monitor-description" className="block pt-2 text-xs font-medium text-muted-foreground">
            {t.description}
          </label>
          <input id="monitor-description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles} />
        </Field>
      ) : kind === "keyword" ? (
        <Field label={t.name} htmlFor="monitor-name">
          {nameInput(t.namePlaceholder)}
          <label htmlFor="monitor-site" className="block pt-2 text-xs font-medium text-muted-foreground">
            {t.site} · {t.siteHint}
          </label>
          <input id="monitor-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder={t.sitePlaceholder} className={inputStyles} />
        </Field>
      ) : (
        <Field label={t.productUrl} htmlFor="monitor-name">
          {nameInput(t.productUrlPlaceholder)}
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
        action={<Toggle checked={on("mentions")} onChange={(value) => (xLocked ? onUpgrade() : toggleTrack("mentions", value))} label={t.xSearch} />}
      >
        {xLocked && <p className="text-xs text-muted-foreground">{t.xLocked}</p>}
        {on("mentions") && (
          <>
            <input
              id="monitor-query"
              value={xQuery}
              onChange={(e) => editQuery(e.target.value)}
              placeholder={kind === "keyword" ? '"driftbound codes" -is:retweet' : '("yourproduct" OR "yourproduct.com") -is:retweet'}
              className={cn(inputStyles, "font-mono text-[13px]")}
            />
            {/* Real builds show the API's estimate (backend #23); while there is none, no number at all. */}
            {xQuery.trim() && daily !== null && (
              <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5 text-sm", fitStyles.className)}>
                <fitStyles.icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{t.estimate(daily)}</span>
                <span className="text-xs">· {fitStyles.label}</span>
                {fit.status !== "ok" && name.trim() && narrowXQuery(xQuery, name) !== xQuery && (
                  <button
                    type="button"
                    onClick={() => editQuery(narrowXQuery(xQuery, name))}
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
        action={<Toggle checked={on("competitors")} onChange={(value) => toggleTrack("competitors", value)} label={t.competitors} />}
      >
        {on("competitors") && (
          <TagInput values={competitors} onChange={setCompetitors} max={MAX_COMPETITORS} placeholder={t.competitorsPlaceholder} normalize={cleanDomain} />
        )}
      </Field>

      {kind !== "market" && (
        <Field label={t.rankKeywords} action={<Toggle checked={on("rankings")} onChange={(value) => toggleTrack("rankings", value)} label={t.rankKeywords} />}>
          {on("rankings") && (
            <>
              <TagInput values={rankKeywords} onChange={setRankKeywords} max={MAX_RANK_KEYWORDS} placeholder={t.rankKeywordsPlaceholder} normalize={(v) => v.trim().toLowerCase()} />
              {/* Search Console is not connected yet: say so instead of pretending. */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground ring-1 ring-border">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t.gscTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.gscText}</p>
                </div>
                <button type="button" disabled aria-disabled className={cn(buttonStyles.secondary, "h-8 shrink-0 cursor-not-allowed px-3 opacity-60")}>
                  {tm.comingSoon}
                </button>
              </div>
            </>
          )}
        </Field>
      )}

      <Field label={t.trends} action={<Toggle checked={on("trends")} onChange={(value) => toggleTrack("trends", value)} label={t.trends} />}>
        <p className="text-xs text-muted-foreground">{t.trendsText}</p>
      </Field>

      <Field label={t.delivery} action={<Toggle checked={realtime && hourly} onChange={(value) => (hourly ? setRealtime(value) : onUpgrade())} label={t.realtime} />}>
        <p className="flex items-center gap-2 text-sm text-foreground">
          {t.realtime}
          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">PRO</span>
        </p>
        <p className="text-xs text-muted-foreground">{t.realtimeText}</p>
        <p className="pt-2 text-xs font-medium text-muted-foreground">{t.channels}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-primary bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
            {user?.email ? tm.emailTo(user.email) : tm.emailOnly}
          </span>
          {[...SOON_CHANNELS.map((channel) => t.channelNames[channel]), "Webhook"].map((label) => (
            <span key={label} aria-disabled className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground opacity-70">
              {label}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{tm.imSoon}</p>
      </Field>

      <div className="space-y-3 bg-subtle p-5">
        {nameMissing && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive" role="alert">
            {t.errorName}
          </p>
        )}
        {atLimit ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-body">{t.limitReached(limits.monitors)}</p>
            <button type="button" onClick={onUpgrade} className={cn(buttonStyles.primary, "h-10")}>
              {dict.common.upgrade}
            </button>
          </div>
        ) : (
          <button type="submit" disabled={saving} className={cn(buttonStyles.primary, "h-10 w-full")}>
            {submitLabel}
          </button>
        )}
        <MonitorSaveError error={error} onUpgrade={onUpgrade} />
        {footer}
      </div>
    </form>
  )
}
