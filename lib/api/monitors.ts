/**
 * Monitors: backend docs/monitors.md (`/api/v1/monitors`). The API names a monitor's
 * fields in snake_case; the feed comes in camelCase, the same as MonitorFeed.
 */

import { demoOr, liveOnly } from '../demo'
import { estimateDailyPosts, getDemoMonitors, getMonitorFeed as getDemoFeed, type MonitorDraft } from '../data/monitors'
import type { Locale } from '../i18n'
import { RADAR_MONITORS_KEY } from '../storageKeys'
import type { Monitor, MonitorFeed, MonitorKind, MonitorTrack } from '../types'
import { apiClient, segment } from './client'
import { readLocal, writeLocal } from './local'

export type MonitorStatus = 'active' | 'paused'

/** The latest check (`last_check`); null until the first check ran. */
export interface MonitorCheck {
  status: 'succeeded' | 'failed'
  finished_at: string
  /** Failures in a row, the latest included; 0 when the latest check succeeded. */
  failures: number
  error?: string
  failed_fetches?: number
  /** `x_quota_exhausted`, `daily_limit:<source>`. */
  notices?: string[]
}

/** A monitor as the API returns it. */
export interface ApiMonitor {
  id: string
  kind: MonitorKind
  name: string
  description: string
  site: string
  x_query: string
  competitors: string[] | null
  rank_keywords: string[] | null
  tracks: MonitorTrack[] | null
  delivery: Monitor['delivery']
  channels: string[] | null
  webhook: string
  location_code: number
  language_code: string
  locale: Locale
  interval_seconds: number
  status: MonitorStatus
  next_run_at: string
  last_checked_at?: string
  created_at: string
  updated_at: string
  last_check: MonitorCheck | null
  push_failures?: number
  last_push_error?: string
}

/** What the plan allows, with this month's X posts (`limits` of the list). */
export interface MonitorLimits {
  plan: string
  monitors: number
  mentions: boolean
  realtime: boolean
  check_every: 'day' | 'hour'
  x_posts: number
  x_posts_used: number
}

/** POST /monitors. Kind and name cannot change afterwards. */
export interface MonitorInput {
  kind: MonitorKind
  name: string
  description: string
  site: string
  x_query: string
  competitors: string[]
  rank_keywords: string[]
  tracks: MonitorTrack[]
  delivery: Monitor['delivery']
  channels?: string[]
  webhook?: string
  locale: Locale
}

/** PATCH /monitors/:id: only the fields that change. */
export type MonitorPatch = Partial<Omit<MonitorInput, 'kind' | 'name'>>

/** GET /monitors/x-estimate: roughly how many posts an X query matches per day. */
export interface XEstimate {
  posts_per_day: number
  /** Fewer than 100 posts in the last day, so the count is exact. */
  exact: boolean
  sample?: number
  fetched_at?: string
  x_posts?: number
  x_posts_used?: number
}

/** The feed before its first check: the API has no time yet. */
type ApiFeed = Omit<MonitorFeed, 'lastCheckedMinutes'> & { lastCheckedMinutes: number | null }

export function monitorFromApi(row: ApiMonitor): Monitor {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    description: row.description,
    site: row.site,
    xQuery: row.x_query,
    competitors: row.competitors ?? [],
    rankKeywords: row.rank_keywords ?? [],
    tracks: row.tracks ?? [],
    delivery: row.delivery,
    channels: row.channels ?? undefined,
    webhook: row.webhook || undefined,
    createdAt: Date.parse(row.created_at),
    status: row.status,
    lastCheckedAt: row.last_checked_at ? Date.parse(row.last_checked_at) : undefined,
  }
}

export function monitorInput(draft: MonitorDraft, locale: Locale): MonitorInput {
  return {
    kind: draft.kind,
    name: draft.name,
    description: draft.description,
    site: draft.site,
    x_query: draft.xQuery,
    competitors: draft.competitors,
    rank_keywords: draft.rankKeywords,
    tracks: draft.tracks,
    delivery: draft.delivery,
    channels: draft.channels,
    webhook: draft.webhook,
    locale,
  }
}

