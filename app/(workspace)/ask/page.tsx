"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, Bot, Check, Copy, ExternalLink, Eye, Lightbulb, Loader2, Map, Package, RotateCcw, Search, Share2, Sparkles, Square, Zap, type LucideIcon } from "lucide-react"
import { Markdown } from "@/components/chat/markdown"
import { MonitorAddCard } from "@/components/chat/monitor-add-card"
import { RunCard, RunNotices, StepList, usePricing } from "@/components/chat/run-steps"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { usePlan, usePoints } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { isHighIntent } from "@/components/radar/mention-card"
import { ReportView } from "@/components/radar/report-view"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { useAccount } from "@/hooks/use-account"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { useMonitorFeed, useMonitors } from "@/hooks/use-monitors"
import { useResource } from "@/hooks/use-resource"
import { useChatStore } from "@/components/workspace/chat-store"
import { ApiError } from "@/lib/api"
import { cancelRun, createConversation, streamMessage, type RunEvent, type StreamOptions } from "@/lib/api/agent"
import { errorCode } from "@/lib/api/client"
import { listNiches } from "@/lib/api/niches"
import { shareReport, streamReport } from "@/lib/api/reports"
import { StreamLostError } from "@/lib/api/run-stream"
import { applyRunEvent, failRun, isRunMessage, newMessageId, newRun, type ChatMessage, type RunError, type RunMessage } from "@/lib/data/chat"
import { monitorDraftFromReport } from "@/lib/data/monitors"
import { PUBLIC_DELAY_HOURS } from "@/lib/data/radar"
import { REPORT_KINDS, REPORT_PLANS } from "@/lib/data/reports"
import { cn } from "@/lib/utils"
import { isDomain } from "@/lib/utils/domain"
import type { Monitor, RadarReport, ReportKind } from "@/lib/types"

const KIND_ICONS: Record<ReportKind, LucideIcon> = { keyword: Search, idea: Lightbulb, product: Package, market: Map }

type OfferMessage = Extract<ChatMessage, { type: "offer" }>
type TextMessage = Extract<ChatMessage, { type: "text" }>
type ReportMessage = Extract<ChatMessage, { role: "report" }>
type FollowUpMessage = Extract<ChatMessage, { type: "followup" }>

