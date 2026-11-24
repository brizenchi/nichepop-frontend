/**
 * The AI analyst: backend docs/agent-platform.md (`/api/v1/agent/platform`). A message
 * starts a run; the run's events (RunEvent) stream over SSE, and a page that lost the
 * stream picks up with `?after=<event id>` (lib/api/run-stream.ts). Demo builds play the
 * same events from lib/data/agent-demo.ts.
 */

import { demoCancel, demoPricing, demoSendMessage } from '../data/agent-demo'
import { DEMO_MODE, demoOr, liveOnly } from '../demo'
import { apiUrl } from '../env'
import type { Locale } from '../i18n'
import type { RadarReport, ReportKind } from '../types'
import { apiClient, segment } from './client'
import { followRun } from './run-stream'

export interface Conversation {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
}

/** GET .../conversations/:id, with the reply in progress so a reloaded page can follow it. */
export interface ConversationDetail {
  conversation: Conversation
  active_run: Run | null
}

export type MessageType = 'text' | 'report_offer' | 'report_request' | 'report' | 'report_followup'

export interface Message {
  id: string
  conversation_id: string
  run_id?: string
  sequence: number
  role: 'user' | 'assistant' | string
  content: string
  status: string
  type: MessageType
  /** The report step's data for every type but `text`. */
  payload?: unknown
  created_at: string
}

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled'

export interface Run {
  id: string
  conversation_id: string
  input_message_id: string
  status: RunStatus
  purpose: 'reply' | 'report' | string
  report_kind?: string
  subject?: string
  provider: string
  model: string
  error?: string
  started_at?: string
  finished_at?: string
  created_at: string
}

/** 202 of POST .../messages. */
export interface SentMessage {
  message: Message
  run: Run
}

/** A report the message could be the subject of; the reply is this offer (backend docs/agent-reports.md). */
export interface ReportOffer {
  kind: ReportKind
  subject: string
  /** Low and high end; starting the report needs the high end in the balance. */
  estimate_credits: [number, number]
  /** Kinds the reader may switch to. */
  kinds: ReportKind[]
  language?: string
  message_id?: string
}

export interface ToolEventData {
  id: string
  /** The backend tool (`serp_top`), `<server>.<tool>` when Codex calls it over MCP, or a provider step (`web_search`, `command`). */
  tool: string
  /** The call's input: a query, or JSON. */
  detail?: string
  error?: string
}

export interface RunEndData {
  code?: string
  error?: string
  /** What the run had been charged, all given back. */
  credits_refunded?: number
}

/** Data of each event of a run, in order (docs/agent-platform.md). */
export interface RunEventData {
  'run.created': { run_id: string; conversation_id?: string; message_id?: string; purpose?: string }
  'run.started': { run_id: string }
  'tool.started': ToolEventData
  'tool.completed': ToolEventData
  /** ROUND_LIMIT, CREDIT_CAP or INSUFFICIENT_CREDITS: the answer uses the data found so far. */
  'run.notice': { code: string; message?: string }
  /** A paid lookup was charged; credits_charged is the run's total so far. */
  'credits.charged': { tool: string; credits: number; credits_charged?: number; balance?: number }
  /** A charge that landed after the run ended was given back. */
  'credits.refunded': { credits: number; balance?: number }
  monitor_draft: unknown
  subscription_draft: unknown
  'message.delta': { delta: string }
  'source.added': { url: string }
  'message.completed': { message_id?: string; content: string }
  'report.offer': ReportOffer
  'report.completed': { report_id: string; message_id?: string; report: RadarReport; unknown_fields?: string[] }
  'report.followup': { report_id: string; follow_ups: string[] | null; monitor_draft?: unknown; message_id?: string }
  'suggestion.report': unknown
  'run.completed': { message_id?: string; report_id?: string; credits_charged?: number; balance?: number }
  'run.failed': RunEndData
  'run.canceled': RunEndData
}

export type RunEventType = keyof RunEventData

export type RunEvent = { [K in RunEventType]: { id: string; type: K; data: RunEventData[K] } }[RunEventType]

const RUN_EVENT_TYPES = new Set<string>([
  'run.created', 'run.started', 'tool.started', 'tool.completed', 'run.notice', 'credits.charged', 'credits.refunded',
  'monitor_draft', 'subscription_draft', 'message.delta', 'source.added', 'message.completed', 'report.offer',
  'report.completed', 'report.followup', 'suggestion.report', 'run.completed', 'run.failed', 'run.canceled',
] satisfies RunEventType[])

/** Why sending was refused: `BUSY` (409, another reply of the account is running), `INSUFFICIENT_CREDITS` (402), `QUOTA_EXCEEDED` (429). */
export type SendRefusal = 'BUSY' | 'INSUFFICIENT_CREDITS' | 'QUOTA_EXCEEDED'