/** A monitor that has never been checked has no feed yet, the same as a new demo monitor. */
export function feedFromApi(feed: ApiFeed): MonitorFeed | null {
  return feed.lastCheckedMinutes === null ? null : { ...feed, lastCheckedMinutes: feed.lastCheckedMinutes }
}

// Demo visits keep the monitors they create in localStorage, in front of the seeded examples.
const isMonitorList = (value: unknown): value is Monitor[] => Array.isArray(value)
const localMonitors = () => readLocal(RADAR_MONITORS_KEY, isMonitorList) ?? []
const demoMonitors = (locale: Locale) => [...localMonitors(), ...getDemoMonitors(locale)]

export interface MonitorList {
  monitors: Monitor[]
  /** Null in demo builds: the plan comes from usePlan. */
  limits: MonitorLimits | null
}

export function listMonitors(locale: Locale): Promise<MonitorList> {
  return demoOr<MonitorList>(
    () => ({ monitors: demoMonitors(locale), limits: null }),
    async () => {
      const data = await apiClient.get<{ items: ApiMonitor[]; total: number; limits: MonitorLimits }>('/monitors')
      return { monitors: data.items.map(monitorFromApi), limits: data.limits }
    },
  )
}

/** Null when there is no such monitor (the API answers 404 for other people's monitors too). */
export function getMonitor(id: string, locale: Locale): Promise<Monitor | null> {
  return demoOr(
    () => demoMonitors(locale).find((monitor) => monitor.id === id) ?? null,
    async () => monitorFromApi(await apiClient.get<ApiMonitor>(`/monitors/${segment(id)}`)),
  )
}

export function getMonitorFeed(id: string, locale: Locale): Promise<MonitorFeed | null> {
  return demoOr(
    () => getDemoFeed(id, locale),
    async () => feedFromApi(await apiClient.get<ApiFeed>(`/monitors/${segment(id)}/feed`)),
  )
}

export function createMonitor(draft: MonitorDraft, locale: Locale): Promise<Monitor> {
  return demoOr(
    () => {
      const created: Monitor = { ...draft, id: `mon-${Date.now()}`, createdAt: Date.now() }
      writeLocal(RADAR_MONITORS_KEY, [created, ...localMonitors()])
      return created
    },
    async () => monitorFromApi(await apiClient.post<ApiMonitor>('/monitors', monitorInput(draft, locale))),
  )
}

export function updateMonitor(id: string, patch: MonitorPatch): Promise<Monitor> {
  return liveOnly(async () => monitorFromApi(await apiClient.patch<ApiMonitor>(`/monitors/${segment(id)}`, patch)))
}

export function pauseMonitor(id: string): Promise<Monitor> {
  return liveOnly(async () => monitorFromApi(await apiClient.post<ApiMonitor>(`/monitors/${segment(id)}/pause`)))
}

export function resumeMonitor(id: string): Promise<Monitor> {
  return liveOnly(async () => monitorFromApi(await apiClient.post<ApiMonitor>(`/monitors/${segment(id)}/resume`)))
}

export function deleteMonitor(id: string): Promise<void> {
  return demoOr(
    () => writeLocal(RADAR_MONITORS_KEY, localMonitors().filter((monitor) => monitor.id !== id)),
    async () => {
      await apiClient.delete(`/monitors/${segment(id)}`)
    },
  )
}

/** Posts per day an X query matches. Demo builds use a made-up estimate; the API counts real posts and is rate limited. */
export function estimateXPosts(query: string): Promise<XEstimate> {
  return demoOr<XEstimate>(
    () => ({ posts_per_day: estimateDailyPosts(query), exact: false }),
    () => apiClient.get<XEstimate>('/monitors/x-estimate', { q: query }),
  )
}
