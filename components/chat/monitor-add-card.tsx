"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Eye } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { usePlan } from "@/components/monitors/use-plan"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { ApiErrorNotice } from "@/components/account/ui"
import { useMonitors, useXEstimate } from "@/hooks/use-monitors"
import { quotaFit, type MonitorDraft } from "@/lib/data/monitors"
import { cn } from "@/lib/utils"
import type { MonitorTrack } from "@/lib/types"

const ALL_TRACKS: MonitorTrack[] = ["mentions", "competitors", "rankings", "trends"]

/** Add whatever the chat was about to monitors, without leaving the conversation. */
export function MonitorAddCard({ draft, onCancel, onUpgrade }: { draft: MonitorDraft; onCancel: () => void; onUpgrade: () => void }) {
  const dict = useT()
  const t = dict.monitors
  const ta = dict.ask
  const { monitors, custom, add } = useMonitors()
  const { limits, xPostsLeft } = usePlan()
  const { gate, dialog } = useAuthGate()
  const [tracks, setTracks] = useState<MonitorTrack[]>(draft.tracks)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<unknown>(null)

  const existing = monitors.find((m) => m.kind === draft.kind && m.name.toLowerCase() === draft.name.toLowerCase())
  const xLocked = limits.xPosts === 0
  const daily = useXEstimate(draft.xQuery, !xLocked && tracks.includes("mentions"))
  const fit = quotaFit(daily ?? 0, xPostsLeft)
  const available = draft.kind === "keyword" || draft.kind === "product" ? ALL_TRACKS : ALL_TRACKS.filter((track) => track !== "rankings")

  if (addedId || existing) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-sm">
        <Check className="h-4 w-4 text-success" />
        <span className="text-foreground">{addedId ? ta.monitorAdded : ta.alreadyMonitored}</span>
        <Link href={`/monitors/${addedId ?? existing?.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover">
          {ta.viewMonitor}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  // Paused monitors do not count towards the plan.
  if (custom.filter((monitor) => monitor.status !== "paused").length >= limits.monitors) {
    return (
      <div className={cn(cardStyles, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="text-sm text-body">{t.limitReached(limits.monitors)}</p>
        <button onClick={onUpgrade} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
          {dict.common.upgrade}
        </button>
      </div>
    )
  }

  const confirm = () =>
    gate("monitor", async () => {
      setSaveError(null)
      try {
        const created = await add({ ...draft, tracks, delivery: limits.checkEvery === "hour" ? "realtime" : "digest" })
        setAddedId(created.id)
      } catch (failure) {
        setSaveError(failure)
      }
    })

  return (
    <div className={cn(cardStyles, "space-y-3 p-4")}>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Eye className="h-4 w-4 text-primary" />
        {t.kinds[draft.kind]} · {draft.name}
      </p>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{ta.monitorWill}</p>
        <div className="flex flex-wrap gap-1.5">
          {available.map((track) => {
            const locked = track === "mentions" && xLocked
            const on = tracks.includes(track) && !locked
            return (
              <button
                key={track}
                type="button"
                aria-pressed={on}
                onClick={() => (locked ? onUpgrade() : setTracks((prev) => (on ? prev.filter((x) => x !== track) : [...prev, track])))}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer",
                  on ? "border-primary bg-primary-soft font-medium text-primary" : "border-border bg-card text-body hover:border-primary/40",
                )}
              >
                {t.tracks[track]}
                {locked && <span className="rounded bg-primary px-1 text-[10px] font-semibold text-white">PRO</span>}
              </button>
            )
          })}
        </div>
      </div>
      {tracks.includes("mentions") && !xLocked && daily !== null && (
        <p className="text-xs text-muted-foreground">
          <span className="font-mono text-body">{draft.xQuery}</span> · {t.estimate(daily)} ·{" "}
          <span className={cn(fit.status === "ok" ? "text-success" : fit.status === "tight" ? "text-warning" : "text-destructive")}>
            {fit.status === "ok" ? t.estimateOk : fit.status === "tight" ? t.estimateTight(fit.days) : t.estimateOver(fit.days)}
          </span>
        </p>
      )}
      {draft.competitors.length > 0 && tracks.includes("competitors") && (
        <p className="text-xs text-muted-foreground">
          {t.competitors}: <span className="text-body">{draft.competitors.join(", ")}</span>
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={confirm} className={cn(buttonStyles.primary, "h-9")}>
          {ta.confirmMonitor}
        </button>
        <button onClick={onCancel} className={cn(buttonStyles.ghost, "h-9")}>
          {ta.cancel}
        </button>
      </div>
      <ApiErrorNotice error={saveError} />
      {dialog}
    </div>
  )
}
