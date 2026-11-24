/**
 * The watchlist, trend report subscriptions and push settings: backend docs/digest.md
 * (`/watchlist`, `/digest-subscriptions`, `/public/digest-subscriptions`) and
 * docs/push.md (`/push/settings`).
 */

import { demoOr, liveOnly } from '../demo'
import type { Locale } from '../i18n'
import { RADAR_WATCHLIST_KEY } from '../storageKeys'
import type { RadarWatchlist } from '../types'
import { apiClient, segment } from './client'
import { readLocal, writeLocal } from './local'

/** GET/PUT /watchlist: the same shape as RadarWatchlist. */
export interface ApiWatchlist extends RadarWatchlist {
  /** False until a delivery email other than the account's is confirmed. */
  confirmed: boolean
}

export type DigestFrequency = 'daily' | 'weekly'

export interface DigestSubscription {
  id: string
  email: string
  /** Niche ids (backend #11); empty means all. */
  niches: string[]
  /** Roots such as `xxx codes`; empty means all. */
  roots: string[]
  sites: string[]
  frequency: DigestFrequency
  locale: Locale
  /** Paid plans: push new opportunities that match a root right away. */
  realtime: boolean
  /** The subscription behind the watchlist (/trends/setup). */
  watchlist: boolean
  status: 'pending' | 'active' | 'unsubscribed'
  confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface DigestSubscriptionInput {
  niches: string[]
  roots: string[]
  sites: string[]
  frequency: DigestFrequency
  locale: Locale
  realtime: boolean
  /** Another address than the account's is confirmed by email first. */
  email?: string
}

export type DigestSubscriptionPatch = Partial<Omit<DigestSubscriptionInput, 'email'>>

/** One opportunity in a report, as the backend digest.Opportunity. */
export interface DigestOpportunity {
  id: string
  keyword: string
  niche?: string
  score: number
  reason: string
  metrics?: Record<string, string>
  evidence?: string[]
  url?: string
  first_seen_at: string
}

export interface DigestReport {
  id: string
  subscription_id: string
  frequency: DigestFrequency
  day: string
  period_start: string
  period_end: string
  /** Free and visitor reports only show opportunities found 48 hours earlier. */
  delayed: boolean
  items: DigestOpportunity[]
  count: number
  locale: Locale
  created_at: string
}

/** GET/PUT /push/settings. */
export interface PushSettings {
  email: string
  timezone: string
  /** Local hour of the daily digest, 0–23. */
  digest_hour: number
  locale: Locale
  /** By category, e.g. `realtime`, `daily_digest`, `trend_reports`. */
  subscribed: Record<string, boolean>
}

export type PushSettingsPatch = Partial<Omit<PushSettings, 'email'>>

const isWatchlist = (value: unknown): value is RadarWatchlist =>
  // Watchlists saved by the earlier site/competitor version of the radar have no roots.
  Boolean(value) && Array.isArray((value as RadarWatchlist).roots)

/** The reader's watchlist; null when a demo visit saved none (the API answers an empty one). */
export function getWatchlist(): Promise<RadarWatchlist | null> {
  return demoOr(
    () => readLocal(RADAR_WATCHLIST_KEY, isWatchlist),
    async () => {
      const data = await apiClient.get<ApiWatchlist | null>('/watchlist')
      return data && isWatchlist(data) ? data : null
    },
  )
}

export function saveWatchlist(watchlist: RadarWatchlist): Promise<RadarWatchlist> {
  return demoOr(
    () => {
      writeLocal(RADAR_WATCHLIST_KEY, watchlist)
      return watchlist
    },
    () => apiClient.put<ApiWatchlist>('/watchlist', watchlist),
  )
}

export function listDigestSubscriptions(): Promise<DigestSubscription[]> {
  return liveOr([], async () => (await apiClient.get<{ items: DigestSubscription[] }>('/digest-subscriptions')).items ?? [])
}

export function createDigestSubscription(input: DigestSubscriptionInput): Promise<DigestSubscription> {
  return liveOnly(() => apiClient.post<DigestSubscription>('/digest-subscriptions', input))
}

export function updateDigestSubscription(id: string, patch: DigestSubscriptionPatch): Promise<DigestSubscription> {
  return liveOnly(() => apiClient.patch<DigestSubscription>(`/digest-subscriptions/${segment(id)}`, patch))
}

export function deleteDigestSubscription(id: string): Promise<void> {
  return liveOnly(async () => {
    await apiClient.delete(`/digest-subscriptions/${segment(id)}`)
  })
}

export function listDigestReports(): Promise<DigestReport[]> {
  return liveOr([], async () => (await apiClient.get<{ items: DigestReport[] }>('/digest-reports')).items ?? [])
}

/** A visitor's email sign-up for the public daily report; the API sends a confirmation email (202). */
export function subscribeVisitor(email: string, locale: Locale): Promise<void> {
  return liveOnly(async () => {
    await apiClient.post('/public/digest-subscriptions', { email: email.trim(), locale })
  })
}

export function getPushSettings(): Promise<PushSettings> {
  return liveOnly(() => apiClient.get<PushSettings>('/push/settings'))
}

export function updatePushSettings(patch: PushSettingsPatch): Promise<PushSettings> {
  return liveOnly(() => apiClient.put<PushSettings>('/push/settings', patch))
}

// Subscriptions have no demo data: demo builds show none and cannot send any (frontend#14 adds the pages).
function liveOr<T>(demo: T, live: () => Promise<T>): Promise<T> {
  return demoOr(() => demo, live)
}
