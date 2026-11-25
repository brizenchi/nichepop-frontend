"use client"

import { useCallback, useMemo, useState } from "react"
import { Bell, Mail } from "lucide-react"
import { ApiErrorNotice } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { Toggle } from "@/components/radar/form"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useResource } from "@/hooks/use-resource"
import { getPushSettings, updatePushSettings, type PushSettings, type PushSettingsPatch } from "@/lib/api/subscriptions"
import { cn } from "@/lib/utils"
import { usePlan } from "./use-plan"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const SOON_CHANNELS = ["telegram", "discord", "slack", "feishu"]

function timeZones(current: string): string[] {
  const browser = Intl.DateTimeFormat().resolvedOptions().timeZone
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
  return Array.from(new Set([current, browser, "UTC", ...all].filter(Boolean)))
}

/**
 * Where all of a reader's monitor alerts go (GET/PUT /push/settings, backend #25): email for
 * now, instant alerts and the daily digest on or off, and when the digest is sent.
 */
export function NotificationSettings({ className }: { className?: string }) {
  const load = useCallback(() => getPushSettings(), [])
  const { data, error, loading, reload } = useResource(load)
  const [saved, setSaved] = useState<PushSettings | null>(null)
  const settings = saved ?? data
  const dict = useT()
  const t = dict.monitorManage.notifications

  return (
    <section id="notifications" className={cn(cardStyles, "scroll-mt-20", className)}>
      <div className="flex items-start gap-3 border-b border-border p-5">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.intro}</p>
        </div>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={() => void reload()} className="p-5" />
      ) : !settings ? (
        loading && <LoadingState className="px-5" />
      ) : (
        <SettingsForm settings={settings} onSaved={setSaved} />
      )}
    </section>
  )
}

function SettingsForm({ settings, onSaved }: { settings: PushSettings; onSaved: (settings: PushSettings) => void }) {
  const dict = useT()
  const t = dict.monitorManage.notifications
  const tm = dict.monitorManage
  const { limits } = usePlan()
  const [timezone, setTimezone] = useState(settings.timezone)
  const [hour, setHour] = useState(settings.digest_hour)
  const [saving, setSaving] = useState(false)
  const [timeSaved, setTimeSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const zones = useMemo(() => timeZones(settings.timezone), [settings.timezone])
  const changed = timezone !== settings.timezone || hour !== settings.digest_hour

  const save = async (patch: PushSettingsPatch) => {
    setSaving(true)
    setError(null)
    try {
      onSaved(await updatePushSettings(patch))
      if (patch.digest_hour !== undefined) setTimeSaved(true)
    } catch (failure) {
      setError(failure)
    } finally {
      setSaving(false)
    }
  }

  const subscription = (category: string, label: string, text: string, badge?: boolean) => (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {label}
          {badge && <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">PRO</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
      <Toggle checked={settings.subscribed[category] !== false} onChange={(on) => void save({ subscribed: { [category]: on } })} label={label} />
    </div>
  )

  return (
    <div className="divide-y divide-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 text-sm">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{t.email}</span>
        <span className="min-w-0 truncate text-body">{settings.email}</span>
      </div>
      {subscription("monitor_alerts", t.alerts, t.alertsText, limits.checkEvery !== "hour")}
      {subscription("daily_digest", t.digest, t.digestText)}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-none text-xs font-medium text-muted-foreground">
          {t.digestAt}
          <select
            value={hour}
            onChange={(e) => {
              setHour(Number(e.target.value))
              setTimeSaved(false)
            }}
            className={cn(inputStyles, "mt-1.5 block w-full sm:w-28")}
          >
            {HOURS.map((value) => (
              <option key={value} value={value}>
                {String(value).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 flex-1 text-xs font-medium text-muted-foreground">
          {t.timezone}
          <select
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value)
              setTimeSaved(false)
            }}
            className={cn(inputStyles, "mt-1.5 block w-full")}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={!changed || saving} onClick={() => void save({ timezone, digest_hour: hour })} className={cn(buttonStyles.secondary, "h-10 shrink-0")}>
          {timeSaved && !changed ? t.saved : t.save}
        </button>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {[...SOON_CHANNELS.map((channel) => dict.monitors.channelNames[channel]), "Webhook"].map((label) => (
            <span key={label} aria-disabled className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground opacity-70">
              {label}
            </span>
          ))}
          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{tm.comingSoon}</span>
        </div>
        <p className="text-xs text-muted-foreground">{tm.imSoon}</p>
      </div>
      {error ? (
        <div className="px-5 py-4">
          <ApiErrorNotice error={error} />
        </div>
      ) : null}
    </div>
  )
}
