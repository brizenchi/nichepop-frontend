"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { CreditCheckoutNotice } from "@/components/account/credit-checkout-notice"
import { AccountGate, AccountPage, ApiErrorNotice, Metric, Pager, useAccountDate } from "@/components/account/ui"
import { useLocale, usePick, useT } from "@/components/i18n/locale-provider"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { usePageReturn } from "@/components/use-page-return"
import { useAccount } from "@/hooks/use-account"
import { useAccountResource } from "@/hooks/use-account-resource"
import { creditNote, creditSource } from "@/lib/account"
import { signedCredits } from "@/lib/customer-records"
import { localizedHref } from "@/lib/i18n"
import { getCreditBalance, listCreditTransactions } from "@/lib/operations-api"
import { cn } from "@/lib/utils"

/** The credit ledger: balance, what expires and every grant and charge (GET /credits, /credits/transactions). */
export default function CreditsPage() {
  const t = useT().account.credits
  const locale = useLocale()
  const pick = usePick()
  const formatDate = useAccountDate()
  const { session, refresh: refreshAccount } = useAccount()
  const token = session?.token || ""
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [token])

  const balance = useAccountResource(token, getCreditBalance)
  const loadHistory = useCallback((key: string) => listCreditTransactions(key, page), [page])
  const history = useAccountResource(token, loadHistory)
  const { revalidate: revalidateHistory } = history
  const { revalidate: revalidateBalance } = balance
  const update = useCallback(async () => {
    await Promise.all([revalidateHistory(), revalidateBalance(), refreshAccount()])
  }, [revalidateHistory, revalidateBalance, refreshAccount])
  usePageReturn(update)

  const numbers = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US")
  const rows = history.data?.items ?? []

  return (
    <AccountPage
      title={t.title}
      intro={t.intro}
      actions={<Link href={localizedHref("/pricing", locale)} className={cn(buttonStyles.secondary, "h-9")}>{t.buy}</Link>}
    >
      <AccountGate>
        <CreditCheckoutNotice token={token} onConfirmed={update} />
        <ApiErrorNotice error={balance.error} onRetry={() => void balance.refresh()} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Metric label={t.available} value={balance.data ? numbers.format(balance.data.balance) : "—"} />
          <Metric label={t.expiring} value={balance.data ? numbers.format(balance.data.expiring_credits) : "—"} />
          <Metric
            label={t.nextExpiry}
            value={<span className="text-sm">{balance.data?.next_expiry_at ? formatDate(balance.data.next_expiry_at) : balance.data ? t.noExpiry : "—"}</span>}
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold text-foreground">{t.history}</h2>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">{t.historyNote}</p>
          <ApiErrorNotice error={history.error} onRetry={() => void history.refresh()} />
          {!history.error && (
            <div className={cn(cardStyles, "overflow-x-auto")}>
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">{t.source}</th>
                    <th className="px-2 py-2.5 text-right font-medium">{t.change}</th>
                    <th className="px-2 py-2.5 text-right font-medium">{t.balanceAfter}</th>
                    <th className="px-2 py-2.5 font-medium">{t.date}</th>
                    <th className="px-4 py-2.5 font-medium">{t.expires}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((item) => {
                    const description = creditNote(item)
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-foreground">{pick(creditSource(item))}</span>
                          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
                          {item.related_transaction_id ? <span className="block text-xs text-muted-foreground">{t.refundOf(String(item.related_transaction_id))}</span> : null}
                        </td>
                        <td className={cn("px-2 py-2.5 text-right font-semibold tabular-nums", item.amount > 0 ? "text-success" : "text-foreground")}>{signedCredits(item.amount)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-body">{numbers.format(item.balance_after)}</td>
                        <td className="px-2 py-2.5 tabular-nums text-muted-foreground">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{item.expires_at ? formatDate(item.expires_at) : "—"}</td>
                      </tr>
                    )
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">{history.loading ? t.loading : t.empty}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {history.data && (
                <Pager page={page} limit={history.data.limit || 20} total={history.data.total || 0} loading={history.loading} onPage={setPage} />
              )}
            </div>
          )}
        </section>
      </AccountGate>
    </AccountPage>
  )
}
