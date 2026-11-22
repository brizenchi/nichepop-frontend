"use client"

// YOURS. The template's BillingHistory (components/billing-history.tsx) in
// NichePop's style: purchases and Stripe invoices joined by invoice ID, the
// loaded pages reloaded in the background when billing changes.

import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { ApiErrorNotice, useAccountDate } from "@/components/account/ui"
import { listInvoices, listPurchases, type InvoiceItem, type PurchaseItem } from "@/lib/api"
import { readSession } from "@/lib/auth"
import { formatBillingAmount } from "@/lib/billing-money"
import { formatCurrencyUSD } from "@/lib/format"
import { invoiceDownloadURL, paymentRecords, reloadLoadedPaymentPages } from "@/lib/payment-history"
import { retainEqualData } from "@/lib/resource-data"
import { describeRequestFailure } from "@/lib/request-state"
import { cn } from "@/lib/utils"

type History = {
  owner: string
  purchases: PurchaseItem[]
  invoices: InvoiceItem[]
  nextPurchasePage: number | null
  nextInvoicePage: number | null
  loading: boolean
  loaded: boolean
  purchasePages: number
  invoicePages: number
  errors: unknown[]
}

const initialHistory = (): History => ({ owner: "", purchases: [], invoices: [], nextPurchasePage: 1, nextInvoicePage: 1, loading: true, loaded: false, purchasePages: 0, invoicePages: 0, errors: [] })

const STATUS_TONES = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-destructive",
  neutral: "bg-paper-3 text-muted-foreground",
  warning: "bg-pear-soft text-ink",
}

