"use client"

// YOURS. The template's SubscriptionChangeDialog
// (components/subscription-change-dialog.tsx) in NichePop's style: preview the
// price of a plan change, then confirm it, keep the current plan, resume
// renewal or finish a pending payment. The rules are the template's lib/.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useLocale, usePick, useT } from "@/components/i18n/locale-provider"
import { buttonStyles } from "@/components/radar/ui"
import { ApiErrorNotice, Notice, useAccountDate, usePlanName } from "@/components/account/ui"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { BillingFailure } from "@/components/account/billing-failure"
import {
  ApiError,
  cancelScheduledChange,
  changeSubscription,
  createBillingPortalSession,
  getSubscription,
  previewSubscriptionChange,
  reactivateSubscription,
  type CapabilitiesView,
  type SubscriptionView,
} from "@/lib/api"
import { readSession } from "@/lib/auth"
import { stripeInvoiceURL } from "@/lib/billing-state"
import { formatBillingAmount } from "@/lib/billing-money"
import { appEnv } from "@/lib/env"
import { confirmPlanSelection, isScheduledSelection, keepCurrentSubscription } from "@/lib/subscription-management"
import { idleResource, loadingResource, settleResource } from "@/lib/request-state"
import {
  canConfirmSubscriptionChange,
  canKeepCurrentPlan,
  isValidSubscriptionPreview,
  resumeRenewalForChange,
  subscriptionChangeBlocker,
  subscriptionPlanIntent,
  subscriptionPreviewAmount,
  type SubscriptionSelection,
} from "@/lib/subscription-change"
import {
  billingText,
  cancelPlanChangeText,
  changeDialogTitle,
  changePaymentText,
  changeResultText,
  changeSubmitText,
  changeTimingText,
  planActionText,
  subscriptionRestrictionText,
} from "@/lib/billing-presentation"
import { cn } from "@/lib/utils"

type Props = {
  token: string
  subscription: SubscriptionView
  offers: CapabilitiesView["billing"]["offers"]["subscriptions"]
  selection: SubscriptionSelection
  onClose: () => void
  onChanged: () => void | Promise<void>
}

/** One billing action at a time for this session (the template's useConsoleAction). */
function useAction(token: string) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const generation = useRef(0)
  const running = useRef(false)
  useEffect(() => {
    const counter = generation
    counter.current++
    running.current = false
    setBusy(false)
    setError(null)
    return () => {
      counter.current++
    }
  }, [token])
  async function run<T>(request: () => Promise<T>, onSuccess: (data: T) => void) {
    if (running.current || !token || readSession()?.token !== token) return
    const current = ++generation.current
    running.current = true
    setBusy(true)
    setError(null)
    try {
      const data = await request()
      if (generation.current === current && readSession()?.token === token) onSuccess(data)
    } catch (failure) {
      if (generation.current === current && readSession()?.token === token) setError(failure)
    } finally {
      if (generation.current === current) {
        running.current = false
        setBusy(false)
      }
    }
  }
  return { busy, error, run }
}

function Rows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-right text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const note = "text-sm text-muted-foreground"

