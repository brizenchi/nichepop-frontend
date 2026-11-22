"use client"

import Link from "next/link"
import { useState } from "react"
import { AccountGate, AccountPage, ApiErrorNotice, Card, usePlanName, useAccountDate } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { buttonStyles } from "@/components/radar/ui"
import { usePageReturn } from "@/components/use-page-return"
import { useAccount } from "@/hooks/use-account"
import { useAccountResource } from "@/hooks/use-account-resource"
import { getMembership } from "@/lib/api"
import { cn } from "@/lib/utils"

/** Who is signed in and on which plan (GET /account/membership), and sign-out. */
export default function AccountProfilePage() {
  const t = useT().account.profile
  const planName = usePlanName()
  const formatDate = useAccountDate()
  const { session, user, signOut } = useAccount()
  const membership = useAccountResource(session?.token || "", getMembership)
  usePageReturn(membership.revalidate)
  const [signingOut, setSigningOut] = useState(false)
  const paid = membership.data?.active && membership.data.plan !== "free"

  return (
    <AccountPage title={t.title} intro={t.intro}>
      <AccountGate>
        <Card>
          <dl className="divide-y divide-border text-sm">
            <div className="pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.email}</dt>
              <dd className="mt-1 text-base font-medium text-foreground">{user?.email}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{t.emailNote}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.membership}</dt>
                <dd className="mt-1 flex items-center gap-2" aria-live="polite">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", paid ? "bg-pear text-ink" : "bg-paper-2 text-foreground ring-1 ring-rule")}>
                    {membership.loading && !membership.data ? t.loading : planName(membership.data?.plan)}
                  </span>
                  {membership.data?.valid_until && <span className="text-xs text-muted-foreground">{t.until(formatDate(membership.data.valid_until))}</span>}
                </dd>
              </div>
              <Link href="/billing" className={cn(buttonStyles.secondary, "h-9")}>{t.managePlan}</Link>
            </div>
          </dl>
          <ApiErrorNotice error={membership.error} onRetry={() => void membership.refresh()} />
          <div className="border-t border-border pt-4">
            <button
              type="button"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true)
                try {
                  await signOut()
                } finally {
                  setSigningOut(false)
                }
              }}
              className={cn(buttonStyles.ghost, "h-9 text-destructive")}
            >
              {signingOut ? t.signingOut : t.signOut}
            </button>
          </div>
        </Card>
      </AccountGate>
    </AccountPage>
  )
}
