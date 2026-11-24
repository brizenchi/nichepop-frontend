"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, Bot, Check, Copy, Eye, Lightbulb, Loader2, Map, Package, Search, Share2, Sparkles, Zap, type LucideIcon } from "lucide-react"
import { MonitorAddCard } from "@/components/chat/monitor-add-card"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { usePlan, usePoints } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { isHighIntent } from "@/components/radar/mention-card"
import { ReportView } from "@/components/radar/report-view"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { useMonitorFeed, useMonitors } from "@/hooks/use-monitors"
import { useResource } from "@/hooks/use-resource"
import { useChatStore } from "@/components/workspace/chat-store"
import { listNiches } from "@/lib/api/niches"
import { newMessageId, type ChatMessage } from "@/lib/data/chat"
import { monitorDraftFromReport } from "@/lib/data/monitors"
import { TASK_POINT_CAP } from "@/lib/data/plans"
import { PUBLIC_DELAY_HOURS } from "@/lib/data/radar"
import { REPORT_KINDS, REPORT_PLANS, classifyMessage, getFollowUps, reportFor, reportPoints, subjectOf } from "@/lib/data/reports"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import type { Monitor, RadarReport, ReportKind } from "@/lib/types"

const KIND_ICONS: Record<ReportKind, LucideIcon> = { keyword: Search, idea: Lightbulb, product: Package, market: Map }
const QUESTION = /怎么|如何|为什么|哪|吗|呢|\bhow\b|\bwhy\b|\bwhat\b|\bwhich\b|\bwhere\b|\bshould\b|\?|？/i

export default function AskPage() {
  return (
    <Suspense>
      <ChatWorkspace />
    </Suspense>
  )
}