export function SubscriptionChangeDialog({ token, subscription, offers, selection, onClose, onChanged }: Props) {
  const t = useT().billing
  const td = t.dialog
  const pick = usePick()
  const locale = useLocale()
  const formatDate = useAccountDate()
  const planName = usePlanName()
  const action = useAction(token)
  const [preview, setPreview] = useState(idleResource<Awaited<ReturnType<typeof previewSubscriptionChange>>>())
  const [result, setResult] = useState<Awaited<ReturnType<typeof changeSubscription>> | null>(null)
  const [refreshed, setRefreshed] = useState<{ owner: string; base: SubscriptionView; value: SubscriptionView } | null>(null)
  const [revision, setRevision] = useState(0)
  const [reviewRequired, setReviewRequired] = useState(false)
  const [kept, setKept] = useState(false)
  const currentSubscription = refreshed?.owner === token && refreshed.base === subscription ? refreshed.value : subscription
  const generation = useRef(0)
  const { plan, interval } = selection
  const intervals = offers.find((offer) => offer.plan === plan)?.intervals || []
  const configured = intervals.includes(interval)
  const choice = subscriptionPlanIntent(selection, currentSubscription)
  const blocker = subscriptionChangeBlocker(currentSubscription)
  const restriction = subscriptionRestrictionText(blocker)
  const intent = subscriptionPlanIntent(selection, currentSubscription)
  const keepRequested = subscriptionPlanIntent(selection, subscription) === "keep"
  const keepConfirmable = keepRequested && !kept && !action.busy && canKeepCurrentPlan(currentSubscription)
    && currentSubscription.plan === plan && currentSubscription.billing_cycle === interval
  const alreadyScheduled = !keepRequested && isScheduledSelection(selection, currentSubscription)
  const previewable = !alreadyScheduled && ["upgrade", "downgrade", "interval"].includes(intent) && (!blocker || blocker === "cancellation" || blocker === "scheduled")
  const moneyLocale = locale === "zh" ? "zh-CN" : "en-US"
  const intervalName = (value: string) => t.intervals[value === "yearly" ? "yearly" : "monthly"]

  const loadPreview = useCallback(async () => {
    if (readSession()?.token !== token) return
    const current = ++generation.current
    setPreview((previous) => loadingResource(previous.data))
    const next = await settleResource(previewSubscriptionChange(token, { plan, interval }), "Subscription change preview")
    if (generation.current === current && readSession()?.token === token) setPreview(next)
  }, [token, plan, interval])

  useEffect(() => {
    if (configured && previewable) void loadPreview()
    else setPreview(idleResource())
    const counter = generation
    return () => {
      counter.current++
    }
  }, [configured, previewable, loadPreview, revision])

  useEffect(() => {
    setResult(null)
    setKept(false)
    setReviewRequired(false)
  }, [token, plan, interval])

  const validPreview = preview.status === "ready" && isValidSubscriptionPreview(preview.data) && preview.data.target_plan === plan && preview.data.target_interval === interval ? preview.data : null
  const paymentCopy = validPreview ? changePaymentText(validPreview) : null
  const ready = configured && Boolean(validPreview) && !result
  const resultCopy = result ? changeResultText(result) : alreadyScheduled ? changeResultText(currentSubscription) : null
  const confirmable = !alreadyScheduled && canConfirmSubscriptionChange({ selection, subscription: { ...currentSubscription, scheduled_change: null }, preview: preview.data, ready, busy: action.busy })
  const pendingError = action.error instanceof ApiError && action.error.reason === "subscription_change_pending"
  const paymentURL = stripeInvoiceURL(currentSubscription.pending_payment?.invoice_url)

  function acceptSnapshot(latest: SubscriptionView | null) {
    if (!latest) return
    generation.current++
    setRefreshed({ owner: token, base: subscription, value: latest })
    setPreview(idleResource())
    setRevision((value) => value + 1)
    void onChanged()
  }

  function confirm() {
    if (!confirmable || !validPreview || readSession()?.token !== token) return
    const attempt = generation.current
    void action.run(async () => {
      try {
        return await confirmPlanSelection({ selection, subscription: currentSubscription, preview: validPreview }, {
          load: () => getSubscription(token),
          removeSchedule: () => cancelScheduledChange(token),
          preview: () => previewSubscriptionChange(token, { plan, interval }),
          submit: () => changeSubscription(token, { plan, interval }),
          current: () => readSession()?.token === token && generation.current === attempt,
        })
      } catch (error) {
        void onChanged()
        throw error
      }
    }, (saved) => {
      if (!saved) return
      if (saved.state === "review") {
        setReviewRequired(true)
        acceptSnapshot(saved.subscription)
      } else {
        setResult(saved.result)
        void onChanged()
      }
    })
  }

  function keepPlan() {
    if (!keepConfirmable || readSession()?.token !== token) return
    const attempt = generation.current
    void action.run(async () => {
      try {
        return await keepCurrentSubscription(currentSubscription, {
          load: () => getSubscription(token),
          removeSchedule: () => cancelScheduledChange(token),
          current: () => readSession()?.token === token && generation.current === attempt,
        })
      } catch (error) {
        void onChanged()
        throw error
      }
    }, (saved) => {
      if (!saved) return
      if (saved.state === "kept") setKept(true)
      else setReviewRequired(true)
      acceptSnapshot(saved.subscription)
    })
  }

  function resume() {
    void action.run(() => resumeRenewalForChange({
      load: () => getSubscription(token),
      resume: () => reactivateSubscription(token),
      current: () => readSession()?.token === token,
    }), acceptSnapshot)
  }

  function openPaymentSettings() {
    void action.run(() => createBillingPortalSession(token, `${appEnv.appUrl}/billing`), (saved) => {
      window.location.href = saved.url
    })
  }

  const title = pick(kept ? cancelPlanChangeText.successTitle : keepRequested ? changeDialogTitle("keep", planName(plan)) : resultCopy?.title || changeDialogTitle(intent))

  function body() {
    if (kept) return <Notice tone="success">{pick(cancelPlanChangeText.successBody)}</Notice>
    if (keepRequested) {
      return (
        <div className="space-y-3">
          <p className={note}>{pick(cancelPlanChangeText.description)}</p>
          {currentSubscription.scheduled_change && (
            <Rows rows={[{
              label: pick(cancelPlanChangeText.scheduledChange),
              value: `${planName(currentSubscription.scheduled_change.plan)} · ${intervalName(currentSubscription.scheduled_change.billing_cycle)} · ${formatDate(currentSubscription.scheduled_change.effective_at)}`,
            }]} />
          )}
        </div>
      )
    }
    if (result && resultCopy) {
      const invoiceURL = result.pending_payment ? stripeInvoiceURL(result.pending_payment.invoice_url) : null
      return (
        <div className="space-y-3">
          <Notice tone={resultCopy.state === "payment" ? "info" : "success"}>{pick(resultCopy.body)}</Notice>
          {result.scheduled_change && (
            <p className={note}>{planName(result.scheduled_change.plan)} · {intervalName(result.scheduled_change.billing_cycle)} · {formatDate(result.scheduled_change.effective_at)}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {result.pending_payment ? invoiceURL ? (
              <a className={buttonStyles.primary} href={invoiceURL} target="_blank" rel="noopener noreferrer">{td.completePayment}</a>
            ) : (
              <Link className={buttonStyles.secondary} href="/billing">{td.reviewPayment}</Link>
            ) : null}
            {resultCopy.state === "updated" && (
              <Link className={buttonStyles.secondary} href="/billing#history" onClick={onClose}>{td.viewHistory}</Link>
            )}
          </div>
        </div>
      )
    }
    if (alreadyScheduled && currentSubscription.scheduled_change) {
      return (
        <div className="space-y-3">
          <Notice tone="success">{td.alreadyScheduled}</Notice>
          <Rows rows={[{ label: td.effectiveDate, value: formatDate(currentSubscription.scheduled_change.effective_at) }]} />
        </div>
      )
    }
    if (blocker === "payment" || blocker === "unavailable") {
      return (
        <div className="space-y-3">
          <p className={note}>{pick(restriction!)}</p>
          {paymentURL ? (
            <a className={buttonStyles.primary} href={paymentURL} target="_blank" rel="noopener noreferrer">{td.completePayment}</a>
          ) : (
            <button type="button" className={buttonStyles.primary} disabled={action.busy} onClick={openPaymentSettings}>
              {action.busy ? td.opening : td.reviewBilling}
            </button>
          )}
        </div>
      )
    }
    if (choice === "current") return <p className={note} role="status">{td.current}</p>
    if (!configured) return <p className={note}>{td.unavailable}</p>
    if (!previewable) {
      return (
        <p className={note}>
          {restriction ? pick(restriction) : td.reviewFirst}{" "}
          <Link href="/billing" className="font-medium text-primary hover:text-primary-hover">{pick(billingText.viewBilling)}</Link>
        </p>
      )
    }
    if (validPreview) {
      const timing = changeTimingText(validPreview)
      return (
        <div className="space-y-3" aria-live="polite">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-muted-foreground">{td.dueNow}</span>
            <strong className="text-2xl font-semibold tabular-nums text-foreground">{subscriptionPreviewAmount(validPreview, moneyLocale)}</strong>
          </div>
          <Rows rows={[
            ...(Number.isSafeInteger(validPreview.unused_credit_amount) && validPreview.unused_credit_amount! > 0
              ? [{ label: td.unusedCredit, value: `−${formatBillingAmount(validPreview.unused_credit_amount!, validPreview.currency, moneyLocale)}` }]
              : []),
            {
              label: td.timing,
              value: validPreview.effective_at_period_end
                ? `${pick(timing.label)} · ${formatDate(validPreview.current_period_end || validPreview.next_billing_at)}`
                : pick(timing.label),
            },
            ...(!validPreview.effective_at_period_end ? [{ label: td.nextBilling, value: formatDate(validPreview.next_billing_at) }] : []),
          ]} />
          <p className={note}>{pick(timing.detail)}</p>
          {blocker === "scheduled" && <p className={note}>{td.replacesScheduled}</p>}
          {paymentCopy && <p className={note}>{pick(paymentCopy)}</p>}
        </div>
      )
    }
    if (preview.status === "error") return <BillingFailure failure={preview.failure} onRetry={() => void loadPreview()} />
    if (preview.status === "ready") return <BillingFailure failure={{ kind: "unavailable", title: "", message: "", retryable: true }} onRetry={() => void loadPreview()} />
    return <p className={note} role="status">{td.loadingPreview}</p>
  }

  function primaryButton() {
    if (result || kept || alreadyScheduled || blocker === "payment" || blocker === "unavailable") return null
    if (keepRequested) {
      return (
        <button type="button" className={buttonStyles.primary} disabled={!keepConfirmable} onClick={keepPlan}>
          {pick(action.busy ? cancelPlanChangeText.submitting : planActionText("keep", planName(plan), interval))}
        </button>
      )
    }
    if (blocker === "cancellation") {
      return (
        <button type="button" className={buttonStyles.primary} disabled={action.busy || !configured} onClick={resume}>
          {action.busy ? td.restoring : td.resume}
        </button>
      )
    }
    return (
      <button type="button" className={buttonStyles.primary} disabled={!confirmable} onClick={confirm}>
        {action.busy ? td.submitting : pick(changeSubmitText({ choice, configured, phase: preview.status, preview: validPreview, amount: validPreview ? subscriptionPreviewAmount(validPreview, moneyLocale) : "" }))}
      </button>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !action.busy) onClose() }}>
      <DialogContent
        showCloseButton={!action.busy}
        className="radar-theme max-h-[90vh] overflow-y-auto rounded-2xl border-rule bg-raised sm:max-w-md"
        onEscapeKeyDown={(event) => { if (action.busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (action.busy) event.preventDefault() }}
      >
        <DialogTitle className="pr-6 text-lg font-semibold text-foreground">{title}</DialogTitle>
        <p className="flex items-center gap-2 text-sm">
          <strong className="font-semibold text-foreground">{planName(plan)}</strong>
          <span className="rounded-full bg-paper-3 px-2 py-0.5 text-xs text-muted-foreground">{intervalName(interval)}</span>
        </p>
        {body()}
        {!result && blocker === "cancellation" && <p className={note} role="status">{td.resumeFirst}</p>}
        {!result && !kept && !alreadyScheduled && reviewRequired && <p className={note} role="status">{td.detailsChanged}</p>}
        {pendingError ? (
          <p className={cn(note, "text-destructive")} role="alert">
            {td.statusChanged}{" "}
            <Link href="/billing" className="font-medium text-primary hover:text-primary-hover">{pick(billingText.viewBilling)}</Link>
          </p>
        ) : (
          <ApiErrorNotice error={action.error} />
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {primaryButton()}
          <button type="button" className={buttonStyles.secondary} disabled={action.busy} onClick={onClose}>
            {result || kept || alreadyScheduled ? td.done : keepRequested ? pick(cancelPlanChangeText.back) : td.cancel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
