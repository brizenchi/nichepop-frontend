"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApiErrorNotice } from "@/components/account/ui"
import { TagInput } from "@/components/radar/tag-input"
import { Field, Toggle } from "@/components/radar/form"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { useT } from "@/components/i18n/locale-provider"
import { useRadarWatchlist } from "@/hooks/use-radar-watchlist"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { suggestedRoots } from "@/lib/data/radar"
import { cn } from "@/lib/utils"
import type { RadarWatchlist } from "@/lib/types"

const MAX_ROOTS = 10

const emptyWatchlist: RadarWatchlist = {
  roots: [],
  sites: [],
  delivery: { email: "", realtimeAlerts: true },
}

function normalizeRoot(raw: string) {
  const value = raw.trim().toLowerCase().replace(/\s+/g, " ")
  return value && !value.includes("xxx") ? `xxx ${value}` : value
}

export default function WatchlistPage() {
  const router = useRouter()
  const t = useT().setup
  const { gate, dialog } = useAuthGate()
  const { watchlist: savedWatchlist, loaded, save } = useRadarWatchlist()
  const [form, setForm] = useState<RadarWatchlist>(emptyWatchlist)
  const [error, setError] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)

  useEffect(() => {
    if (loaded && savedWatchlist) {
      setForm({ ...emptyWatchlist, ...savedWatchlist, delivery: { ...emptyWatchlist.delivery, ...savedWatchlist.delivery } })
    }
  }, [loaded, savedWatchlist])

  const update = (patch: Partial<RadarWatchlist>) => setForm((prev) => ({ ...prev, ...patch }))
  const updateDelivery = (patch: Partial<RadarWatchlist["delivery"]>) =>
    setForm((prev) => ({ ...prev, delivery: { ...prev.delivery, ...patch } }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.roots.length === 0) {
      setError(true)
      return
    }
    gate("save", async () => {
      setSaveError(null)
      try {
        await save(form)
        router.push("/trends")
      } catch (failure) {
        setSaveError(failure)
      }
    })
  }

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">

      <main className="mx-auto max-w-xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.intro}
        </p>

        <form onSubmit={handleSubmit} className={cn(cardStyles, "mt-8 divide-y divide-border")}>
          <Field label={t.roots} hint={t.rootsHint(MAX_ROOTS)}>
            <TagInput
              values={form.roots}
              onChange={(roots) => {
                update({ roots })
                if (roots.length) setError(false)
              }}
              max={MAX_ROOTS}
              placeholder={t.rootsPlaceholder}
              suggestions={suggestedRoots}
              normalize={normalizeRoot}
            />
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">xxx</span> {t.rootsHelp[0]} <span className="font-mono">xxx codes</span> {t.rootsHelp[1]}
            </p>
          </Field>

          <Field label={t.alerts} htmlFor="email">
            <input
              id="email"
              type="email"
              value={form.delivery.email}
              onChange={(e) => updateDelivery({ email: e.target.value })}
              placeholder="you@example.com"
              className={inputStyles}
            />
            <div className="flex items-center justify-between gap-4 pt-1">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {t.realtime}
                  <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">PRO</span>
                </p>
                <p className="text-xs text-muted-foreground">{t.realtimeText}</p>
              </div>
              <Toggle checked={form.delivery.realtimeAlerts} onChange={(realtimeAlerts) => updateDelivery({ realtimeAlerts })} label={t.realtime} />
            </div>
          </Field>

          <div className="space-y-3 bg-subtle p-5">
            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive" role="alert">
                {t.errorRoots}
              </p>
            )}
            <button type="submit" className={cn(buttonStyles.primary, "h-10 w-full")}>
              {t.save}
            </button>
            <ApiErrorNotice error={saveError} />
          </div>
        </form>
      </main>
      {dialog}
    </div>
  )
}
