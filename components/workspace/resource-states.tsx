"use client"

// Loading, empty, error and not-yet-live states shared by the workspace pages. Real builds
// show these where demo builds show demo data; none of them ever falls back to demo data.

import type { ReactNode } from "react"
import { Hourglass, Loader2 } from "lucide-react"
import { ApiErrorNotice } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { cardStyles } from "@/components/radar/ui"
import { cn } from "@/lib/utils"

export function LoadingState({ className }: { className?: string }) {
  const t = useT().states
  return (
    <p role="status" className={cn("flex items-center gap-2 py-8 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {t.loading}
    </p>
  )
}

export function EmptyState({ title, text, action, className }: { title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn(cardStyles, "flex flex-col items-start gap-2 p-6", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {text && <p className="max-w-xl text-sm leading-relaxed text-body">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** The backend does not offer this yet (e.g. the trend library before backend #16). */
export function ComingSoon({ text, className }: { text: string; className?: string }) {
  const t = useT().states
  return (
    <div className={cn(cardStyles, "flex flex-col items-start gap-2 p-6", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
        <Hourglass className="h-3.5 w-3.5" />
        {t.comingSoon}
      </span>
      <p className="max-w-xl text-sm leading-relaxed text-body">{text}</p>
    </div>
  )
}

/** A failed read, with the request id to quote and a retry. */
export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("py-2", className)}>
      <ApiErrorNotice error={error} onRetry={onRetry} />
    </div>
  )
}
