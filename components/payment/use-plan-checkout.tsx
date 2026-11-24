"use client"

// YOURS. Buying Pro or Premium from the pricing table and the upgrade dialog,
// on the template's checkout rules (lib/pricing-checkout.ts, as used by its
// components/use-pricing-checkout.ts): the plan must be on sale
// (GET /capabilities), a subscriber changes plans in place instead of paying
// twice, Stripe returns to /billing?checkout=success. Signed-out readers sign in
// first; after Google sign-in the pricing page picks the purchase up again.

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import LoginDialog from "@/components/LoginDialog"
import { Notice } from "@/components/account/ui"
import { SubscriptionChangeDialog } from "@/components/account/subscription-change-dialog"
import { useLocale, usePick, useT } from "@/components/i18n/locale-provider"
import { useAccount } from "@/hooks/use-account"
import { createCheckoutSession, getCapabilities, getSubscription } from "@/lib/api"
import { readReferralCode, readSession, type AuthSession } from "@/lib/auth"
import { subscriptionRestrictionText } from "@/lib/billing-presentation"
import type { BillingIntent } from "@/lib/billing-intent"
import { appUrl } from "@/lib/env"
import { preparePricingCheckout, pricingCheckoutFailure, pricingCheckoutURLs, pricingPurchaseHref, readPricingPurchase, type PricingCheckoutResult } from "@/lib/pricing-checkout"
import { subscriptionChangeBlocker } from "@/lib/subscription-change"

/** The purchase a signed-out reader started in this tab, resumed after Google sign-in (as in the template). */
const RESUME_KEY = "go-modules.pricing-purchase"

export type PlanTier = "Free" | "Pro" | "Premium"

type Feedback = { tone: "info" | "error"; message: string; requestId?: string; manage?: boolean }
type SubscriptionIntent = Extract<BillingIntent, { product: "subscription" }>

export function usePlanCheckout() {
  const router = useRouter()
  const locale = useLocale()
  const pick = usePick()
  const t = useT().pricing
  const tid = useT().account.errors.requestId
  const { session, refresh } = useAccount()
  const [isYearly, setIsYearly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [processingTier, setProcessingTier] = useState<PlanTier | null>(null)
  const [pending, setPending] = useState<SubscriptionIntent | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [change, setChange] = useState<Extract<PricingCheckoutResult, { kind: "change" }> | null>(null)
  const mounted = useRef(false)
  const inFlight = useRef(false)

  const run = useCallback(async (intent: SubscriptionIntent, signedIn: AuthSession) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setProcessingTier(intent.plan === "premium" ? "Premium" : "Pro")
    setFeedback(null)
    const current = () => mounted.current && readSession()?.token === signedIn.token
    try {
      const urls = pricingCheckoutURLs(intent, locale)
      const result = await preparePricingCheckout(intent, 1, { success: appUrl(urls.success), cancel: appUrl(urls.cancel) }, readReferralCode(), {
        capabilities: getCapabilities,
        subscription: () => getSubscription(signedIn.token),
        create: (payload) => createCheckoutSession(signedIn.token, payload),
        current,
      })
      if (!current()) return
      if (result.kind === "checkout") window.location.assign(result.url)
      else if (result.kind === "change") setChange(result)
      else if (result.kind === "current") setFeedback({ tone: "info", message: t.currentPlan })
      else if (result.kind === "manage") {
        const restriction = result.subscription.plan === "lifetime" ? null : subscriptionRestrictionText(subscriptionChangeBlocker(result.subscription))
        setFeedback({ tone: "info", message: restriction ? pick(restriction) : t.reviewBilling, manage: true })
      } else if (result.kind === "unavailable") setFeedback({ tone: "error", message: t.unavailable })
    } catch (error) {
      if (!current()) return
      const failure = pricingCheckoutFailure(error)
      setFeedback({ tone: "error", message: pick(failure.messages), requestId: failure.requestId, manage: failure.manage })
    } finally {
      inFlight.current = false
      if (mounted.current) {
        setBusy(false)
        setProcessingTier(null)
      }
    }
  }, [locale, pick, t])

  // Back from Google sign-in on /pricing?product=…: pick up the purchase started before.
  useEffect(() => {
    mounted.current = true
    const selection = readPricingPurchase(window.location.search)
    if (selection?.intent.product === "subscription") {
      setIsYearly(selection.intent.interval === "yearly")
      let resume: string | null = null
      try {
        resume = window.sessionStorage.getItem(RESUME_KEY)
      } catch {
        // Storage is optional; the selection stays shown.
      }
      const signedIn = readSession()
      if (signedIn && resume === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        try {
          window.sessionStorage.removeItem(RESUME_KEY)
        } catch {
          // Storage is optional.
        }
        void run(selection.intent, signedIn)
      }
    }
    return () => {
      mounted.current = false
    }
  }, [run])

  const handleUpgrade = (tier: PlanTier) => {
    if (tier === "Free") {
      router.push("/start")
      return
    }
    if (inFlight.current) return
    const intent: SubscriptionIntent = { product: "subscription", plan: tier.toLowerCase(), interval: isYearly ? "yearly" : "monthly" }
    const signedIn = readSession()
    if (signedIn) {
      void run(intent, signedIn)
      return
    }
    setFeedback(null)
    setPending(intent)
    try {
      window.sessionStorage.setItem(RESUME_KEY, pricingPurchaseHref(intent, locale))
    } catch {
      // Email sign-in still continues on this page.
    }
  }

  const closeSignIn = () => {
    setPending(null)
    try {
      window.sessionStorage.removeItem(RESUME_KEY)
    } catch {
      // Storage is optional.
    }
  }

  const dialogs = (
    <>
      <LoginDialog
        open={pending !== null}
        onClose={closeSignIn}
        returnTo={pending ? pricingPurchaseHref(pending, locale) : undefined}
        onSignedIn={(signedIn) => {
          const intent = pending
          closeSignIn()
          if (intent) void run(intent, signedIn)
        }}
      />
      {change && session ? (
        <SubscriptionChangeDialog
          token={session.token}
          subscription={change.subscription}
          offers={change.offers}
          selection={change.selection}
          onClose={() => setChange(null)}
          onChanged={refresh}
        />
      ) : null}
    </>
  )

  const notice = feedback ? (
    <Notice tone={feedback.tone}>
      {feedback.message}
      {feedback.requestId && <span className="mt-1 block text-xs">{tid}: <code>{feedback.requestId}</code></span>}
      {feedback.manage && (
        <Link href="/billing" className="mt-1 block font-medium text-primary hover:text-primary-hover">{t.openBilling} →</Link>
      )}
    </Notice>
  ) : null

  return { isYearly, setIsYearly, loading: busy, processingTier, handleUpgrade, dialogs, notice }
}