export function BillingHistory({ token, revision = 0, invoicesEnabled = true }: { token: string; revision?: number; invoicesEnabled?: boolean }) {
  const t = useT().billing.history
  const locale = useLocale()
  const formatDate = useAccountDate()
  const [state, setState] = useState<History>(initialHistory)
  const snapshot = useRef(state)
  useEffect(() => {
    snapshot.current = state
  }, [state])
  const generation = useRef(0)
  const busy = useRef(false)

  const load = useCallback(async (owner: string, request: number, purchasePage: number | null, invoicePage: number | null, replace = false) => {
    if (busy.current || readSession()?.token !== owner) return
    const current = snapshot.current.owner === owner ? snapshot.current : initialHistory()
    const background = replace && current.loaded
    busy.current = true
    if (!background) setState((previous) => ({ ...(previous.owner === owner ? previous : initialHistory()), owner, loading: true, errors: [] }))
    const [purchases, invoices] = await Promise.allSettled([
      purchasePage ? (replace ? reloadLoadedPaymentPages((page) => listPurchases(owner, page), current.purchasePages) : listPurchases(owner, purchasePage)) : Promise.resolve(null),
      invoicePage ? (replace ? reloadLoadedPaymentPages((page) => listInvoices(owner, page), current.invoicePages) : listInvoices(owner, invoicePage)) : Promise.resolve(null),
    ])
    if (generation.current !== request || readSession()?.token !== owner) return
    busy.current = false
    setState((previous) => {
      const base = previous.owner === owner ? previous : initialHistory()
      const showFailure = (error: unknown) => !background || !describeRequestFailure(error, "Payments").retryable
      const errors = [
        ...(purchases.status === "rejected" && showFailure(purchases.reason) ? [purchases.reason] : []),
        ...(invoices.status === "rejected" && showFailure(invoices.reason) ? [invoices.reason] : []),
      ]
      const next: History = {
        owner,
        loading: false,
        loaded: base.loaded || (purchases.status === "fulfilled" && purchases.value !== null) || (invoices.status === "fulfilled" && invoices.value !== null),
        purchases: purchases.status === "fulfilled" && purchases.value
          ? retainEqualData(base.purchases, [...(replace ? [] : base.purchases), ...purchases.value.items])
          : purchases.status === "rejected" && showFailure(purchases.reason) && background ? [] : base.purchases,
        invoices: invoices.status === "fulfilled" && invoices.value
          ? retainEqualData(base.invoices, [...(replace ? [] : base.invoices), ...invoices.value.items])
          : invoices.status === "rejected" && showFailure(invoices.reason) && background ? [] : base.invoices,
        purchasePages: purchases.status === "fulfilled" && purchases.value ? purchases.value.page : base.purchasePages,
        invoicePages: invoices.status === "fulfilled" && invoices.value ? invoices.value.page : base.invoicePages,
        nextPurchasePage: purchases.status === "rejected"
          ? base.nextPurchasePage
          : purchases.value && purchases.value.page * purchases.value.limit < purchases.value.total ? purchases.value.page + 1 : null,
        nextInvoicePage: invoices.status === "rejected"
          ? base.nextInvoicePage
          : invoices.value && invoices.value.page * invoices.value.limit < invoices.value.total ? invoices.value.page + 1 : null,
        errors: errors.length === 0 && base.errors.length === 0 ? base.errors : errors,
      }
      return !base.loading && (Object.keys(next) as (keyof History)[]).every((key) => next[key] === base[key]) ? base : next
    })
  }, [])

  useEffect(() => {
    const counter = generation
    const request = ++counter.current
    busy.current = false
    void load(token, request, 1, invoicesEnabled ? 1 : null, true)
    return () => {
      counter.current++
    }
  }, [token, revision, invoicesEnabled, load])

  const history = state.owner === token ? state : initialHistory()
  const rows = paymentRecords(history.purchases, history.invoices)
  const loadMore = () => void load(token, generation.current, history.nextPurchasePage, history.nextInvoicePage)
  const moneyLocale = locale === "zh" ? "zh-CN" : "en-US"

  function status(value: string): { label: string; tone: keyof typeof STATUS_TONES } {
    if (value === "paid") return { label: t.statuses.paid, tone: "success" }
    if (value === "no_payment_required") return { label: t.statuses.none, tone: "success" }
    if (value === "failed" || value === "uncollectible") return { label: t.statuses.failed, tone: "danger" }
    if (value === "unpaid" || value === "open") return { label: t.statuses.unpaid, tone: "warning" }
    if (value === "void" || value === "canceled") return { label: t.statuses.canceled, tone: "neutral" }
    return { label: t.statuses.pending, tone: "warning" }
  }

  return (
    <section id="history" className={cardStyles}>
      <div id="invoices" />
      <h2 className="px-5 pb-3 pt-5 text-sm font-semibold text-foreground">{t.title}</h2>
      {history.errors.length > 0 && (
        <div className="space-y-2 px-5 pb-3">
          {history.errors.map((error, index) => (
            <ApiErrorNotice key={index} error={error} onRetry={loadMore} />
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">{t.title}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">{t.purchase}</th>
              <th className="px-2 py-2.5 font-medium">{t.amount}</th>
              <th className="px-2 py-2.5 font-medium">{t.status}</th>
              <th className="px-2 py-2.5 font-medium">{t.date}</th>
              <th className="px-5 py-2.5 text-right font-medium">{t.invoice}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-muted-foreground" role={history.loading ? "status" : undefined}>
                  {history.loading ? t.loading : t.empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const value = status(row.invoice?.status || row.purchase?.status || "")
                const url = invoiceDownloadURL(row.invoice)
                const product = row.purchase?.product_type && t.products[row.purchase.product_type] ? row.purchase.product_type : "payment"
                return (
                  <tr key={row.id}>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-foreground">{t.products[product]}</span>
                      <span className="block max-w-[16rem] truncate text-xs text-muted-foreground">{row.invoice?.id || row.id}</span>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-foreground">
                      {row.purchase ? formatBillingAmount(row.purchase.amount, row.purchase.currency, moneyLocale) : row.invoice ? formatCurrencyUSD(row.invoice.amount_usd) : "—"}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_TONES[value.tone])}>{value.label}</span>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-muted-foreground">{formatDate(row.created_at)}</td>
                    <td className="px-5 py-2.5 text-right">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:text-primary-hover">
                          {t.download} ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {history.nextPurchasePage || history.nextInvoicePage ? (
        <div className="border-t border-border px-5 py-3 text-center">
          <button type="button" disabled={history.loading} onClick={loadMore} className={cn(buttonStyles.secondary, "h-8")}>
            {history.loading ? t.loadingMore : t.more}
          </button>
        </div>
      ) : null}
    </section>
  )
}
