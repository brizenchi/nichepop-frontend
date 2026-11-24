"use client"

// YOURS. Building blocks of the account pages (/account, /billing, /credits,
// /referrals) in NichePop's style; the logic comes from the template's lib/.

import { useState, type ReactNode } from "react"
import LoginDialog from "@/components/LoginDialog"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { useAccount } from "@/hooks/use-account"
import { ApiError } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/** The page frame: title, one line of intro, optional actions on the right. */
export function AccountPage({ title, intro, actions, children }: { title: string; intro?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {intro && <p className="mt-2 text-sm text-muted-foreground">{intro}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="mt-6 space-y-6">{children}</div>
    </main>
  )
}

export function Card({ title, note, className, children }: { title?: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn(cardStyles, "p-5", className)}>
      {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      <div className={cn(title || note ? "mt-4" : undefined)}>{children}</div>
    </section>
  )
}

export function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className={cn(cardStyles, "flex-1 p-4")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

const NOTICE_TONES = {
  info: "border-rule bg-paper-2 text-body",
  success: "border-success/30 bg-success-soft text-foreground",
  error: "border-destructive/30 bg-danger-soft text-destructive",
}

export function Notice({ tone = "info", children }: { tone?: keyof typeof NOTICE_TONES; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", NOTICE_TONES[tone])}>
      {children}
    </div>
  )
}

/** What went wrong with an account request, in the reader's words, with the request ID for support. */
export function ApiErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT().account.errors
  if (!error) return null
  const api = error instanceof ApiError ? error : null
  const message = api?.status === 401 ? t.signInAgain
    : api?.status === 403 ? t.forbidden
    : api?.status === 409 ? t.conflict
    : api?.status === 400 || api?.status === 422 ? t.invalid
    : api?.status === 503 || api?.status === 404 ? t.notReady
    : api?.status === 0 || error instanceof TypeError ? t.offline
    : t.generic
  const requestId = api && (api.status >= 500 || api.status === 0) ? api.requestId : ""
  return (
    <Notice tone="error">
      <span>{message}</span>
      {requestId && <span className="mt-1 block text-xs">{t.requestId}: <code>{requestId}</code></span>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
          {t.retry}
        </button>
      )}
    </Notice>
  )
}

/** Shows children only to a signed-in reader; others get a sign-in prompt. */
export function AccountGate({ children }: { children: ReactNode }) {
  const t = useT().account.gate
  const { ready, isAuthenticated } = useAccount()
  const [open, setOpen] = useState(false)
  if (!ready) return <p role="status" className="text-sm text-muted-foreground">{t.loading}</p>
  if (!isAuthenticated) {
    return (
      <div className={cn(cardStyles, "p-8 text-center")}>
        <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
        <button type="button" onClick={() => setOpen(true)} className={cn(buttonStyles.primary, "mt-5")}>
          {t.signIn}
        </button>
        <LoginDialog open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }
  return <>{children}</>
}

export function Pager({ page, limit, total, loading, onPage }: { page: number; limit: number; total: number; loading: boolean; onPage: (page: number) => void }) {
  const t = useT().account.pager
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  if (pages <= 1) return null
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span aria-live="polite">{t.label(page, pages)}</span>
      <div className="flex gap-2">
        <button type="button" disabled={loading || page <= 1} onClick={() => onPage(page - 1)} className={cn(buttonStyles.secondary, "h-8")}>
          {t.previous}
        </button>
        <button type="button" disabled={loading || page >= pages} onClick={() => onPage(page + 1)} className={cn(buttonStyles.secondary, "h-8")}>
          {t.next}
        </button>
      </div>
    </nav>
  )
}

/** Formats an account record's date in the reader's language. */
export function useAccountDate() {
  const locale = useLocale()
  return (value?: string | null) => formatDate(value, locale === "zh" ? "zh-CN" : "en-US")
}

/** A membership plan's name in the reader's language (free, starter, pro, premium, lifetime). */
export function usePlanName() {
  const plans = useT().account.plans
  return (plan?: string | null) => plans[(plan || "free").toLowerCase()] ?? plan ?? plans.free
}
