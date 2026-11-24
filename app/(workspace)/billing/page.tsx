"use client"

// The template's /billing page (app/(default)/(private)/(customer)/billing)
// in NichePop's style: the plan and points, renewal, plan changes, the
// return from Stripe Checkout and the payment history. Behaviour stays the
// template's; only the presentation is NichePop's.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useLocale, usePick, useT } from "@/components/i18n/locale-provider"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { AccountGate, AccountPage, ApiErrorNotice, Notice, useAccountDate, usePlanName } from "@/components/account/ui"
import { BillingFailure } from "@/components/account/billing-failure"
import { BillingHistory } from "@/components/account/billing-history"
import { SubscriptionChangeDialog } from "@/components/account/subscription-change-dialog"
import { usePageReturn } from "@/components/use-page-return"
import { useAccount } from "@/hooks/use-account"
import { useAccountResource } from "@/hooks/use-account-resource"
import {
  ApiError,
  cancelScheduledChange,
  cancelSubscription,
  getCapabilities,
  getMembership,
  getSubscription,
  reactivateSubscription,
  type CapabilitiesView,
  type SubscriptionView,
} from "@/lib/api"
import { readSession } from "@/lib/auth"
import { billingPrimaryAction, billingPrimaryText, billingText, subscriptionStatusText, type BillingRequestFailure } from "@/lib/billing-presentation"
import { CHECKOUT_REFRESH_DELAYS_MS, checkoutReturnStatus, hasOngoingRecurringSubscription } from "@/lib/billing-state"
import { readBillingIntent, type BillingIntent } from "@/lib/billing-intent"
import { isBillingIntentAvailable } from "@/lib/billing-selection"
import { appEnv } from "@/lib/env"
import { localizedHref } from "@/lib/i18n"
import { getCreditBalance } from "@/lib/operations-api"
import { pricingPurchaseHref } from "@/lib/pricing-checkout"
import {
  describeRequestFailure,
  idleResource,
  loadingResource,
  reconcileResourceRefresh,
  settleResource,
  startResourceRefresh,
  type RequestFailure,
  type ResourceState,
} from "@/lib/request-state"
import { beginRequestGeneration, invalidateRequestGeneration, isCurrentRequestGeneration } from "@/lib/request-generation"
import { cancelRenewalForSubscription, subscriptionRenewalAction } from "@/lib/subscription-management"
import { cn } from "@/lib/utils"

type FeedbackTarget = "current" | "plans"

const defaultPlan = ["starter", "pro", "premium", "lifetime"].includes(appEnv.defaultPlan) ? appEnv.defaultPlan : "pro"
const defaultInterval = appEnv.defaultInterval === "yearly" ? "yearly" : "monthly"

// NICHEPOP: copy says points (点数), not credits; billingText.canceledRenewal is
// replaced by t.canceledRenewal for that reason.
// BillingFailure shows billingFailureText's wording for the kind, never these.
const signedOutFailure: RequestFailure = { kind: "auth", title: "", message: "", retryable: false }
const disabledFailure: RequestFailure = { kind: "configuration", title: "", message: "", retryable: false }

const PAYMENT_DUE_STATUSES = ["past_due", "incomplete", "unpaid", "payment_failed", "trialing"]