export interface ConversationPage {
  items: Conversation[]
  total: number
}

export function listConversations(params: { limit?: number; offset?: number; q?: string } = {}): Promise<ConversationPage> {
  return liveOnly(() => apiClient.get<ConversationPage>('/agent/platform/conversations', params))
}

export function createConversation(title = ''): Promise<Conversation> {
  return demoOr(
    () => {
      const now = new Date().toISOString()
      return { id: `c-${Date.now()}`, title, status: 'active', created_at: now, updated_at: now }
    },
    () => apiClient.postBare<Conversation>('/agent/platform/conversations', { title }),
  )
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return liveOnly(() => apiClient.get<ConversationDetail>(`/agent/platform/conversations/${segment(id)}`))
}

export function renameConversation(id: string, title: string): Promise<Conversation> {
  return liveOnly(() => apiClient.patch<Conversation>(`/agent/platform/conversations/${segment(id)}`, { title }))
}

export function deleteConversation(id: string): Promise<void> {
  return liveOnly(async () => {
    await apiClient.delete(`/agent/platform/conversations/${segment(id)}`)
  })
}

export function listMessages(conversationId: string): Promise<Message[]> {
  return liveOnly(async () => (await apiClient.get<{ items: Message[] }>(`/agent/platform/conversations/${segment(conversationId)}/messages`)).items ?? [])
}

/**
 * Sends a message and starts its reply; follow the reply at runEventsUrl(run.id).
 * `requestId` makes a retried send store the message once.
 */
export function sendMessage(conversationId: string, content: string, requestId?: string): Promise<SentMessage> {
  return liveOnly(() =>
    apiClient.postBare<SentMessage>(`/agent/platform/conversations/${segment(conversationId)}/messages`, { content, request_id: requestId }),
  )
}

/** Stops a run: it ends with `run.canceled`, and what it was charged is given back. */
export function cancelRun(runId: string): Promise<void> {
  return demoOr(
    () => demoCancel(runId),
    async () => {
      await apiClient.post(`/agent/platform/runs/${segment(runId)}/cancel`)
    },
  )
}

/** The SSE stream of a run; `after` is the id of the last event already shown. */
export function runEventsUrl(runId: string, after?: string): string {
  return apiUrl(runEventsPath(runId, after))
}

function runEventsPath(runId: string, after?: string): string {
  const query = after ? `?after=${encodeURIComponent(after)}` : ''
  return `/agent/platform/runs/${segment(runId)}/events${query}`
}

export interface StreamOptions {
  onEvent: (event: RunEvent) => void
  /** The reader's language: demo builds answer in it. */
  locale?: Locale
}

/**
 * Follows the run a POST opened with `Accept: text/event-stream` until its last event,
 * reopening the stream if it drops. A refusal (402 INSUFFICIENT_CREDITS, 409 BUSY,
 * 429 QUOTA_EXCEEDED) rejects with its ApiError before any event.
 */
export async function followStream(opened: Promise<Response>, options: StreamOptions): Promise<void> {
  await followRun(await opened, {
    onMessage: (message) => {
      if (RUN_EVENT_TYPES.has(message.type)) options.onEvent(message as RunEvent)
    },
    reopen: (runId, after) => apiClient.stream(runEventsPath(runId, after)),
  })
}

/**
 * Sends a message and follows its reply: text deltas, tool steps, or a report offer when
 * the message is a report subject. `requestId` makes a retried send store the message once.
 */
export function streamMessage(conversationId: string, content: string, requestId: string, options: StreamOptions): Promise<void> {
  if (DEMO_MODE) return demoSendMessage(conversationId, content, options)
  return followStream(
    apiClient.stream(`/agent/platform/conversations/${segment(conversationId)}/messages`, { method: 'POST', data: { content, request_id: requestId } }),
    options,
  )
}

/** GET /agent/platform/pricing: what replies, reports and lookups cost (backend docs/agent-credits.md). */
export interface Pricing {
  /** `credits`: charged step by step in points; `quota`: the monthly quota of PR #40. */
  billing: string
  /** A reply or follow-up, charged once it is delivered. */
  reply: number
  /** The last step of a report, charged once it is delivered. */
  report_analysis: number
  /** The most one reply or report spends. */
  task_cap: number
  estimates: Partial<Record<ReportKind, [number, number]>>
  /** Each research tool: its data source (`ask_tool`) and what a call costs. */
  tools: { name: string; title: string; ask_tool: string; credits: number }[]
}

export function getPricing(): Promise<Pricing> {
  return demoOr(demoPricing, () => apiClient.get<Pricing>('/agent/platform/pricing'))
}
