/**
 * The trend library: opportunities (backend #16, `/api/v1/niches`) and the 30-day view
 * (backend #38, `/api/v1/niche-trends/month`). Neither endpoint exists yet; until they do,
 * the API answers 404 and pages show that the library is coming (isComingSoon).
 * Both return the shapes the pages already draw: RadarWord, and lib/data/trends.ts.
 */

import { ApiError } from '../api'
import { demoOr } from '../demo'
import { getDemoWords } from '../data/radar'
import { categoryMomentum, getMonthlyTrends, weeklyNewTrends, type CategoryMomentum, type MonthlyTrend } from '../data/trends'
import type { Locale } from '../i18n'
import type { RadarWord } from '../types'
import { apiClient, segment } from './client'

export interface NicheQuery {
  locale: Locale
  /** A niche id from listNicheTracks. */
  track?: string
  root?: string
  limit?: number
}

export interface NicheList {
  items: RadarWord[]
  total: number
}

/** A niche (track) for the filter menus. */
export interface NicheTrack {
  id: string
  name: string
}

export interface MonthTrends {
  categories: CategoryMomentum[]
  /** New trends found each week, oldest week first. */
  weekly: number[]
  trends: MonthlyTrend[]
}

/** Signed-in readers get their plan's view; visitors and Free see opportunities 48 hours after Pro. */
export function listNiches(query: NicheQuery): Promise<NicheList> {
  return demoOr(
    () => {
      const items = getDemoWords(query.locale)
      return { items, total: items.length }
    },
    () => apiClient.get<NicheList>('/niches', query),
  )
}

export function getNiche(id: string, locale: Locale): Promise<RadarWord | null> {
  return demoOr(
    () => getDemoWords(locale).find((word) => word.id === id) ?? null,
    () => apiClient.get<RadarWord>(`/niches/${segment(id)}`, { locale }),
  )
}

export function listNicheTracks(locale: Locale): Promise<NicheTrack[]> {
  return demoOr(
    () => Array.from(new Set(getDemoWords(locale).map((word) => word.category))).map((name) => ({ id: name, name })),
    async () => (await apiClient.get<{ items: NicheTrack[] }>('/niche-tracks', { locale })).items,
  )
}

export function getMonthTrends(locale: Locale): Promise<MonthTrends> {
  return demoOr(
    () => ({ categories: categoryMomentum, weekly: weeklyNewTrends, trends: getMonthlyTrends(locale) }),
    () => apiClient.get<MonthTrends>('/niche-trends/month', { locale }),
  )
}

/** The API has no trend library yet (backend #16, #38): show that it is coming, not an error. */
export function isComingSoon(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