const requestId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Why a send or a report did not start, or its stream was lost. */
function runError(error: unknown): RunError {
  if (error instanceof StreamLostError) return { code: "STREAM_LOST" }
  const code = errorCode(error)
  const data = error instanceof ApiError ? (error.data as { need?: number; balance?: number; conversation_id?: string; run_id?: string } | null) : null
  if (code === "INSUFFICIENT_CREDITS") return { code, need: data?.need, balance: data?.balance }
  if (code === "BUSY") return { code, conversationId: data?.conversation_id, runId: data?.run_id }
  return { code: code || "generic" }
}

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
  const { ready, refresh } = useAccount()
  const { gate, dialog } = useAuthGate()
  const { conversations, updateConversation, spent, spend } = useChatStore()
  const pricing = usePricing()

  const [draft, setDraft] = useState("")
  const [composerError, setComposerError] = useState<RunError | null>(null)
  const [showPricing, setShowPricing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const handledQuery = useRef<string | null>(null)
  const starting = useRef(false)

  // The open chat lives in the URL (?c=), so the sidebar and links can point at it.
  const activeId = searchParams.get("c")
  const active = conversations.find((c) => c.id === activeId) ?? null
  // The ledger balance from the server (GET /usage), the same number /credits shows.
  const { balance } = usePoints(spent)
  const runningMessage = active?.messages.find((m): m is RunMessage => isRunMessage(m) && m.status === "running")
  const cap = pricing?.task_cap ?? null

  // Follow the conversation as it grows: new messages, steps, text, and how a run ended.
  const tail = active?.messages.at(-1)
  const progress = `${active?.messages.length ?? 0}:${tail && isRunMessage(tail) ? `${tail.status}:${tail.steps.length}` : ""}:${tail?.role === "ai" && tail.type === "text" ? tail.text.length : 0}`
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [progress])

  /** Follows a run into the message it writes, then reloads the balance from the server. */
  const follow = useCallback(
    async (conversationId: string, messageId: string, start: (options: StreamOptions) => Promise<void>) => {
      let last = ""
      const onEvent = (event: RunEvent) => {
        last = event.type
        updateConversation(conversationId, (messages) => applyRunEvent(messages, messageId, event))
        if (event.type === "run.completed" && event.data.credits_charged) spend(event.data.credits_charged)
      }
      try {
        await start({ onEvent, locale })
      } catch (error) {
        updateConversation(conversationId, (messages) => failRun(messages, messageId, runError(error)))
      } finally {
        void refresh()
        // A lookup still running when a run stops is charged and refunded after its last event; read the balance again.
        if (last === "run.canceled" || last === "run.failed") setTimeout(() => void refresh(), 15_000)
      }
    },
    [locale, refresh, spend, updateConversation],
  )

  const send = useCallback(
    async (text: string, conversationId: string | null) => {
      const value = text.trim()
      if (!value || starting.current) return
      starting.current = true
      setComposerError(null)
      setDraft("")
      let id = conversationId
      try {
        id ??= (await createConversation()).id
      } catch (error) {
        setDraft(value)
        setComposerError(runError(error))
        starting.current = false
        return
      }
      const replyId = newMessageId()
      updateConversation(id, (messages) => [...messages, { id: newMessageId(), role: "user", text: value }, { id: replyId, role: "ai", type: "text", text: "", sources: [], ...newRun() }])
      starting.current = false
      if (id !== activeId) router.replace(`/ask?c=${id}`, { scroll: false })
      const conversation = id
      await follow(conversation, replyId, (options) => streamMessage(conversation, value, requestId(), options))
    },
    [activeId, follow, router, updateConversation],
  )

  const ask = useCallback((text: string, conversationId: string | null) => gate("ask", () => void send(text, conversationId)), [gate, send])

  // Links from the homepage box, Trends, shared reports and onboarding open a new chat with the question already asked.
  useEffect(() => {
    const q = searchParams.get("q")
    if (!q || !ready || handledQuery.current === q) return
    handledQuery.current = q
    // Kept in the box if the reader closes the sign-in dialog.
    setDraft(q)
    ask(q, null)
  }, [ask, ready, searchParams])

  const generate = (conversationId: string, kind: ReportKind, subject: string) =>
    gate("ask", () => {
      const reportId = newMessageId()
      updateConversation(conversationId, (messages) => [...messages, { id: reportId, role: "report", kind, subject, ...newRun() }])
      void follow(conversationId, reportId, (options) => streamReport(conversationId, kind, subject, requestId(), options))
    })

  const switchKind = (conversationId: string, messageId: string, kind: ReportKind) =>
    updateConversation(conversationId, (messages) => messages.map((m) => (m.id === messageId && m.role === "ai" && m.type === "offer" ? { ...m, kind } : m)))

  const stop = async (runId?: string) => {
    if (!runId) return
    try {
      await cancelRun(runId)
    } catch (error) {
      setComposerError(runError(error))
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-4 pt-6 sm:px-6 lg:min-h-dvh lg:pt-10">
      <div className="flex-1">
        {!active ? (
          <Welcome onSend={(text) => ask(text, null)} />
        ) : (
          <div className="space-y-5 pb-6">
            {active.messages.map((message, index) => (
              <MessageView
                key={message.id}
                message={message}
                messages={active.messages}
                answered={active.messages.slice(index + 1).some((m) => m.role === "report")}
                latestReport={message.id === [...active.messages].reverse().find((m) => m.role === "report")?.id}
                balance={balance}
                cap={cap}
                estimates={pricing?.estimates}
                onSwitchKind={(kind) => switchKind(active.id, message.id, kind)}
                onGenerate={(kind, subject) => generate(active.id, kind, subject)}
                onAsk={(text) => ask(text, active.id)}
                onStop={stop}
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
          ask(draft, active?.id ?? null)
        }}
        className="sticky bottom-14 z-30 -mx-4 bg-gradient-to-t from-radar-bg from-70% to-transparent px-4 pb-3 pt-4 sm:-mx-6 sm:px-6 lg:bottom-0 lg:pb-6"
      >
        <div className={cn(cardStyles, "flex items-center gap-2 p-1.5")}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={ta.placeholder}
            aria-label={ta.inputLabel}
            disabled={!!runningMessage}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-faint"
          />
          {runningMessage ? (
            <button
              type="button"
              onClick={() => void stop(runningMessage.runId)}
              disabled={!runningMessage.runId}
              className={cn(buttonStyles.secondary, "h-10 w-10 shrink-0 px-0")}
              aria-label={ta.stop}
              title={ta.stop}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim()} className={cn(buttonStyles.primary, "h-10 w-10 shrink-0 px-0")} aria-label={ta.send}>
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        {composerError ? (
          <p className="mt-1.5 px-1 text-[11px] text-destructive" role="alert">
            {problemText(ta, composerError)}
          </p>
        ) : (
          <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{ta.costHint(balance, pricing?.reply ?? 1)}</p>
        )}
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

type AskCopy = ReturnType<typeof useT>["ask"]

/** What went wrong, in the reader's words. */
function problemText(ta: AskCopy, error: RunError) {
  const copy = ta.errors[error.code] ?? ta.errors.generic
  if (typeof copy === "function") return copy(error.need ?? 0, error.balance ?? 0)
  return copy
}

interface MessageViewProps {
  message: ChatMessage
  /** The whole conversation, for the report a follow-up belongs to. */
  messages: ChatMessage[]
  /** The report this offer suggested has already been started. */
  answered: boolean
  latestReport: boolean
  balance: number | null
  cap: number | null
  estimates?: Partial<Record<ReportKind, [number, number]>>
  onSwitchKind: (kind: ReportKind) => void
  onGenerate: (kind: ReportKind, subject: string) => void
  onAsk: (text: string) => void
  onStop: (runId?: string) => void
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

function MessageView(props: MessageViewProps) {
  const { message, messages } = props
  const ta = useT().ask

  if (message.role === "user") {
    return <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{"starter" in message ? ta.starters[message.starter] : message.text}</p>
  }
  if (message.role === "report") return <ReportMessageView {...props} message={message} />
  if (message.type === "offer") return <OfferCard {...props} message={message} />
  if (message.type === "followup") {
    const report = messages.find((m): m is ReportMessage => m.role === "report" && m.reportId === message.reportId)?.report
    return <FollowUpView message={message} report={report} onAsk={props.onAsk} onUpgrade={props.onUpgrade} />
  }
  // A reply: retrying sends the question it answered again.
  const index = messages.indexOf(message)
  const question = messages.slice(0, index).reverse().find((m) => m.role === "user")
  const retry = question && "text" in question ? () => props.onAsk(question.text) : undefined
  return <ReplyView message={message} cap={props.cap} onRetry={retry} onStop={props.onStop} onUpgrade={props.onUpgrade} />
}

/** The analyst offers a report for a subject: what it runs, what it costs, and the other kinds it could be. */
function OfferCard({ message, answered, balance, cap, estimates, onSwitchKind, onGenerate, onUpgrade }: MessageViewProps & { message: OfferMessage }) {
  const t = useT()
  const ta = t.ask
  const { offer, kind } = message
  const kindCopy = t.reports.kinds[kind]
  // The offer prices the kind it suggested; the others come from GET /pricing.
  const estimate = kind === offer.kind ? offer.estimate_credits : estimates?.[kind]
  // Starting needs the top of the estimate in the balance; the server checks it again.
  const enough = balance === null || !estimate || balance >= estimate[1]
  const others = (offer.kinds.length ? offer.kinds : REPORT_KINDS).filter((k) => k !== kind && (k !== "product" || isDomain(offer.subject)))
  return (
    <AiBubble>
      <p className="text-sm leading-relaxed text-foreground">{ta.intro[kind](offer.subject)}</p>
      {!answered && (
        <div className={cn(cardStyles, "p-4")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{kindCopy.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[estimate && ta.estimate(estimate[0], estimate[1]), cap !== null && ta.cap(cap), ta.noChargeOnFail].filter(Boolean).join(" · ")}
              </p>
            </div>
            {enough ? (
              <button onClick={() => onGenerate(kind, offer.subject)} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
                <Sparkles className="h-3.5 w-3.5" />
                {ta.generate(kindCopy.label)}
              </button>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <span className="text-xs text-warning">
                  {ta.notEnough} {ta.balance(balance ?? 0)}
                </span>
                <button onClick={onUpgrade} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
                  {ta.getPoints}
                </button>
              </div>
            )}
          </div>
          <ol className="mt-3 space-y-1 border-t border-border pt-3">
            {REPORT_PLANS[kind].steps.map((step, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-body">{kindCopy.steps[i]}</span>
                <span className="shrink-0 text-faint">{t.tools[step.tool]}</span>
              </li>
            ))}
          </ol>
          {others.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {ta.switchTo}
              {others.map((other) => (
                <button key={other} onClick={() => onSwitchKind(other)} className="rounded-full border border-border bg-card px-2 py-0.5 text-body hover:border-primary/40 hover:text-primary cursor-pointer">
                  {t.reports.kinds[other].title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </AiBubble>
  )
}

/** Why a run ended without delivering, what was given back, and what the reader can do about it. */
function RunProblem({ message, onRetry, onStop, onUpgrade }: { message: RunMessage; onRetry?: () => void; onStop: (runId?: string) => void; onUpgrade: () => void }) {
  const ta = useT().ask
  const { conversations } = useChatStore()
  const error = message.error ?? { code: "generic" }
  const refused = ["INSUFFICIENT_CREDITS", "BUSY", "QUOTA_EXCEEDED"].includes(error.code)
  const canceled = message.status === "canceled"
  // The busy reply's chat can be opened when this visit has it (older chats come with #11).
  const busyChat = error.code === "BUSY" && conversations.some((c) => c.id === error.conversationId)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-subtle px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3">
      <p className="min-w-0 flex-1 text-body">
        {canceled ? ta.stopped : problemText(ta, error)}
        {!refused && <span className="ml-1 text-muted-foreground">{ta.refunded(message.refunded)}</span>}
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {error.code === "INSUFFICIENT_CREDITS" && (
          <button onClick={onUpgrade} className={cn(buttonStyles.primary, "h-8")}>
            {ta.getPoints}
          </button>
        )}
        {busyChat && (
          <Link href={`/ask?c=${error.conversationId}`} className="inline-flex items-center gap-1 px-1 text-xs font-medium text-primary hover:text-primary-hover">
            {ta.openBusy}
          </Link>
        )}
        {error.code === "BUSY" && error.runId && (
          <button onClick={() => onStop(error.runId)} className={cn(buttonStyles.secondary, "h-8")}>
            <Square className="h-3 w-3 fill-current" />
            {ta.stopBusy}
          </button>
        )}
        {onRetry && !["INSUFFICIENT_CREDITS", "QUOTA_EXCEEDED"].includes(error.code) && (
          <button onClick={onRetry} className={cn(buttonStyles.secondary, "h-8")}>
            <RotateCcw className="h-3.5 w-3.5" />
            {ta.retry}
          </button>
        )}
      </div>
    </div>
  )
}

/** A reply: its text as it streams in, the lookups behind it and their sources. */
function ReplyView({ message, cap, onRetry, onStop, onUpgrade }: { message: TextMessage; cap: number | null; onRetry?: () => void; onStop: (runId?: string) => void; onUpgrade: () => void }) {
  const ta = useT().ask
  const running = message.status === "running"
  return (
    <AiBubble>
      {message.steps.length > 0 && (
        <div className="rounded-lg border border-border bg-subtle/60 px-3 py-2.5">
          <StepList steps={message.steps} />
        </div>
      )}
      {message.text ? (
        <div>
          <Markdown text={message.text} />
          {running && <span className="mt-1 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-primary" aria-hidden />}
        </div>
      ) : (
        running && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {ta.preparing}
          </p>
        )
      )}
      <RunNotices codes={message.notices} cap={cap} />
      {message.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {ta.replySources}
          {message.sources.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer noopener" className="inline-flex max-w-[16rem] items-center gap-1 truncate rounded-md border border-border bg-card px-2 py-0.5 text-body hover:text-foreground">
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{hostOf(url)}</span>
            </a>
          ))}
        </div>
      )}
      {(message.status === "failed" || message.status === "canceled") && <RunProblem message={message} onRetry={onRetry} onStop={onStop} onUpgrade={onUpgrade} />}
      {message.status === "done" && message.points > 0 && <p className="text-xs tabular-nums text-muted-foreground">{ta.spent(message.points)}</p>}
    </AiBubble>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** A report: the calls while it runs, then the report itself. */
function ReportMessageView({ message, latestReport, cap, onGenerate, onStop, onUpgrade }: MessageViewProps & { message: ReportMessage }) {
  const t = useT()
  if (message.status === "running") return <RunCard message={message} title={t.reports.kinds[message.kind].title} cap={cap} onStop={() => onStop(message.runId)} />
  if (message.status === "done" && message.report) {
    return (
      <div className="space-y-2">
        <div className={cn(cardStyles, "p-5 sm:p-6")}>
          <ReportView report={message.report} collapsible defaultExpanded={latestReport} />
        </div>
        <ReportActions report={message.report} reportId={message.reportId ?? message.report.id} points={message.points} />
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">
        {t.reports.kinds[message.kind].title} · <span className="text-primary">{message.subject}</span>
      </p>
      <RunProblem message={message} onRetry={() => onGenerate(message.kind, message.subject)} onStop={onStop} onUpgrade={onUpgrade} />
    </div>
  )
}

/** After a report: offer to monitor it, and the follow-ups the analyst suggests. */
function FollowUpView({ message, report, onAsk, onUpgrade }: { message: FollowUpMessage; report?: RadarReport; onAsk: (text: string) => void; onUpgrade: () => void }) {
  const ta = useT().ask
  const { limits } = usePlan()
  const [monitoring, setMonitoring] = useState(false)
  return (
    <AiBubble>
      <p className="text-sm leading-relaxed text-foreground">{ta.after[message.kind]}</p>
      {report &&
        (monitoring ? (
          <MonitorAddCard draft={monitorDraftFromReport(report, limits.xPosts > 0)} onCancel={() => setMonitoring(false)} onUpgrade={onUpgrade} />
        ) : (
          <button onClick={() => setMonitoring(true)} className={cn(buttonStyles.secondary, "h-9")}>
            <Eye className="h-3.5 w-3.5 text-primary" />
            {ta.addMonitor}
          </button>
        ))}
      {message.followUps.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {ta.followUps} · {ta.followUpCost}
          </p>
          <div className="flex flex-wrap gap-2">
            {message.followUps.map((question) => (
              <button
                key={question}
                onClick={() => onAsk(question)}
                className="rounded-full border border-border bg-card px-3 py-1 text-left text-xs text-body transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </AiBubble>
  )
}

function ReportActions({ report, reportId, points }: { report: RadarReport; reportId: string; points: number }) {
  const t = useT().ask
  const locale = useLocale()
  const [sharing, setSharing] = useState(false)
  const [path, setPath] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = path && typeof window !== "undefined" ? `${window.location.origin}${path}${locale === "zh" ? "?lang=zh" : ""}` : ""
  const fresh = report.kind === "keyword" && report.wordAgeHours !== null && report.wordAgeHours < PUBLIC_DELAY_HOURS

  // The link exists once the report is shared (POST .../reports/:id/share); sharing again returns the same one.
  const toggle = async () => {
    setSharing((open) => !open)
    if (path) return
    setFailed(false)
    try {
      setPath((await shareReport(reportId)).path)
    } catch {
      setFailed(true)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
        {points > 0 && <span className="tabular-nums">{t.spent(points)}</span>}
        <button onClick={() => void toggle()} aria-expanded={sharing} className="inline-flex items-center gap-1 font-medium text-body hover:text-foreground cursor-pointer">
          <Share2 className="h-3.5 w-3.5" />
          {t.share}
        </button>
      </div>
      {sharing && (
        <div className={cn(cardStyles, "space-y-2 p-3")}>
          {failed ? (
            <p className="text-xs text-destructive">{t.errors.generic as string}</p>
          ) : (
            <div className="flex gap-2">
              <input readOnly value={shareUrl} placeholder="…" aria-label={t.shareLink} className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-subtle px-3 text-sm text-body" />
              <button onClick={copy} disabled={!shareUrl} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t.shareNote}
            {fresh && report.kind === "keyword" && report.wordAgeHours !== null && t.freshNote(PUBLIC_DELAY_HOURS, PUBLIC_DELAY_HOURS - report.wordAgeHours)}
          </p>
        </div>
      )}
    </div>
  )
}
