"use client"

import { useCallback } from "react"
import { AlertTriangle, Check, Loader2, Square, X } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { cardStyles } from "@/components/radar/ui"
import { useAccount } from "@/hooks/use-account"
import { useResource } from "@/hooks/use-resource"
import { getPricing, type Pricing } from "@/lib/api/agent"
import { baseTool, type RunMessage, type RunStep } from "@/lib/data/chat"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"

let pricing: Promise<Pricing> | null = null

/** What replies, reports and lookups cost, read once per visit (GET /agent/platform/pricing). */
export function usePricing(): Pricing | null {
  const { isAuthenticated } = useAccount()
  const load = useCallback(() => {
    pricing ??= getPricing().catch((error) => {
      pricing = null
      throw error
    })
    return pricing
  }, [])
  return useResource(DEMO_MODE || isAuthenticated ? load : null).data
}

/** Provider steps that are not research tools of the backend. */
const PROVIDER_TOOLS: Record<string, string> = { web_search: "web", web_fetch: "web" }

/** The data source of a tool call in the reader's language: `serp_top` → its ask_tool → "DataForSEO SERP". */
export function useToolName() {
  const t = useT()
  const prices = usePricing()
  return useCallback(
    (tool: string) => {
      const name = baseTool(tool)
      const source = prices?.tools.find((entry) => entry.name === name)?.ask_tool ?? PROVIDER_TOOLS[name] ?? name
      const label = (t.tools as Record<string, unknown>)[source]
      // Anything else (a shell command, a draft) is the analyst's own work.
      return typeof label === "string" ? label : t.tools.ai
    },
    [prices, t],
  )
}

function StepIcon({ status }: { status: RunStep["status"] }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        status === "done" ? "bg-success text-white" : status === "error" ? "bg-destructive text-white" : "bg-primary-soft text-primary",
      )}
    >
      {status === "done" ? <Check className="h-3 w-3" /> : status === "error" ? <X className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
    </span>
  )
}

/** Each tool call as the backend reported it: the data source, what it looked up, and its points. */
export function StepList({ steps }: { steps: RunStep[] }) {
  const t = useT()
  const toolName = useToolName()
  const calls = new Map<string, number>()
  return (
    <ol className="space-y-2.5">
      {steps.map((step) => {
        const label = toolName(step.tool)
        const n = (calls.get(label) ?? 0) + 1
        calls.set(label, n)
        return (
          <li key={step.id} className="flex items-start gap-3 text-sm">
            <StepIcon status={step.status} />
            <span className="min-w-0 flex-1">
              <span className="block text-body">{label}</span>
              <span className="mt-0.5 block truncate text-xs text-faint">{[step.detail, t.ask.callNumber(n)].filter(Boolean).join(" · ")}</span>
            </span>
            <span className={cn("shrink-0 text-xs tabular-nums", step.credits > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
              {step.status === "error" ? t.ask.stepFailed : step.credits > 0 ? `+${step.credits}` : step.status === "done" ? t.ask.stepFree : ""}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Why an answer may be incomplete: the lookup limit, the task's point cap, or an empty balance. */
export function RunNotices({ codes, cap }: { codes: string[]; cap: number | null }) {
  const t = useT().ask
  const text = (code: string) => {
    if (code === "CREDIT_CAP") return t.notices.CREDIT_CAP(cap ?? 0)
    if (code === "ROUND_LIMIT" || code === "INSUFFICIENT_CREDITS") return t.notices[code]
    return null
  }
  const shown = codes.map((code) => [code, text(code)] as const).filter(([, line]) => line)
  if (shown.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {shown.map(([code, line]) => (
        <li key={code} className="flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs leading-relaxed text-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          {line}
        </li>
      ))}
    </ul>
  )
}

export function StopButton({ onStop, disabled }: { onStop: () => void; disabled?: boolean }) {
  const t = useT().ask
  return (
    <button
      type="button"
      onClick={onStop}
      disabled={disabled}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground disabled:opacity-50 cursor-pointer"
    >
      <Square className="h-3 w-3 fill-current" />
      {t.stop}
    </button>
  )
}

/** A report while it runs: the calls the backend made so far and the points they spent. */
export function RunCard({ message, title, cap, onStop }: { message: Extract<RunMessage, { role: "report" }>; title: string; cap: number | null; onStop: () => void }) {
  const t = useT().ask
  return (
    <div className={cn(cardStyles, "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold text-foreground">
          {title} · <span className="break-words text-primary">{message.subject}</span>
        </p>
        <StopButton onStop={onStop} disabled={!message.runId} />
      </div>
      <div className="mt-4 space-y-3">
        {message.steps.length > 0 ? (
          <StepList steps={message.steps} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {t.preparing}
          </p>
        )}
        <RunNotices codes={message.notices} cap={cap} />
      </div>
      <p className="mt-4 border-t border-border pt-3 text-right text-xs font-medium tabular-nums text-foreground">
        {t.spentSoFar(message.points)}
        {cap !== null && <span className="font-normal text-muted-foreground"> · {t.cap(cap)}</span>}
      </p>
    </div>
  )
}
