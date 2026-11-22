"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in-form"
import { BrandMark } from "@/components/brand-logo"
import { useT } from "@/components/i18n/locale-provider"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { ApiError } from "@/lib/api"
import { readSession, writeReferralCode } from "@/lib/auth"
import { exchangeOAuthCodeOnce } from "@/lib/oauth-exchange"
import { consumeOAuthCallbackError, resolveOAuthReturnTo } from "@/lib/oauth-flow"
import { cn } from "@/lib/utils"

/** Where a reader goes after signing in here, and when they are already signed in. */
const HOME = "/ask"

/**
 * Sign-in page and the landing of Google sign-in (auth.frontend_redirect on the
 * API): ?code=&flow= is exchanged once for a session (template lib/oauth-exchange.ts),
 * ?oauth_error= explains a canceled or failed sign-in, ?ref= keeps an invite code.
 */
function LoginPageInner() {
  const t = useT().account.loginPage
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const [exchanging, setExchanging] = useState(Boolean(code))
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && !readSession()) writeReferralCode(ref)
  }, [searchParams])

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error")
    const flowID = searchParams.get("flow") || ""
    if (oauthError) {
      consumeOAuthCallbackError(oauthError, flowID)
      setExchanging(false)
      setError(oauthError.trim().toLowerCase() === "access_denied" ? t.canceled : t.failed)
      return
    }
    if (!code) {
      if (readSession()) router.replace(HOME)
      return
    }

    let cancelled = false
    setExchanging(true)
    setError("")
    exchangeOAuthCodeOnce(code, flowID)
      .then(({ session, committed, returnTo }) => {
        if (cancelled) return
        if (!committed || readSession()?.token !== session.token) {
          // Another sign-in finished first in this browser; keep that one.
          if (readSession()) router.replace(HOME)
          else setError(t.stale)
          return
        }
        router.replace(resolveOAuthReturnTo(returnTo, session.user.role))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError && err.message ? err.message : t.failed)
      })
      .finally(() => {
        if (!cancelled) setExchanging(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt, code, router, searchParams, t])

  return (
    <div className="radar-theme grid min-h-dvh place-items-center bg-radar-bg px-4 py-12 text-radar-text">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <BrandMark className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight text-foreground">NichePop</span>
        </Link>
        <div className={cn(cardStyles, "space-y-6 p-8")}>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.intro}</p>
          </div>
          {exchanging ? (
            <p role="status" className="text-center text-sm text-body">{t.exchanging}</p>
          ) : (
            <>
              {error && (
                <div role="alert" className="rounded-2xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">
                  {error}
                  {code && (
                    <button type="button" onClick={() => setAttempt((n) => n + 1)} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
                      {t.retry}
                    </button>
                  )}
                </div>
              )}
              <SignInForm onSignedIn={() => router.push(HOME)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
