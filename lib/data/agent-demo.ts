import type { Pricing, RunEvent, RunEventData, RunEventType, StreamOptions } from '../api/agent'
import type { Locale } from '../i18n'
import type { ReportKind } from '../types'
import { TASK_POINT_CAP } from './plans'
import { REPORT_KINDS, REPORT_PLANS, classifyMessage, getFollowUps, reportFor, reportPoints, subjectOf } from './reports'

// Demo builds only (lib/demo.ts): the AI analyst played from the sample reports, as the same
// events the backend streams, so /ask runs one code path. A regex stands in for the agent
// deciding what a message is about, and every report is a sample labeled with the subject.

const STEP_MS = 650
const QUESTION = /怎么|如何|为什么|哪|吗|呢|\bhow\b|\bwhy\b|\bwhat\b|\bwhich\b|\bwhere\b|\bshould\b|\?|？/i

const FALLBACK: Record<Locale, string> = {
  en: 'In the live version the analyst answers from your reports and data, and can run one more lookup if needed. (Demo answer)',
  zh: '正式版里，分析师会基于你的报告和数据回答，必要时再多查一次数据。（演示回答）',
}

/** Conversations with a report, so a question about it gets the demo answer. Seeded chats have one. */
const reported = new Set<string>(REPORT_KINDS.map((kind) => `c-${kind}`))
const stops = new Map<string, () => void>()
let sequence = 0

class Stopped extends Error {}

interface DemoRun {
  emit: <K extends RunEventType>(type: K, data: RunEventData[K]) => void
  wait: (ms: number) => Promise<void>
  charge: (tool: string, credits: number) => void
}

async function play(conversationId: string, options: StreamOptions, body: (run: DemoRun) => Promise<void>): Promise<void> {
  const runId = `demo-run-${++sequence}`
  let stopped = false
  let interrupt = () => {}
  let charged = 0
  stops.set(runId, () => {
    stopped = true
    interrupt()
  })
  const run: DemoRun = {
    emit: (type, data) => options.onEvent({ id: String(++sequence), type, data } as RunEvent),
    wait: (ms) =>
      new Promise<void>((resolve, reject) => {
        if (stopped) return reject(new Stopped())
        const timer = setTimeout(resolve, ms)
        interrupt = () => {
          clearTimeout(timer)
          reject(new Stopped())
        }
      }),
    charge: (tool, credits) => {
      charged += credits
      run.emit('credits.charged', { tool, credits, credits_charged: charged })
    },
  }
  run.emit('run.created', { run_id: runId, conversation_id: conversationId })
  try {
    await run.wait(400)
    await body(run)
  } catch (error) {
    if (!(error instanceof Stopped)) throw error
    run.emit('run.canceled', { code: 'CANCELLED', credits_refunded: charged })
  } finally {
    stops.delete(runId)
  }
}

function followUpAnswer(question: string, locale: Locale): string | undefined {
  for (const kind of REPORT_KINDS) {
    const match = getFollowUps(kind, locale).find((f) => f.question === question)
    if (match) return match.answer
  }
}

/** A follow-up gets its written answer, a question about a report the demo answer, anything else a report offer. */
export function demoSendMessage(conversationId: string, content: string, options: StreamOptions): Promise<void> {
  const locale = options.locale ?? 'en'
  return play(conversationId, options, async (run) => {
    const known = followUpAnswer(content, locale)
    if (known || (reported.has(conversationId) && QUESTION.test(content) && classifyMessage(content) === 'keyword')) {
      const text = known ?? FALLBACK[locale]
      const characters = Array.from(text)
      for (let i = 0; i < characters.length; i += 24) {
        run.emit('message.delta', { delta: characters.slice(i, i + 24).join('') })
        await run.wait(60)
      }
      run.emit('message.completed', { content: text })
      run.emit('run.completed', { credits_charged: 1 })
      return
    }
    const kind = classifyMessage(content)
    run.emit('report.offer', { kind, subject: subjectOf(content, kind), estimate_credits: REPORT_PLANS[kind].estimate, kinds: REPORT_KINDS })
    run.emit('run.completed', { credits_charged: 0 })
  })
}

/** Walks the kind's planned steps, then answers with the sample report. */
export function demoStartReport(conversationId: string, kind: ReportKind, subject: string, options: StreamOptions): Promise<void> {
  const locale = options.locale ?? 'en'
  return play(conversationId, options, async (run) => {
    for (const [index, step] of REPORT_PLANS[kind].steps.entries()) {
      const id = `step-${index + 1}`
      run.emit('tool.started', { id, tool: step.tool, detail: subject })
      await run.wait(STEP_MS)
      if (step.points > 0) run.charge(step.tool, step.points)
      run.emit('tool.completed', { id, tool: step.tool })
    }
    const report = reportFor(subject, kind, locale)
    reported.add(conversationId)
    run.emit('report.completed', { report_id: report.id, report })
    run.emit('report.followup', { report_id: report.id, follow_ups: getFollowUps(kind, locale).map((f) => f.question) })
    run.emit('run.completed', { report_id: report.id, credits_charged: reportPoints(kind) })
  })
}

export function demoCancel(runId: string) {
  stops.get(runId)?.()
}

/** The prices the demo plans add up to. */
export function demoPricing(): Pricing {
  return {
    billing: 'credits',
    reply: 1,
    report_analysis: 2,
    task_cap: TASK_POINT_CAP,
    estimates: Object.fromEntries(REPORT_KINDS.map((kind) => [kind, REPORT_PLANS[kind].estimate])),
    tools: [],
  }
}
