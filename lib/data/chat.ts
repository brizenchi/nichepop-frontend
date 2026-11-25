import type { ReportOffer, RunEvent } from '../api/agent'
import type { Locale } from '../i18n'
import type { RadarReport, ReportKind } from '../types'
import { REPORT_KINDS, REPORT_PLANS, getFollowUps, reportFor, reportPoints } from './reports'

// A conversation as the Ask AI page shows it. Replies and reports are runs on the backend:
// their events (lib/api/agent.ts) are folded into the message they belong to by applyRunEvent.

/** One tool call of a run: which data it looked up and what that cost. */
export interface RunStep {
  id: string
  /** The backend tool, e.g. `serp_top`; components/chat/run-steps.tsx names it. */
  tool: string
  /** What it looked up, e.g. the keyword. */
  detail: string
  status: 'running' | 'done' | 'error'
  credits: number
}

/** Why a run did not deliver: a code of the backend (BUSY, INSUFFICIENT_CREDITS, TIMEOUT, …). */
export interface RunError {
  code: string
  /** INSUFFICIENT_CREDITS: what the work needs and what is left. */
  need?: number
  balance?: number
  /** BUSY: the reply still being written, and its conversation. */
  conversationId?: string
  runId?: string
}

export interface RunState {
  runId?: string
  status: 'running' | 'done' | 'failed' | 'canceled'
  steps: RunStep[]
  /** run.notice codes: ROUND_LIMIT, CREDIT_CAP, INSUFFICIENT_CREDITS. */
  notices: string[]
  /** Points the run was charged. */
  points: number
  /** Points given back because it failed or was stopped. */
  refunded: number
  error?: RunError
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  /** A user message taken from the starter prompts (seeded conversations). */
  | { id: string; role: 'user'; starter: ReportKind }
  /** The analyst's reply, written as it streams in. */
  | ({ id: string; role: 'ai'; type: 'text'; text: string; sources: string[] } & RunState)
  /** The message was a report subject: the analyst offers a report and what it costs. `kind` is the one picked. */
  | { id: string; role: 'ai'; type: 'offer'; offer: ReportOffer; kind: ReportKind }
  | ({ id: string; role: 'report'; kind: ReportKind; subject: string; reportId?: string; report?: RadarReport } & RunState)
  /** After a report: follow-up questions and the offer to add it to monitors. */
  | { id: string; role: 'ai'; type: 'followup'; kind: ReportKind; reportId: string; followUps: string[] }

export type RunMessage = Extract<ChatMessage, RunState>

export interface Conversation {
  id: string
  messages: ChatMessage[]
  updatedAt: number
  demo?: boolean
}

export const newMessageId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const newRun = (): RunState => ({ status: 'running', steps: [], notices: [], points: 0, refunded: 0 })

export const isRunMessage = (message: ChatMessage): message is RunMessage => 'status' in message

/** The tool without the MCP server Codex calls it through: `nichepop.serp_top` → `serp_top`. */
export const baseTool = (tool: string) => tool.slice(tool.lastIndexOf('.') + 1)

const DETAIL_KEYS = ['keyword', 'query', 'domain', 'site', 'url', 'competitor', 'topic', 'product_id', 'day']

/** A step's input as a reader would say it: the keyword or query, not the JSON. */
export function stepDetail(detail = ''): string {
  let text = detail.trim()
  if (text.startsWith('{')) {
    try {
      const input = JSON.parse(text) as Record<string, unknown>
      const key = DETAIL_KEYS.find((k) => typeof input[k] === 'string' || typeof input[k] === 'number')
      const value = key ? input[key] : Object.values(input).find((v) => typeof v === 'string')
      text = value === undefined ? '' : String(value)
    } catch {
      // Not JSON after all: shown as it came.
    }
  }
  return text.length > 80 ? `${text.slice(0, 79)}…` : text
}

function foldStep(run: RunState, event: Extract<RunEvent, { type: 'tool.started' | 'tool.completed' }>): RunStep[] {
  const { id, tool, detail, error } = event.data
  const done = event.type === 'tool.completed'
  const status: RunStep['status'] = !done ? 'running' : error ? 'error' : 'done'
  const index = id ? run.steps.findIndex((step) => step.id === id) : -1
  if (index < 0) return [...run.steps, { id: id || `step-${run.steps.length + 1}`, tool, detail: stepDetail(detail), status, credits: 0 }]
  return run.steps.map((step, i) => (i === index ? { ...step, status, detail: step.detail || stepDetail(detail) } : step))
}

/** A charge belongs to the latest call of its tool that has not been charged yet. */
function foldCharge(steps: RunStep[], tool: string, credits: number): RunStep[] {
  const name = baseTool(tool)
  for (let i = steps.length - 1; i >= 0; i--) {
    if (baseTool(steps[i].tool) === name && steps[i].credits === 0) return steps.map((step, j) => (j === i ? { ...step, credits } : step))
  }
  return steps
}

function foldRun(message: RunMessage, event: RunEvent): RunMessage {
  switch (event.type) {
    case 'run.created':
      return { ...message, runId: event.data.run_id }
    case 'tool.started':
    case 'tool.completed':
      return { ...message, steps: foldStep(message, event) }
    case 'credits.charged':
      return { ...message, steps: foldCharge(message.steps, event.data.tool, event.data.credits), points: event.data.credits_charged ?? message.points + event.data.credits }
    case 'credits.refunded':
      return { ...message, refunded: message.refunded + event.data.credits }
    case 'run.notice':
      return message.notices.includes(event.data.code) ? message : { ...message, notices: [...message.notices, event.data.code] }
    case 'run.completed':
      // A step the provider never reported as finished is finished with the run.
      return { ...message, status: 'done', points: event.data.credits_charged ?? message.points, steps: message.steps.map((step) => (step.status === 'running' ? { ...step, status: 'done' } : step)) }
    case 'run.failed':
    case 'run.canceled':
      return {
        ...message,
        status: event.type === 'run.failed' ? 'failed' : 'canceled',
        error: { code: event.data.code || (event.type === 'run.failed' ? 'PROVIDER_ERROR' : 'CANCELLED') },
        refunded: message.refunded + (event.data.credits_refunded ?? 0),
        steps: message.steps.map((step) => (step.status === 'running' ? { ...step, status: 'error' } : step)),
      }
  }
  if (message.role === 'ai') {
    switch (event.type) {
      case 'message.delta':
        return { ...message, text: message.text + event.data.delta }
      case 'message.completed':
        return { ...message, text: event.data.content }
      case 'source.added':
        return message.sources.includes(event.data.url) ? message : { ...message, sources: [...message.sources, event.data.url] }
    }
  }
  if (message.role === 'report' && event.type === 'report.completed') return { ...message, reportId: event.data.report_id, report: event.data.report }
  return message
}

/** Folds an event of a run into the message it belongs to (the reply or the report). */
export function applyRunEvent(messages: ChatMessage[], messageId: string, event: RunEvent): ChatMessage[] {
  const index = messages.findIndex((m) => m.id === messageId)
  const message = messages[index]
  if (!message || !isRunMessage(message)) return messages
  // A report subject is answered with an offer instead of text.
  if (event.type === 'report.offer' && message.role === 'ai') {
    return messages.map((m, i) => (i === index ? { id: m.id, role: 'ai', type: 'offer', offer: event.data, kind: event.data.kind } : m))
  }
  if (event.type === 'report.followup' && message.role === 'report') {
    const id = `${message.id}-followup`
    if (messages.some((m) => m.id === id)) return messages
    const followUp: ChatMessage = { id, role: 'ai', type: 'followup', kind: message.kind, reportId: event.data.report_id, followUps: event.data.follow_ups ?? [] }
    return [...messages.slice(0, index + 1), followUp, ...messages.slice(index + 1)]
  }
  const next = foldRun(message, event)
  return next === message ? messages : messages.map((m, i) => (i === index ? next : m))
}

/** Ends a run that never got going: refused (not enough points, busy) or its stream was lost. */
export function failRun(messages: ChatMessage[], messageId: string, error: RunError): ChatMessage[] {
  return messages.map((m) => (m.id === messageId && isRunMessage(m) && m.status === 'running' ? { ...m, status: 'failed', error } : m))
}

/* ---------- Demo conversations ---------- */

const SEEDS: { kind: ReportKind; query: string; hoursAgo: number }[] = [
  { kind: 'keyword', query: 'driftbound codes', hoursAgo: 2 },
  { kind: 'product', query: 'pagepulse.dev', hoursAgo: 20 },
  { kind: 'idea', query: '', hoursAgo: 30 },
  { kind: 'market', query: '', hoursAgo: 50 },
]

/** Demo builds: one finished conversation per report kind, so the chat never starts empty-handed. */
export function getSeedConversations(locale: Locale = 'en', now = Date.UTC(2026, 9, 18, 12)): Conversation[] {
  return SEEDS.map(({ kind, query, hoursAgo }) => {
    const report = reportFor(query, kind, locale)
    const points = reportPoints(kind)
    return {
      id: `c-${kind}`,
      demo: true,
      updatedAt: now - hoursAgo * 3_600_000,
      messages: [
        { id: `c-${kind}-1`, role: 'user', starter: kind },
        { id: `c-${kind}-2`, role: 'ai', type: 'offer', kind, offer: { kind, subject: report.query, estimate_credits: REPORT_PLANS[kind].estimate, kinds: REPORT_KINDS } },
        { id: `c-${kind}-3`, role: 'report', kind, subject: report.query, reportId: report.id, report, ...newRun(), status: 'done', points },
        { id: `c-${kind}-4`, role: 'ai', type: 'followup', kind, reportId: report.id, followUps: getFollowUps(kind, locale).map((f) => f.question) },
      ],
    }
  })
}
