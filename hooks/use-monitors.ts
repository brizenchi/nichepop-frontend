"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale } from "@/components/i18n/locale-provider"
import { useAccount } from "@/hooks/use-account"
import { useResource } from "@/hooks/use-resource"
import { createMonitor, deleteMonitor, estimateXPosts, getMonitorFeed, listMonitors } from "@/lib/api/monitors"
import type { MonitorDraft } from "@/lib/data/monitors"
import { DEMO_MODE } from "@/lib/demo"

/**
 * The reader's monitors through lib/api/monitors.ts: the account's saved monitors, or in a
 * demo build the seeded examples plus what this browser created. Real builds need a signed-in reader.
 */
export function useMonitors() {
  const locale = useLocale()
  const { ready, isAuthenticated } = useAccount()
  const load = useCallback(() => listMonitors(locale), [locale])
  const list = useResource(DEMO_MODE || isAuthenticated ? load : null)
  const { reload } = list
  const monitors = list.data?.monitors ?? []

  const add = useCallback(
    async (draft: MonitorDraft) => {
      const created = await createMonitor(draft, locale)
      await reload()
      return created
    },
    [locale, reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteMonitor(id)
      await reload()
    },
    [reload],
  )

  return {
    monitors,
    /** The reader's own monitors, without the demo examples. */
    custom: monitors.filter((monitor) => !monitor.demo),
    /** The plan's limits from GET /monitors; null in demo builds. */
    limits: list.data?.limits ?? null,
    loaded: ready && !list.loading,
    error: list.error,
    reload,
    add,
    remove,
  }
}

/** A monitor's feed; null data until its first check. */
export function useMonitorFeed(id: string | null) {
  const locale = useLocale()
  const load = useCallback(() => getMonitorFeed(id ?? "", locale), [id, locale])
  return useResource(id ? load : null)
}

/**
 * About how many posts an X query matches per day; null while unknown. Real builds ask the
 * API (rate limited, so only after typing pauses); `enabled` is false for plans that cannot read X.
 */
export function useXEstimate(query: string, enabled: boolean): number | null {
  const [estimate, setEstimate] = useState<{ query: string; posts: number } | null>(null)
  const q = query.trim()

  useEffect(() => {
    if (!enabled || !q) return
    let current = true
    const timer = setTimeout(() => {
      estimateXPosts(q).then(
        (result) => current && setEstimate({ query: q, posts: result.posts_per_day }),
        () => current && setEstimate(null),
      )
    }, DEMO_MODE ? 0 : 800)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [enabled, q])

  return enabled && estimate?.query === q ? estimate.posts : null
}
