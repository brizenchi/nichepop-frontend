"use client"

// The template's referral center (app/(default)/(private)/(customer)/referrals)
// in NichePop's style: the same requests, request generations and
// background refreshes; only the presentation differs.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useT } from "@/components/i18n/locale-provider"
import { AccountGate, AccountPage, Card, Metric, Notice, Pager, useAccountDate } from "@/components/account/ui"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { usePageReturn } from "@/components/use-page-return"
import { useAccount } from "@/hooks/use-account"
import {
  getCapabilities,
  getReferralCode,
  getReferralStats,
  listReferrals,
  type CapabilitiesView,
  type ReferralCodeResult,
  type ReferralStats,
} from "@/lib/api"
import { readSession } from "@/lib/auth"
import {
  beginRequestGeneration,
  invalidateRequestGeneration,
  isCurrentRequestGeneration,
} from "@/lib/request-generation"
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
import { cn } from "@/lib/utils"

const REWARD = { signup: { you: 200, friend: 200 }, payment: { you: 200, friend: 200 } }

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-paper-3 text-body",
  activated: "bg-success-soft text-success",
  expired: "bg-paper-2 text-muted-foreground",
}

/** A failed request, in this page's words (the template's displayFailure), with the request ID for support. */
function FailureNotice({ failure, message, onRetry }: { failure: RequestFailure; message: string; onRetry?: () => void }) {
  const t = useT().referrals
  return (
    <Notice tone="error">
      <span>{message}</span>
      {failure.requestId && <span className="mt-1 block text-xs">{t.requestId}: <code>{failure.requestId}</code></span>}
      {failure.retryable && onRetry && (
        <button type="button" onClick={onRetry} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
          {t.retry}
        </button>
      )}
    </Notice>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p role="status" className="text-sm text-muted-foreground">{children}</p>
}

export default function ReferralsPage() {
  const t = useT().referrals
  const formatDate = useAccountDate()
  const { session } = useAccount()
  const [capabilitiesState, setCapabilitiesState] = useState<ResourceState<CapabilitiesView>>(idleResource())
  const [codeState, setCodeState] = useState<ResourceState<ReferralCodeResult>>(idleResource())
  const [statsState, setStatsState] = useState<ResourceState<ReferralStats>>(idleResource())
  const [listState, setListState] = useState<ResourceState<Awaited<ReturnType<typeof listReferrals>>>>(idleResource())
  const [status, setStatus] = useState("")
  const [actionFailure, setActionFailure] = useState<RequestFailure | null>(null)
  const capabilitiesGenerationRef = useRef(0)
  const capabilitiesMountedRef = useRef(false)
  const codeGenerationRef = useRef(0)
  const statsGenerationRef = useRef(0)
  const listGenerationRef = useRef(0)
  const copyGenerationRef = useRef(0)
  const code = codeState.data
  const stats = statsState.data
  const items = listState.data?.items || []
  const page = listState.data?.page || 1
  const referralEnabled = capabilitiesState.status === "ready" && capabilitiesState.data.referral.enabled
  const referralDisabled = capabilitiesState.status === "ready" && !capabilitiesState.data.referral.enabled
  const sessionToken = session?.token || ""

  const loadCodeState = useCallback(async (token: string, background = false) => {
    if (readSession()?.token !== token) return
    const generation = beginRequestGeneration(codeGenerationRef)
    setCodeState((current) => startResourceRefresh(current, background))
    const nextState = await settleResource(getReferralCode(token), "Referral link")
    if (readSession()?.token === token && isCurrentRequestGeneration(codeGenerationRef, generation)) {
      setCodeState((current) => reconcileResourceRefresh(current, nextState, background))
    }
  }, [])

  const loadStatsState = useCallback(async (token: string, background = false) => {
    if (readSession()?.token !== token) return
    const generation = beginRequestGeneration(statsGenerationRef)
    setStatsState((current) => startResourceRefresh(current, background))
    const nextState = await settleResource(getReferralStats(token), "Referral statistics")
    if (readSession()?.token === token && isCurrentRequestGeneration(statsGenerationRef, generation)) {
      setStatsState((current) => reconcileResourceRefresh(current, nextState, background))
    }
  }, [])

  const loadListState = useCallback(async (token: string, requestedPage = 1, background = false) => {
    if (readSession()?.token !== token) return
    const generation = beginRequestGeneration(listGenerationRef)
    setListState((current) => startResourceRefresh(current, background))
    const nextState = await settleResource(listReferrals(token, requestedPage), "Referral history")
    if (readSession()?.token === token && isCurrentRequestGeneration(listGenerationRef, generation)) {
      setListState((current) => reconcileResourceRefresh(current, nextState, background))
    }
  }, [])

  const load = useCallback(async (token: string, background = false, requestedPage = 1) => {
    await Promise.all([
      loadCodeState(token, background),
      loadStatsState(token, background),
      loadListState(token, requestedPage, background),
    ])
  }, [loadCodeState, loadListState, loadStatsState])

  const updateOnReturn = useCallback(() => {
    if (sessionToken && referralEnabled) void load(sessionToken, true, page)
  }, [sessionToken, referralEnabled, load, page])
  usePageReturn(updateOnReturn)

  const loadCapabilitiesState = useCallback(async () => {
    if (!capabilitiesMountedRef.current) return
    const generation = beginRequestGeneration(capabilitiesGenerationRef)
    setCapabilitiesState((current) => loadingResource(current.data))
    const nextState = await settleResource(getCapabilities(), "API capabilities")
    if (capabilitiesMountedRef.current && isCurrentRequestGeneration(capabilitiesGenerationRef, generation)) {
      setCapabilitiesState(nextState)
    }
  }, [])

  useEffect(() => {
    capabilitiesMountedRef.current = true
    void loadCapabilitiesState()
    return () => {
      capabilitiesMountedRef.current = false
      invalidateRequestGeneration(capabilitiesGenerationRef)
    }
  }, [loadCapabilitiesState])

  useEffect(() => {
    if (!sessionToken || !referralEnabled) {
      invalidateRequestGeneration(codeGenerationRef)
      invalidateRequestGeneration(statsGenerationRef)
      invalidateRequestGeneration(listGenerationRef)
      invalidateRequestGeneration(copyGenerationRef)
      setCodeState(idleResource())
      setStatsState(idleResource())
      setListState(idleResource())
      setStatus("")
      setActionFailure(null)
      return
    }
    void load(sessionToken)
    return () => {
      invalidateRequestGeneration(codeGenerationRef)
      invalidateRequestGeneration(statsGenerationRef)
      invalidateRequestGeneration(listGenerationRef)
      invalidateRequestGeneration(copyGenerationRef)
    }
  }, [sessionToken, referralEnabled, load])

  async function copyLink() {
    if (!code?.link) return
    const requestToken = sessionToken
    const generation = beginRequestGeneration(copyGenerationRef)
    setActionFailure(null)
    setStatus("")
    try {
      await navigator.clipboard.writeText(code.link)
      if (readSession()?.token === requestToken && isCurrentRequestGeneration(copyGenerationRef, generation)) {
        setStatus(t.copied)
      }
    } catch (error) {
      if (readSession()?.token === requestToken && isCurrentRequestGeneration(copyGenerationRef, generation)) {
        setActionFailure({ ...describeRequestFailure(error, "Clipboard access"), message: t.copyFailed, retryable: false })
      }
    }
  }

  const statusLabel = (value: string) =>
    value === "pending" ? t.pending : value === "activated" ? t.activated : value === "expired" ? t.expired : value
  const statusHelp = (value: string) =>
    value === "pending" ? t.pendingHelp : value === "activated" ? t.activatedHelp : value === "expired" ? t.expiredHelp : undefined

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
      <AccountPage title={t.title} intro={t.intro}>
        {capabilitiesState.status === "error" ? (
          <FailureNotice failure={capabilitiesState.failure} message={t.failed} onRetry={() => void loadCapabilitiesState()} />
        ) : referralDisabled ? (
          <Notice>{t.unavailable}</Notice>
        ) : null}

        <AccountGate>
          {capabilitiesState.status !== "error" && !referralDisabled && (
            <>
              <Card title={t.link}>
                {code ? (
                  <div className="space-y-3">
                    <label className="sr-only" htmlFor="referral-link">{t.shareLink}</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="referral-link"
                        type="text"
                        readOnly
                        value={code.link || ""}
                        onFocus={(event) => event.currentTarget.select()}
                        className={cn(inputStyles, "min-w-0 flex-1 font-mono text-xs")}
                      />
                      <button type="button" disabled={!code.link} onClick={() => void copyLink()} className={cn(buttonStyles.primary, "h-10 shrink-0")}>
                        {t.copy}
                      </button>
                    </div>
                    {!code.link && <Notice tone="error">{t.missingLink}</Notice>}
                  </div>
                ) : codeState.status === "error" ? (
                  <FailureNotice failure={codeState.failure} message={t.failed} onRetry={() => session && void loadCodeState(session.token)} />
                ) : (
                  <Empty>{codeState.status === "loading" ? t.loadingLink : t.emptyLink}</Empty>
                )}

                <table className="mt-5 w-full text-sm">
                  <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.rewards}</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th scope="col" className="py-2 font-medium">{t.rewardUnit}</th>
                      <th scope="col" className="py-2 text-right font-medium">{t.you}</th>
                      <th scope="col" className="py-2 text-right font-medium">{t.friend}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    <tr>
                      <th scope="row" className="py-2 text-left font-normal text-body">{t.signup}</th>
                      <td className="py-2 text-right font-semibold text-foreground">+{REWARD.signup.you}</td>
                      <td className="py-2 text-right font-semibold text-foreground">+{REWARD.signup.friend}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="py-2 text-left font-normal text-body">{t.payment}</th>
                      <td className="py-2 text-right font-semibold text-foreground">+{REWARD.payment.you}</td>
                      <td className="py-2 text-right font-semibold text-foreground">+{REWARD.payment.friend}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted-foreground">{t.rewardNote}</p>

                {(status || actionFailure) && (
                  <div className="mt-4">
                    {status && <Notice tone="success">{status}</Notice>}
                    {actionFailure && <Notice tone="error">{actionFailure.message}</Notice>}
                  </div>
                )}
              </Card>

              <section aria-labelledby="referral-stats">
                <h2 id="referral-stats" className="mb-3 text-sm font-semibold text-foreground">{t.stats}</h2>
                {stats ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Metric label={t.total} value={stats.total_referred} />
                    <Metric label={t.activated} value={stats.activated} />
                    <Metric label={t.credits} value={stats.total_reward_credits} />
                  </div>
                ) : statsState.status === "error" ? (
                  <FailureNotice failure={statsState.failure} message={t.failed} onRetry={() => session && void loadStatsState(session.token)} />
                ) : (
                  <Empty>{statsState.status === "loading" ? t.loadingStats : t.emptyStats}</Empty>
                )}
              </section>

              <section aria-labelledby="referral-history">
                <h2 id="referral-history" className="mb-3 text-sm font-semibold text-foreground">{t.history}</h2>
                {listState.status === "error" && (
                  <div className="mb-3">
                    <FailureNotice failure={listState.failure} message={t.failed} onRetry={() => session && void loadListState(session.token, page)} />
                  </div>
                )}
                {items.length > 0 ? (
                  <div className={cn(cardStyles, "overflow-hidden")}>
                    <div className="overflow-x-auto" aria-busy={listState.status === "loading"}>
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">{t.person}</th>
                            <th className="px-2 py-2.5 font-medium">{t.state}</th>
                            <th className="px-2 py-2.5 text-right font-medium">{t.credits}</th>
                            <th className="px-2 py-2.5 font-medium">{t.joined}</th>
                            <th className="px-2 py-2.5 font-medium">{t.deadline}</th>
                            <th className="px-4 py-2.5 font-medium">{t.activatedAt}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="max-w-[10rem] px-4 py-2.5">
                                <span className="block truncate font-mono text-xs text-foreground" title={item.referee_id}>{item.referee_id}</span>
                              </td>
                              <td className="px-2 py-2.5">
                                <span title={statusHelp(item.status)} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[item.status] ?? STATUS_STYLES.pending)}>
                                  {statusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 text-right tabular-nums text-foreground">{item.reward_credits}</td>
                              <td className="px-2 py-2.5 tabular-nums text-muted-foreground">{formatDate(item.created_at)}</td>
                              <td className="px-2 py-2.5 tabular-nums text-muted-foreground">{item.expires_at ? formatDate(item.expires_at) : t.noDeadline}</td>
                              <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{formatDate(item.activated_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pager
                      page={page}
                      limit={listState.data?.limit || 20}
                      total={listState.data?.total || 0}
                      loading={listState.status === "loading"}
                      onPage={(next) => session && void loadListState(session.token, next)}
                    />
                  </div>
                ) : listState.status !== "error" ? (
                  <Empty>{listState.status === "loading" ? t.loadingList : t.emptyList}</Empty>
                ) : null}
              </section>
            </>
          )}
        </AccountGate>
      </AccountPage>
    </div>
  )
}
