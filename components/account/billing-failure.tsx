"use client"

// YOURS. The template's BillingFailure (components/billing-failure.tsx) in
// NichePop's style: provider messages never reach the page, only
// billingFailureText's wording for the failure's kind and reason.

import { useState } from "react"
import LoginDialog from "@/components/LoginDialog"
import { usePick, useT } from "@/components/i18n/locale-provider"
import { buttonStyles } from "@/components/radar/ui"
import { billingFailureText, type BillingRequestFailure } from "@/lib/billing-presentation"
import { cn } from "@/lib/utils"

export function BillingFailure({ failure, onRetry }: { failure: BillingRequestFailure; onRetry?: () => void }) {
  const t = useT().billing.failure
  const pick = usePick()
  const [signIn, setSignIn] = useState(false)
  const copy = billingFailureText(failure.kind, failure.reason)
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">
      <p className="font-semibold">{pick(copy.title)}</p>
      <p className="mt-1">{pick(copy.message)}</p>
      {failure.requestId && (
        <p className="mt-1 text-xs">
          {t.requestId}: <code>{failure.requestId}</code>
        </p>
      )}
      {failure.kind === "auth" ? (
        <>
          <button type="button" onClick={() => setSignIn(true)} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
            {t.signIn}
          </button>
          <LoginDialog open={signIn} onClose={() => setSignIn(false)} />
        </>
      ) : failure.retryable && onRetry ? (
        <button type="button" onClick={onRetry} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
          {failure.reason === "subscription_change_pending" ? t.checkStatus : t.retry}
        </button>
      ) : null}
    </div>
  )
}
