/**
 * The four AI reports: backend docs/agent-reports.md. A report is generated inside a
 * conversation (a run, like a reply) and has the shape of RadarReport; a shared copy is
 * public and trimmed by the server.
 */

import { ApiError, apiRequest } from '../api'
import { demoOr, liveOnly } from '../demo'
import { findReport } from '../data/reports'
import type { Locale } from '../i18n'
import type { RadarReport, ReportKind } from '../types'
import type { SentMessage } from './agent'
import { apiClient, segment } from './client'

/** GET /agent/platform/reports/:id: one of the reader's reports. */
export interface SavedReport {
  id: string
  kind: ReportKind
  subject: string
  /** Follows the subject: `zh` when it has Chinese in it. */
  language: string
  conversation_id: string
  report: RadarReport
  share_id?: string
  shared_at?: string
  created_at: string
}

/** GET /shared-reports/:shareId: the trimmed report, and how many items of each list were left out. */
export interface SharedReport {
  kind?: ReportKind
  subject?: string
  language?: string
  report: RadarReport
  hidden?: Record<string, number>
  created_at?: string
}

export interface ReportShare {
  share_id: string
  /** `/r/<share_id>` */
  path: string
}

/** Starts a report; follow its run like a reply (lib/api/agent.ts). Product reports need a domain as the subject. */
export function generateReport(conversationId: string, kind: ReportKind, subject: string, requestId?: string): Promise<SentMessage> {
  return liveOnly(() =>
    apiClient.postBare<SentMessage>(`/agent/platform/conversations/${segment(conversationId)}/reports`, { kind, subject, request_id: requestId }),
  )
}

export function getReport(id: string): Promise<SavedReport> {
  return liveOnly(() => apiClient.get<SavedReport>(`/agent/platform/reports/${segment(id)}`))
}

/** Sharing twice returns the same link. */
export function shareReport(id: string): Promise<ReportShare> {
  return liveOnly(() => apiClient.post<ReportShare>(`/agent/platform/reports/${segment(id)}/share`))
}

export function unshareReport(id: string): Promise<void> {
  return liveOnly(async () => {
    await apiClient.delete(`/agent/platform/reports/${segment(id)}/share`)
  })
}

/** A shared report for /r/[id], read on the server without a session; null when it is not (or no longer) shared. */
export function getSharedReport(shareId: string, locale: Locale): Promise<SharedReport | null> {
  return demoOr(
    () => {
      const report = findReport(shareId, locale)
      return report ? { report } : null
    },
    async () => {
      try {
        return await apiRequest<SharedReport>(`/shared-reports/${segment(shareId)}`)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  )
}
