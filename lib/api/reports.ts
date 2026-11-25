/**
 * The four AI reports: backend docs/agent-reports.md. A report is generated inside a
 * conversation (a run, like a reply) and has the shape of RadarReport; a shared copy is
 * public and trimmed by the server.
 */

import { ApiError, apiRequest } from '../api'
import { demoStartReport } from '../data/agent-demo'
import { DEMO_MODE, demoOr, liveOnly } from '../demo'
import { findReport } from '../data/reports'
import type { Locale } from '../i18n'
import type { RadarReport, ReportKind } from '../types'
import { followStream, type SentMessage, type StreamOptions } from './agent'
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

/**
 * Starts a report and follows it: tool steps and charges, then `report.completed` with the
 * report, `report.followup` with follow-up questions, and `run.completed`.
 */
export function streamReport(conversationId: string, kind: ReportKind, subject: string, requestId: string, options: StreamOptions): Promise<void> {
  if (DEMO_MODE) return demoStartReport(conversationId, kind, subject, options)
  return followStream(
    apiClient.stream(`/agent/platform/conversations/${segment(conversationId)}/reports`, { method: 'POST', data: { kind, subject, request_id: requestId } }),
    options,
  )
}

export function getReport(id: string): Promise<SavedReport> {
  return liveOnly(() => apiClient.get<SavedReport>(`/agent/platform/reports/${segment(id)}`))
}

/** Sharing twice returns the same link. Demo reports are shared under their own id. */
export function shareReport(id: string): Promise<ReportShare> {
  return demoOr(
    () => ({ share_id: id, path: `/r/${id}` }),
    () => apiClient.post<ReportShare>(`/agent/platform/reports/${segment(id)}/share`),
  )
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