/** Chat with the analyst. Reports are suggestions inside the conversation; anything can be added to monitors from here. */
function ChatWorkspace() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useT()
  const ta = t.ask
  const { limits } = usePlan()
  const { gate, dialog } = useAuthGate()
  const { conversations, updateConversation, spent, spend } = useChatStore()

  const [draft, setDraft] = useState("")
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [showPricing, setShowPricing] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const handledQuery = useRef<string | null>(null)

  // The open chat lives in the URL (?c=), so the sidebar and links can point at it.
  const activeId = searchParams.get("c")
  const active = conversations.find((c) => c.id === activeId) ?? null
  // Answers here are still demos (frontend#10); a signed-in reader sees their real balance.
  const balance = usePoints(spent).balance ?? limits.points
  const running = active?.messages.some((m) => m.role === "report" && m.status === "running") ?? false

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [active?.messages.length, progress])

  const lastReportKind = (messages: ChatMessage[]) => [...messages].reverse().find((m): m is Extract<ChatMessage, { role: "report" }> => m.role === "report")?.kind

  /** The analyst's reply to a message: a follow-up answer, a fallback, or a report suggestion. Returns messages and the points spent. */
  const reply = useCallback(
    (value: string, history: ChatMessage[]): { messages: ChatMessage[]; cost: number } => {
      const reportKind = lastReportKind(history)
      if (reportKind) {
        const index = getFollowUps(reportKind, locale).findIndex((f) => f.question === value)
        if (index >= 0) return { messages: [{ id: newMessageId(), role: "ai", type: "answer", kind: reportKind, index }], cost: 1 }
        if (QUESTION.test(value) && classifyMessage(value) === "keyword") return { messages: [{ id: newMessageId(), role: "ai", type: "fallback" }], cost: 1 }
      }
      const kind = classifyMessage(value)
      return { messages: [{ id: newMessageId(), role: "ai", type: "intro", kind, query: subjectOf(value, kind) }], cost: 0 }
    },
    [locale],
  )

  const send = useCallback(
    (text: string, conversationId: string | null) => {
      const value = text.trim()
      // Answers here are demo answers; real builds wait for the analyst (frontend#10).
      if (!value || !DEMO_MODE) return
      const id = conversationId ?? `c-${Date.now()}`
      const history = conversations.find((c) => c.id === conversationId)?.messages ?? []
      const answer = reply(value, history)
      if (answer.cost) spend(answer.cost)
      const user: ChatMessage = { id: newMessageId(), role: "user", text: value }
      updateConversation(id, (messages) => [...messages, user, ...answer.messages])
      setDraft("")
      if (id !== activeId) router.replace(`/ask?c=${id}`, { scroll: false })
    },
    [activeId, conversations, reply, router, spend, updateConversation],
  )

  // Links from the homepage box, Trends ("value report") and onboarding open a new chat with the question already asked.
  useEffect(() => {
    const q = searchParams.get("q")
    if (q && handledQuery.current !== q) {
      handledQuery.current = q
      if (DEMO_MODE) send(q, null)
      else setDraft(q)
    }
  }, [searchParams, send])

  const switchKind = (conversationId: string, messageId: string, kind: ReportKind) =>
    updateConversation(conversationId, (messages) => messages.map((m) => (m.id === messageId && m.role === "ai" && m.type === "intro" ? { ...m, kind } : m)))

  const runReport = (conversationId: string, intro: Extract<ChatMessage, { type: "intro" }>) => {
    const reportId = newMessageId()
    const steps = REPORT_PLANS[intro.kind].steps
    updateConversation(conversationId, (messages) => [...messages, { id: reportId, role: "report", kind: intro.kind, query: intro.query, status: "running", points: 0 }])
    timers.current.push(
      ...steps.map((_, i) =>
        setTimeout(() => {
          setProgress((prev) => ({ ...prev, [reportId]: i + 1 }))
          if (i === steps.length - 1) {
            const points = reportPoints(intro.kind)
            spend(points)
            updateConversation(conversationId, (messages) => [
              ...messages.map((m) => (m.id === reportId && m.role === "report" ? { ...m, status: "done" as const, points } : m)),
              { id: newMessageId(), role: "ai", type: "after", kind: intro.kind, query: intro.query },
            ])
          }
        }, 650 * (i + 1)),
      ),
    )
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-4 pt-6 sm:px-6 lg:min-h-dvh lg:pt-10">
      <div className="flex-1">
        {!active ? (
          <Welcome onSend={(text) => (DEMO_MODE ? send(text, null) : setDraft(text))} />
        ) : (
          <div className="space-y-5 pb-6">
            {active.messages.map((message, index) => (
              <MessageView
                key={message.id}
                message={message}
                progress={progress[message.id] ?? 0}
                answered={active.messages.slice(index + 1).some((m) => m.role === "report")}
                latestReport={message.id === [...active.messages].reverse().find((m) => m.role === "report")?.id}
                balance={balance}
                onSwitchKind={(kind) => switchKind(active.id, message.id, kind)}
                onRun={(intro) => gate("ask", () => runReport(active.id, intro))}
                onAsk={(text) => send(text, active.id)}
                onUpgrade={() => setShowPricing(true)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(draft, active?.id ?? null)
        }}
        className="sticky bottom-14 z-30 -mx-4 bg-gradient-to-t from-radar-bg from-70% to-transparent px-4 pb-3 pt-4 sm:-mx-6 sm:px-6 lg:bottom-0 lg:pb-6"
      >
        <div className={cn(cardStyles, "flex items-center gap-2 p-1.5")}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={ta.placeholder}
            aria-label={ta.inputLabel}
            disabled={running}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-faint"
          />
          <button type="submit" disabled={!draft.trim() || running || !DEMO_MODE} className={cn(buttonStyles.primary, "h-10 w-10 shrink-0 px-0")} aria-label={ta.send}>
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{DEMO_MODE ? ta.costHint(balance) : t.states.askSoon}</p>
      </form>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={ta.balanceLabel} />
      {dialog}
    </main>
  )
}

/** Empty chat: today's highlights from Trends and monitors, plus a starter per report kind. */
function Welcome({ onSend }: { onSend: (text: string) => void }) {
  const locale = useLocale()
  const t = useT().ask
  const { monitors } = useMonitors()
  const loadWords = useCallback(() => listNiches({ locale }), [locale])
  // Before the trend library is live (backend #16) there is simply no highlight.
  const words = useResource(loadWords).data?.items ?? []
  const freshest = words.filter((w) => w.verdict === "build" && w.firstSeenHoursAgo < PUBLIC_DELAY_HOURS).sort((a, b) => a.firstSeenHoursAgo - b.firstSeenHoursAgo)[0]

  return (
    <div className="py-6 sm:py-10">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Bot className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{t.welcomeTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.welcomeText}</p>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.todayTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {freshest && (
          <button
            onClick={() => onSend(t.todayTrend(freshest.keyword, freshest.firstSeenHoursAgo))}
            className={cn(cardStyles, "flex items-start gap-3 p-4 text-left transition-colors hover:border-primary/40 cursor-pointer")}
          >
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-sm text-foreground">{t.todayTrend(freshest.keyword, freshest.firstSeenHoursAgo)}</span>
          </button>
        )}
        {monitors.slice(0, 3).map((monitor) => (
          <MonitorAlert key={monitor.id} monitor={monitor} />
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.startersTitle}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {REPORT_KINDS.map((kind) => {
          const Icon = KIND_ICONS[kind]
          return (
            <button
              key={kind}
              onClick={() => onSend(t.starters[kind])}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-body transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {t.starters[kind]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** High-intent posts a monitor found, when it found any. */
function MonitorAlert({ monitor }: { monitor: Monitor }) {
  const t = useT().ask
  const { data: feed } = useMonitorFeed(monitor.id)
  const count = feed?.mentions.filter(isHighIntent).length ?? 0
  if (count === 0) return null
  return (
    <Link href={`/monitors/${monitor.id}`} className={cn(cardStyles, "flex items-start gap-3 p-4 transition-colors hover:border-primary/40")}>
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm text-foreground">{t.todayPosts(count, monitor.name)}</span>
    </Link>
  )
}

interface MessageViewProps {
  message: ChatMessage
  progress: number
  /** The report this intro suggested has already been generated. */
  answered: boolean
  latestReport: boolean
  balance: number
  onSwitchKind: (kind: ReportKind) => void
  onRun: (intro: Extract<ChatMessage, { type: "intro" }>) => void
  onAsk: (text: string) => void
  onUpgrade: () => void
}

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
    </div>
  )
}

function MessageView({ message, progress, answered, latestReport, balance, onSwitchKind, onRun, onAsk, onUpgrade }: MessageViewProps) {
  const locale = useLocale()
  const t = useT()
  const ta = t.ask
  const [monitoring, setMonitoring] = useState(false)
  const { limits } = usePlan()

  if (message.role === "user") {
    return <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{"starter" in message ? ta.starters[message.starter] : message.text}</p>
  }

  if (message.role === "report") {
    const report = reportFor(message.query, message.kind, locale)
    if (message.status === "running") return <RunCard kind={message.kind} query={report.query} progress={progress} />
    return (
      <div className="space-y-2">
        <div className={cn(cardStyles, "p-5 sm:p-6")}>
          <ReportView report={report} collapsible defaultExpanded={latestReport} />
        </div>
        <ReportActions report={report} points={message.points} />
      </div>
    )
  }

  if (message.type === "intro") {
    const report = reportFor(message.query, message.kind, locale)
    const plan = REPORT_PLANS[message.kind]
    const kindCopy = t.reports.kinds[message.kind]
    const enough = balance >= plan.estimate[1]
    return (
      <AiBubble>
        <p className="text-sm leading-relaxed text-foreground">{ta.intro[message.kind](message.query || report.query)}</p>
        {!answered && (
          <div className={cn(cardStyles, "p-4")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{kindCopy.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ta.estimate(plan.estimate[0], plan.estimate[1])} · {ta.cap(TASK_POINT_CAP)} · {ta.noChargeOnFail}
                </p>
              </div>
              {enough ? (
                <button onClick={() => onRun(message)} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {ta.generate(kindCopy.label)}
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-warning">
                    {ta.notEnough} {ta.balance(balance)}
                  </span>
                  <button onClick={onUpgrade} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
                    {ta.getPoints}
                  </button>
                </div>
              )}
            </div>
            <ol className="mt-3 space-y-1 border-t border-border pt-3">
              {plan.steps.map((step, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-body">{kindCopy.steps[i]}</span>
                  <span className="shrink-0 text-faint">
                    {t.tools[step.tool]} · {step.points === 0 ? t.tools.calls(step.calls) : `+${step.points}`}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {ta.switchTo}
              {REPORT_KINDS.filter((kind) => kind !== message.kind).map((kind) => (
                <button key={kind} onClick={() => onSwitchKind(kind)} className="rounded-full border border-border bg-card px-2 py-0.5 text-body hover:border-primary/40 hover:text-primary cursor-pointer">
                  {t.reports.kinds[kind].title}
                </button>
              ))}
            </div>
          </div>
        )}
      </AiBubble>
    )
  }

  if (message.type === "answer") {
    const followUp = getFollowUps(message.kind, locale)[message.index]
    return (
      <AiBubble>
        <p className="text-sm leading-relaxed text-foreground">{followUp?.answer}</p>
      </AiBubble>
    )
  }

  if (message.type === "fallback") {
    return (
      <AiBubble>
        <p className="text-sm leading-relaxed text-foreground">{ta.fallback}</p>
      </AiBubble>
    )
  }

  // After a report: offer to monitor it, and suggest follow-ups.
  const report = reportFor(message.query, message.kind, locale)
  return (
    <AiBubble>
      <p className="text-sm leading-relaxed text-foreground">{ta.after[message.kind]}</p>
      {monitoring ? (
        <MonitorAddCard draft={monitorDraftFromReport(report, limits.xPosts > 0)} onCancel={() => setMonitoring(false)} onUpgrade={onUpgrade} />
      ) : (
        <button onClick={() => setMonitoring(true)} className={cn(buttonStyles.secondary, "h-9")}>
          <Eye className="h-3.5 w-3.5 text-primary" />
          {ta.addMonitor}
        </button>
      )}
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">
          {ta.followUps} · {ta.followUpCost}
        </p>
        <div className="flex flex-wrap gap-2">
          {getFollowUps(message.kind, locale).map((f) => (
            <button
              key={f.question}
              onClick={() => onAsk(f.question)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-body transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
            >
              {f.question}
            </button>
          ))}
        </div>
      </div>
    </AiBubble>
  )
}

/** A report while it runs: each step with the data it pulls and the points it spends. */
function RunCard({ kind, query, progress }: { kind: ReportKind; query: string; progress: number }) {
  const t = useT()
  const plan = REPORT_PLANS[kind]
  const used = plan.steps.slice(0, progress).reduce((sum, step) => sum + step.points, 0)
  return (
    <div className={cn(cardStyles, "p-5")}>
      <p className="text-sm font-semibold text-foreground">
        {t.reports.kinds[kind].title} · <span className="text-primary">{query}</span>
      </p>
      <ol className="mt-4 space-y-3">
        {plan.steps.map((step, i) => {
          const state = i < progress ? "done" : i === progress ? "active" : "todo"
          return (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  state === "done" ? "bg-success text-white" : state === "active" ? "bg-primary-soft text-primary" : "bg-subtle text-muted-foreground ring-1 ring-border",
                )}
              >
                {state === "done" ? <Check className="h-3 w-3" /> : state === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block", state === "todo" ? "text-muted-foreground" : "text-body")}>{t.reports.kinds[kind].steps[i]}</span>
                <span className="mt-0.5 block text-xs text-faint">
                  {t.tools[step.tool]} {t.tools.calls(step.calls)}
                </span>
              </span>
              <span className={cn("shrink-0 text-xs tabular-nums", state === "done" ? "font-medium text-foreground" : "text-muted-foreground")}>
                {step.points === 0 ? t.ask.stepFree : `+${step.points}`}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 border-t border-border pt-3 text-right text-xs font-medium tabular-nums text-foreground">{t.ask.spentSoFar(used)}</p>
    </div>
  )
}

function ReportActions({ report, points }: { report: RadarReport; points: number }) {
  const t = useT().ask
  const locale = useLocale()
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${report.id}${locale === "zh" ? "?lang=zh" : ""}` : ""
  const fresh = report.kind === "keyword" && report.wordAgeHours < PUBLIC_DELAY_HOURS

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
        {points > 0 && <span className="tabular-nums">{t.spent(points)}</span>}
        <button onClick={() => setSharing((v) => !v)} aria-expanded={sharing} className="inline-flex items-center gap-1 font-medium text-body hover:text-foreground cursor-pointer">
          <Share2 className="h-3.5 w-3.5" />
          {t.share}
        </button>
      </div>
      {sharing && (
        <div className={cn(cardStyles, "space-y-2 p-3")}>
          <div className="flex gap-2">
            <input readOnly value={shareUrl} aria-label={t.shareLink} className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-subtle px-3 text-sm text-body" />
            <button onClick={copy} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t.shareNote}
            {fresh && report.kind === "keyword" && t.freshNote(PUBLIC_DELAY_HOURS, PUBLIC_DELAY_HOURS - report.wordAgeHours)}
          </p>
        </div>
      )}
    </div>
  )
}

