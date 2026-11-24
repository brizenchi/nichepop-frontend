/**
 * The AI analyst: backend docs/agent-platform.md (`/api/v1/agent/platform`). A message
 * starts a run; the run's events (RunEventType) stream over SSE from runEventsUrl, and a
 * page that lost the stream picks up with `?after=<event id>`. frontend#10 wires /ask to it.
 */

import { liveOnly } from '../demo'
import { apiUrl } from '../env'
import { apiClient, segment } from './client'

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

/** Events of a run, in order (docs/agent-platform.md). */
export type RunEventType =
  | 'run.created'
  | 'run.started'
  | 'tool.started'
  | 'tool.completed'
  | 'run.notice'
  | 'credits.charged'
  | 'credits.refunded'
  | 'monitor_draft'
  | 'subscription_draft'
  | 'message.delta'
  | 'source.added'
  | 'message.completed'
  | 'report.offer'
  | 'report.completed'
  | 'report.followup'
  | 'suggestion.report'
  | 'run.completed'
  | 'run.failed'
  | 'run.canceled'

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
  return liveOnly(() => apiClient.postBare<Conversation>('/agent/platform/conversations', { title }))
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

export function cancelRun(runId: string): Promise<void> {
  return liveOnly(async () => {
    await apiClient.post(`/agent/platform/runs/${segment(runId)}/cancel`)
  })
}

/** The SSE stream of a run; `after` is the id of the last event already shown. */
export function runEventsUrl(runId: string, after?: string): string {
  const query = after ? `?after=${encodeURIComponent(after)}` : ''
  return apiUrl(`/agent/platform/runs/${segment(runId)}/events${query}`)
}
