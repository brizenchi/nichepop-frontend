"use client"

// YOURS. After a credit-pack checkout Stripe returns to
// /credits?checkout=success&session_id=…; this confirms the purchase the way
// the template's components/credit-checkout-notice.tsx does.

import { useEffect, useState } from "react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { ApiErrorNotice, Notice } from "@/components/account/ui"
import { usePageReturn } from "@/components/use-page-return"
import { confirmCreditCheckout, getCreditCheckoutResult, type CreditCheckoutResult } from "@/lib/api"
import { readSession } from "@/lib/auth"
import { checkoutReturnStatus } from "@/lib/billing-state"
import { readCreditCheckoutSession, waitForCreditCheckout } from "@/lib/credit-checkout"

type Phase = "checking" | "pending" | "confirmed" | "failed"

export function CreditCheckoutNotice({ token, onConfirmed }: { token: string; onConfirmed: () => Promise<void> }) {
  const t = useT().account.checkout
  const locale = useLocale()
  const [feedback, setFeedback] = useState<{ owner: string; phase: Phase; credits: number } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [revision, setRevision] = useState(0)
  usePageReturn(() => setRevision((value) => value + 1))

  useEffect(() => {
    if (!token || checkoutReturnStatus(window.location.search) !== "success") return
    const sessionID = readCreditCheckoutSession(window.location.search)
    let active = true
    let timer: number | undefined
    let releaseWait: (() => void) | undefined
    const current = () => active && readSession()?.token === token
    setFeedback((previous) => (previous?.owner === token ? previous : { owner: token, phase: "checking", credits: 0 }))
    setError(null)

    async function confirm() {
      try {
        const result: CreditCheckoutResult | null = sessionID
          ? await waitForCreditCheckout({
              confirm: () => confirmCreditCheckout(token, sessionID),
              load: () => getCreditCheckoutResult(token, sessionID),
              current,
              wait: (delay) => new Promise<void>((resolve) => {
                releaseWait = resolve
                timer = window.setTimeout(resolve, delay)
              }),
            })
          : null
        if (!current()) return
        if (result?.state === "fulfilled") {
          await onConfirmed()
          if (!current()) return
          setFeedback({ owner: token, phase: "confirmed", credits: result.credits_granted })
          const url = new URL(window.location.href)
          url.searchParams.delete("checkout")
          url.searchParams.delete("session_id")
          window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        } else {
          setFeedback({ owner: token, phase: result?.state === "failed" || result?.state === "expired" ? "failed" : "pending", credits: 0 })
        }
      } catch (failure) {
        if (current()) {
          setError(failure)
          setFeedback({ owner: token, phase: "pending", credits: 0 })
        }
      }
    }
    void confirm()
    return () => {
      active = false
      window.clearTimeout(timer)
      releaseWait?.()
    }
  }, [token, onConfirmed, revision])

  if (!feedback || feedback.owner !== token) return null
  const count = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(feedback.credits)
  return (
    <div className="space-y-2">
      <Notice tone={feedback.phase === "confirmed" ? "success" : "info"}>
        {feedback.phase === "confirmed" ? t.added(count) : feedback.phase === "checking" ? t.checking : feedback.phase === "failed" ? t.failed : t.pending}
      </Notice>
      <ApiErrorNotice error={error} />
    </div>
  )
}