export default function BillingPage() {
  const t = useT().billing
  const pick = usePick()
  const locale = useLocale()
  const formatDate = useAccountDate()
  const planName = usePlanName()
  const { session, refresh: refreshAccount } = useAccount()
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [feedbackTarget, setFeedbackTarget] = useState<FeedbackTarget>("current")
  const [intentRequest, setIntentRequest] = useState<{ intent: BillingIntent | null } | null>(null)
  const [plansOpen, setPlansOpen] = useState(false)
  const [historyRevision, setHistoryRevision] = useState(0)
  const [busy, setBusy] = useState<"" | "cancel" | "reactivate">("")
  const [status, setStatus] = useState("")
  const [actionFailure, setActionFailure] = useState<BillingRequestFailure | null>(null)
  const [capabilitiesState, setCapabilitiesState] = useState<ResourceState<CapabilitiesView>>(idleResource())
  const [subscriptionState, setSubscriptionState] = useState<ResourceState<SubscriptionView>>(idleResource())
  const [plan, setPlan] = useState(defaultPlan)
  const [interval, setInterval] = useState(defaultInterval)
  const [checkoutReturn, setCheckoutReturn] = useState<"success" | "cancelled" | null>(null)
  const [checkoutRefreshActive, setCheckoutRefreshActive] = useState(false)
  const [checkoutRefreshComplete, setCheckoutRefreshComplete] = useState(false)
  const capabilitiesGenerationRef = useRef(0)
  const capabilitiesMountedRef = useRef(false)
  const subscriptionGenerationRef = useRef(0)
  const actionGenerationRef = useRef(0)
  const checkoutRefreshGenerationRef = useRef(0)
  const checkoutRefreshTimerRef = useRef<number | null>(null)
  const cancelTriggerRef = useRef<HTMLButtonElement | null>(null)
  const subscription = subscriptionState.data
  const billingCapability = capabilitiesState.data?.billing
  const subscriptionOffers = billingCapability?.offers.subscriptions || []
  const availablePlans = useMemo(() => (billingCapability?.offers.subscriptions || []).map((offer) => offer.plan), [billingCapability])
  const selectedOffer = subscriptionOffers.find((offer) => offer.plan === plan)
  const availableIntervals = useMemo(() => selectedOffer?.intervals || [], [selectedOffer])
  const ongoingRecurringSubscription = hasOngoingRecurringSubscription(subscription)
  const renewalAction = subscriptionRenewalAction(subscription)
  const cancellationPending = renewalAction === "renew"
  const selectedLifetime = plan === "lifetime"
  const billingReady = capabilitiesState.status === "ready" && capabilitiesState.data.billing.enabled
  const intentUnavailable = intentRequest !== null && (
    !intentRequest.intent || (capabilitiesState.status === "ready" && !isBillingIntentAvailable(intentRequest.intent, billingCapability))
  )
  const billingDisabled = (capabilitiesState.status === "ready" && !capabilitiesState.data.billing.enabled)
    || (subscriptionState.status === "error" && (subscriptionState.failure.kind === "disabled" || subscriptionState.failure.kind === "configuration"))
  const baseActionDisabled = !session || !billingReady || billingDisabled || busy !== ""
  const billingCapabilityFailure: RequestFailure | null = capabilitiesState.status === "error"
    ? capabilitiesState.failure
    : capabilitiesState.status === "ready" && !capabilitiesState.data.billing.enabled ? disabledFailure : null
  const sessionToken = session?.token || ""
  const membership = useAccountResource(sessionToken, getMembership)
  const credits = useAccountResource(sessionToken, getCreditBalance)
  const refreshMembership = membership.refresh
  const refreshCredits = credits.refresh
  const revalidateMembership = membership.revalidate
  const revalidateCredits = credits.revalidate
  const upgradeAction = billingPrimaryAction(membership.data?.plan, subscription)
  const hasLifetime = upgradeAction === "lifetime"
  const upgradeLoading = membership.loading || upgradeAction === "loading" || (!subscription && subscriptionState.status !== "error")
  const pricingHref = localizedHref("/pricing", locale)
  const numberFormat = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US")
  const intervalName = (value?: string) => (value ? t.intervals[value] ?? value : "—")

  const loadSubscriptionState = useCallback(async (token: string, background = false) => {
    if (readSession()?.token !== token) return
    const generation = beginRequestGeneration(subscriptionGenerationRef)
    setSubscriptionState((current) => startResourceRefresh(current, background))
    const nextState = await settleResource(getSubscription(token), "Subscription billing")
    if (readSession()?.token === token && isCurrentRequestGeneration(subscriptionGenerationRef, generation)) {
      setSubscriptionState((current) => reconcileResourceRefresh(current, nextState, background))
    }
  }, [])

  const loadBillingState = useCallback(async (token: string, background = false) => {
    await Promise.all([
      loadSubscriptionState(token, background),
      background ? revalidateMembership() : refreshMembership(),
      background ? revalidateCredits() : refreshCredits(),
    ])
    if (readSession()?.token === token) {
      setHistoryRevision((value) => value + 1)
      // NICHEPOP: the sidebar's plan and credits follow billing changes.
      void refreshAccount()
    }
  }, [loadSubscriptionState, refreshMembership, refreshCredits, revalidateMembership, revalidateCredits, refreshAccount])

  const updateOnReturn = useCallback(() => {
    if (sessionToken && billingReady) void loadBillingState(sessionToken, true)
    else {
      void revalidateMembership()
      void revalidateCredits()
      setHistoryRevision((value) => value + 1)
    }
  }, [revalidateMembership, revalidateCredits, sessionToken, billingReady, loadBillingState])
  usePageReturn(updateOnReturn)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (["product", "plan", "interval"].some((key) => params.has(key))) {
      const intent = readBillingIntent(window.location.search)
      setIntentRequest({ intent })
      setPlansOpen(intent?.product === "subscription")
      if (intent?.product === "subscription") {
        setPlan(intent.plan)
        setInterval(intent.interval)
      } else if (intent?.product === "lifetime") {
        setPlan("lifetime")
      }
    }
    const returnStatus = checkoutReturnStatus(window.location.search)
    setCheckoutReturn(returnStatus)
    if (returnStatus) {
      const url = new URL(window.location.href)
      url.searchParams.delete("checkout")
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    }
    return () => {
      invalidateRequestGeneration(checkoutRefreshGenerationRef)
      if (checkoutRefreshTimerRef.current !== null) {
        window.clearTimeout(checkoutRefreshTimerRef.current)
        checkoutRefreshTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (["#plans", "#subscription-checkout"].includes(window.location.hash) && !readBillingIntent(window.location.search)) {
      window.location.replace(pricingHref)
    }
  }, [pricingHref])

  useEffect(() => {
    capabilitiesMountedRef.current = true
    void loadCapabilitiesState()
    return () => {
      capabilitiesMountedRef.current = false
      invalidateRequestGeneration(capabilitiesGenerationRef)
    }
  }, [])

  useEffect(() => {
    invalidateRequestGeneration(actionGenerationRef)
    setBusy("")
    setStatus("")
    setActionFailure(null)
    setCancelConfirmOpen(false)
    if (!sessionToken || capabilitiesState.status !== "ready" || !capabilitiesState.data.billing.enabled) {
      invalidateRequestGeneration(subscriptionGenerationRef)
      setSubscriptionState(idleResource())
      return
    }
    void loadSubscriptionState(sessionToken)
    return () => {
      invalidateRequestGeneration(subscriptionGenerationRef)
      invalidateRequestGeneration(actionGenerationRef)
    }
  }, [sessionToken, capabilitiesState, loadSubscriptionState])

  useEffect(() => {
    const intent = intentRequest?.intent
    if (!intent || (intent.product === "subscription" && subscriptionState.status !== "ready")) return
    if (intent.product !== "subscription" || !ongoingRecurringSubscription) {
      window.location.replace(pricingPurchaseHref(intent, locale))
    }
  }, [intentRequest, subscriptionState.status, ongoingRecurringSubscription, locale])

  useEffect(() => {
    invalidateRequestGeneration(checkoutRefreshGenerationRef)
    if (checkoutRefreshTimerRef.current !== null) {
      window.clearTimeout(checkoutRefreshTimerRef.current)
      checkoutRefreshTimerRef.current = null
    }
    setCheckoutRefreshActive(false)
    setCheckoutRefreshComplete(false)
    if (checkoutReturn !== "success" || !sessionToken || !billingReady) return

    const generation = beginRequestGeneration(checkoutRefreshGenerationRef)
    let nextAttempt = 0
    const stale = () => readSession()?.token !== sessionToken || !isCurrentRequestGeneration(checkoutRefreshGenerationRef, generation)
    const scheduleRefresh = () => {
      const delay = CHECKOUT_REFRESH_DELAYS_MS[nextAttempt]
      checkoutRefreshTimerRef.current = window.setTimeout(async () => {
        checkoutRefreshTimerRef.current = null
        if (stale()) return
        setCheckoutRefreshActive(true)
        await loadBillingState(sessionToken, true)
        if (stale()) return
        nextAttempt += 1
        if (nextAttempt < CHECKOUT_REFRESH_DELAYS_MS.length) {
          scheduleRefresh()
          return
        }
        setCheckoutRefreshActive(false)
        setCheckoutRefreshComplete(true)
      }, delay)
    }
    scheduleRefresh()
    return () => {
      invalidateRequestGeneration(checkoutRefreshGenerationRef)
      if (checkoutRefreshTimerRef.current !== null) {
        window.clearTimeout(checkoutRefreshTimerRef.current)
        checkoutRefreshTimerRef.current = null
      }
    }
  }, [billingReady, checkoutReturn, loadBillingState, sessionToken])

  useEffect(() => {
    if (intentRequest !== null || capabilitiesState.status !== "ready" || !capabilitiesState.data.billing.enabled) return
    if (availablePlans.length > 0 && !availablePlans.includes(plan)) setPlan(availablePlans[0])
  }, [availablePlans, capabilitiesState, plan, intentRequest])

  useEffect(() => {
    if (intentRequest !== null || selectedLifetime || availableIntervals.length === 0 || availableIntervals.includes(interval)) return
    setInterval(availableIntervals[0])
  }, [availableIntervals, interval, selectedLifetime, intentRequest])

  async function loadCapabilitiesState() {
    if (!capabilitiesMountedRef.current) return
    const generation = beginRequestGeneration(capabilitiesGenerationRef)
    setCapabilitiesState((current) => loadingResource(current.data))
    const nextState = await settleResource(getCapabilities(), "API capabilities")
    if (capabilitiesMountedRef.current && isCurrentRequestGeneration(capabilitiesGenerationRef, generation)) {
      setCapabilitiesState(nextState)
    }
  }

  function handleActionError(error: unknown, capability: string) {
    if (error instanceof ApiError && error.reason === "subscription_change_pending") {
      setActionFailure({ kind: "unknown", title: "", message: "", reason: "subscription_change_pending", retryable: true })
      return
    }
    setActionFailure(describeRequestFailure(error, capability))
  }

  function canCommitAction(token: string, generation: number): boolean {
    return readSession()?.token === token && isCurrentRequestGeneration(actionGenerationRef, generation)
  }

  async function handleCancel() {
    setFeedbackTarget("current")
    if (!session) {
      setActionFailure(signedOutFailure)
      return
    }
    const requestToken = session.token
    const actionGeneration = beginRequestGeneration(actionGenerationRef)
    setBusy("cancel")
    setActionFailure(null)
    setStatus("")
    try {
      const result = await cancelRenewalForSubscription({
        load: () => getSubscription(requestToken),
        removeSchedule: () => cancelScheduledChange(requestToken),
        cancel: () => cancelSubscription(requestToken, "end_of_period"),
        current: () => canCommitAction(requestToken, actionGeneration),
      })
      if (!result || !canCommitAction(requestToken, actionGeneration)) return
      if (result.state === "blocked") {
        setActionFailure({ kind: "unknown", title: "", message: "", reason: "subscription_change_pending", retryable: true })
        await loadBillingState(requestToken, true)
        return
      }
      setStatus(result.state === "unconfirmed"
        ? t.cancelUnconfirmed
        : result.state === "ended"
          ? t.ended
          : result.subscription.current_period_end
            ? t.canceledUntil(formatDate(result.subscription.current_period_end))
            : t.canceledNoDate)
      setCancelConfirmOpen(false)
      await loadBillingState(requestToken, true)
    } catch (err) {
      if (canCommitAction(requestToken, actionGeneration)) {
        handleActionError(err, "Subscription cancellation")
        await loadBillingState(requestToken, true)
      }
    } finally {
      if (canCommitAction(requestToken, actionGeneration)) setBusy("")
    }
  }

  async function handleReactivate() {
    setFeedbackTarget("current")
    if (!session) {
      setActionFailure(signedOutFailure)
      return
    }
    const requestToken = session.token
    const actionGeneration = beginRequestGeneration(actionGenerationRef)
    setBusy("reactivate")
    setActionFailure(null)
    setStatus("")
    try {
      await reactivateSubscription(requestToken)
      if (!canCommitAction(requestToken, actionGeneration)) return
      setStatus(t.renewed)
      await loadBillingState(requestToken, true)
    } catch (err) {
      if (canCommitAction(requestToken, actionGeneration)) handleActionError(err, "Subscription reactivation")
    } finally {
      if (canCommitAction(requestToken, actionGeneration)) setBusy("")
    }
  }

  function actionFeedback(target: FeedbackTarget) {
    if (feedbackTarget !== target || (!status && !actionFailure)) return null
    return (
      <div className="space-y-2">
        {status && <Notice tone="success">{status}</Notice>}
        {actionFailure && <BillingFailure failure={actionFailure} onRetry={() => (session ? void loadBillingState(session.token, true) : undefined)} />}
      </div>
    )
  }

  function primaryPlanControl() {
    if (hasLifetime) return <button type="button" className={buttonStyles.secondary} disabled>{pick(billingText.lifetime)}</button>
    // NICHEPOP: with billing off the subscription never loads, so say so instead of loading forever.
    if (subscriptionState.status === "error" || billingDisabled) return <button type="button" className={buttonStyles.secondary} disabled>{t.planUnavailable}</button>
    if (upgradeLoading) return <button type="button" className={buttonStyles.primary} disabled>{pick(billingText.loading)}</button>
    const label = pick(billingPrimaryText(upgradeAction))
    if (baseActionDisabled) return <button type="button" className={buttonStyles.primary} disabled>{label}</button>
    return <Link className={buttonStyles.primary} href={pricingHref}>{label}</Link>
  }

  const periodLabel = subscription && (cancellationPending
    ? t.accessUntil
    : subscription.pending_payment || PAYMENT_DUE_STATUSES.includes(subscription.status) ? t.periodEnds : t.nextRenewal)

  return (
    <AccountPage title={t.title} intro={t.intro}>
      {billingCapabilityFailure && (
        <BillingFailure failure={billingCapabilityFailure} onRetry={capabilitiesState.status === "error" ? () => void loadCapabilitiesState() : undefined} />
      )}
      {intentUnavailable && (
        <Notice>
          <strong className="block font-semibold text-foreground">{t.intentUnavailableTitle}</strong>
          <p className="mt-1">{t.intentUnavailableText}</p>
          <Link className={cn(buttonStyles.secondary, "mt-2 h-8")} href={pricingHref}>{t.viewPlans}</Link>
        </Notice>
      )}
      {checkoutReturn === "success" ? (
        <Notice>
          {checkoutRefreshActive
            ? pick(billingText.checkoutChecking)
            : checkoutRefreshComplete
              ? pick(billingText.checkoutWaiting)
              : session ? pick(billingText.checkoutChecking) : t.checkoutSignedOut}
        </Notice>
      ) : checkoutReturn === "cancelled" ? (
        <Notice>{pick(billingText.checkoutCanceled)}</Notice>
      ) : null}

      <AccountGate>
        <section id="subscription-state" className={cn(cardStyles, "space-y-4 p-5")}>
          <h2 className="text-sm font-semibold text-foreground">{t.planAndPoints}</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.currentPlan}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <strong className="text-2xl font-semibold tracking-tight text-foreground">
                  {membership.data || subscription ? planName(membership.data?.plan || subscription?.plan) : "—"}
                </strong>
                {subscription && ongoingRecurringSubscription && (
                  <span className="rounded-full bg-paper-3 px-2 py-0.5 text-xs font-medium text-body">{pick(subscriptionStatusText(subscription.status))}</span>
                )}
              </div>
              {subscription && ongoingRecurringSubscription && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {intervalName(subscription.billing_cycle)} · {periodLabel} {formatDate(subscription.effective_cancel_at || subscription.current_period_end)}
                </p>
              )}
              {hasLifetime && <p className="mt-1 text-sm text-muted-foreground">{t.lifetimeAccess}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.remainingPoints}</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{credits.data ? numberFormat.format(credits.data.balance) : "—"}</p>
              <Link href="/credits" className="text-sm font-medium text-primary hover:text-primary-hover">{t.pointHistory} →</Link>
            </div>
          </div>
          <ApiErrorNotice error={membership.error} />
          <ApiErrorNotice error={credits.error} />
          {subscription?.pending_payment && (
            <div className="rounded-xl bg-paper-2 px-4 py-3 text-sm ring-1 ring-rule" role="status">
              <strong className="font-semibold text-foreground">{t.pendingPaymentTitle}</strong>
              <p className="mt-1 text-body">{t.pendingPaymentText}</p>
            </div>
          )}
          {subscription?.scheduled_change && (
            <div className="rounded-xl bg-paper-2 px-4 py-3 text-sm ring-1 ring-rule">
              <strong className="font-semibold text-foreground">{t.scheduledTitle}</strong>
              <p className="mt-1 text-body">
                {planName(subscription.scheduled_change.plan)} · {intervalName(subscription.scheduled_change.billing_cycle)} · {formatDate(subscription.scheduled_change.effective_at)}
              </p>
            </div>
          )}
          {subscription && cancellationPending && <p className="text-sm text-muted-foreground">{t.canceledRenewal}</p>}
          <div className="flex flex-wrap gap-2">
            {primaryPlanControl()}
            {!hasLifetime && renewalAction === "renew" && (
              <button type="button" className={buttonStyles.secondary} disabled={baseActionDisabled} onClick={() => void handleReactivate()}>
                {busy === "reactivate" ? t.renewing : t.renew}
              </button>
            )}
            {!hasLifetime && renewalAction === "cancel" && (
              <button
                ref={cancelTriggerRef}
                type="button"
                className={buttonStyles.ghost}
                disabled={baseActionDisabled}
                aria-expanded={cancelConfirmOpen}
                aria-controls="cancel-renewal-confirmation"
                onClick={() => setCancelConfirmOpen((value) => !value)}
              >
                {t.cancelSubscription}
              </button>
            )}
          </div>
          {subscription && !hasLifetime && cancelConfirmOpen && ongoingRecurringSubscription && !cancellationPending && (
            <div id="cancel-renewal-confirmation" role="group" aria-labelledby="cancel-renewal-title" className="space-y-2 rounded-xl border border-destructive/30 bg-danger-soft/40 px-4 py-3 text-sm">
              <h3 id="cancel-renewal-title" className="font-semibold text-foreground">{t.cancelConfirmTitle}</h3>
              <p className="text-body">{subscription.current_period_end ? t.cancelConfirmUntil(formatDate(subscription.current_period_end)) : t.cancelConfirmNoDate}</p>
              {subscription.scheduled_change && <p className="text-body">{t.cancelConfirmScheduled}</p>}
              <p className="text-body">{t.cancelConfirmPoints}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  disabled={busy !== ""}
                  onClick={() => {
                    setCancelConfirmOpen(false)
                    cancelTriggerRef.current?.focus()
                  }}
                >
                  {t.keepRenewal}
                </button>
                <button type="button" className={cn(buttonStyles.secondary, "text-destructive")} disabled={baseActionDisabled} onClick={() => void handleCancel()}>
                  {busy === "cancel" ? t.canceling : t.confirmCancel}
                </button>
              </div>
            </div>
          )}
          {subscriptionState.status === "error" && (
            <BillingFailure failure={subscriptionState.failure} onRetry={() => (session ? void loadSubscriptionState(session.token) : undefined)} />
          )}
          {actionFeedback("current")}
        </section>

        {plansOpen && ongoingRecurringSubscription && !hasLifetime && subscription && (
          <SubscriptionChangeDialog
            token={sessionToken}
            subscription={subscription}
            offers={subscriptionOffers}
            selection={{ plan, interval }}
            onClose={() => setPlansOpen(false)}
            onChanged={() => loadBillingState(sessionToken, true)}
          />
        )}

        {session && <BillingHistory key={session.token} token={session.token} revision={historyRevision} invoicesEnabled={billingReady} />}
      </AccountGate>
    </AccountPage>
  )
}
