"use client"

// YOURS. NichePop's sign-in form on the template's sign-in logic
// (components/sign-in-panel.tsx): the methods come from GET /capabilities,
// the invite code saved by /invite goes along with the first sign-up, Google
// sign-in is browser-bound (lib/oauth-flow.ts) and comes back through /login.

import { useEffect, useRef, useState } from "react"
import { useT } from "@/components/i18n/locale-provider"
import { buttonStyles, inputStyles } from "@/components/radar/ui"
import { ApiError, sendCode, verifyCode, type OAuthProvider } from "@/lib/api"
import { clearReferralCode, readReferralCode, readSession, REFERRAL_EVENT, writeSession, type AuthSession } from "@/lib/auth"
import { resolveAuthMethods, type AuthMethodCapabilities } from "@/lib/auth-methods"
import { appEnv } from "@/lib/env"
import { getOAuthRedirectURL, resolveSignInDestination } from "@/lib/oauth-flow"
import { beginRequestGeneration, invalidateRequestGeneration, isCurrentRequestGeneration } from "@/lib/request-generation"
import { idleResource, loadingResource, readyResource, settleResource, type ResourceState } from "@/lib/request-state"
import { loadSignInMethods, peekSignInMethods } from "@/lib/sign-in-methods-cache"
import { cn } from "@/lib/utils"

/** Signing in from a page Google may not return to (home, blog…) lands on Ask AI. */
const DEFAULT_RETURN = "/ask"

function oauthDestination(returnTo?: string): string {
  const here = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const destination = resolveSignInDestination(here, returnTo)
  // The template falls back to /account; NichePop's start page is /ask.
  return returnTo === undefined && destination === "/account" && window.location.pathname !== "/account" ? DEFAULT_RETURN : destination
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError || error instanceof Error ? error.message || fallback : fallback
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.3 15.2 18.8 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6 28.9 4 24 4 16 4 9.3 8.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.9 0 11.4-2.3 15.4-6.1l-7.1-5.9C30.2 33.3 27.2 34 24 34c-5.2 0-9.6-3.3-11.3-8l-6.5 5c3 6.1 9.7 10 17.8 10z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.5-4.3 5.9.1-.1 7.1 5.9 7.1 5.9 3-2.8 5.2-6.7 6-11.1.5-2.3.5-4.6.5-6.2z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.4 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

type SignInFormProps = {
  /** Where Google sends the reader back to; defaults to this page when it is an app page, else /ask. */
  returnTo?: string
  /** Called after an email sign-in; Google sign-in leaves the page instead. */
  onSignedIn?: (session: AuthSession) => void
}

export function SignInForm({ returnTo, onSignedIn }: SignInFormProps) {
  const t = useT().login
  const ts = useT().account.signIn
  const te = useT().account.errors
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sent, setSent] = useState<{ email: string; debugCode?: string } | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState<"" | "send" | "verify" | OAuthProvider>("")
  const [error, setError] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [methods, setMethods] = useState<ResourceState<AuthMethodCapabilities>>(() => {
    const cached = peekSignInMethods()
    return cached ? readyResource(cached) : idleResource()
  })
  const mounted = useRef(false)
  const methodsGeneration = useRef(0)
  const emailGeneration = useRef(0)

  const available = methods.status === "ready"
    ? resolveAuthMethods(methods.data, {
        emailConfigured: appEnv.authEmailConfigured,
        emailEnabled: appEnv.authEmailEnabled,
        oauthProvidersConfigured: appEnv.authOAuthProvidersConfigured,
        oauthProviders: appEnv.authOAuthProviders,
      })
    : null
  const emailEnabled = available?.emailEnabled ?? false
  const providers = available?.oauthProviders ?? []

  useEffect(() => {
    mounted.current = true
    const syncReferral = () => setReferralCode(readReferralCode())
    syncReferral()
    void loadMethods()
    window.addEventListener(REFERRAL_EVENT, syncReferral)
    window.addEventListener("storage", syncReferral)
    return () => {
      window.removeEventListener(REFERRAL_EVENT, syncReferral)
      window.removeEventListener("storage", syncReferral)
      mounted.current = false
      invalidateRequestGeneration(methodsGeneration)
      invalidateRequestGeneration(emailGeneration)
    }
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function loadMethods(force = false) {
    if (!mounted.current) return
    const generation = beginRequestGeneration(methodsGeneration)
    const cached = force ? null : peekSignInMethods()
    if (cached) {
      setMethods(readyResource(cached))
      return
    }
    setMethods((current) => loadingResource(current.data))
    const next = await settleResource(loadSignInMethods(force), "Sign-in methods")
    if (mounted.current && isCurrentRequestGeneration(methodsGeneration, generation)) setMethods(next)
  }

  // An email step only lands if nothing else signed this browser in meanwhile.
  const current = (generation: number, token: string) =>
    mounted.current && isCurrentRequestGeneration(emailGeneration, generation) && (readSession()?.token || "") === token

  async function handleSendCode() {
    if (!email.includes("@")) {
      setError(t.invalidEmail)
      return
    }
    const generation = beginRequestGeneration(emailGeneration)
    const token = readSession()?.token || ""
    setBusy("send")
    setError("")
    try {
      const result = await sendCode(email)
      if (!current(generation, token)) return
      setSent({ email: result.email, debugCode: result.debug_code })
      setCountdown(60)
    } catch (err) {
      if (current(generation, token)) setError(errorMessage(err, te.generic))
    } finally {
      if (mounted.current && isCurrentRequestGeneration(emailGeneration, generation)) setBusy("")
    }
  }

  async function handleVerify() {
    if (!sent) return
    if (code.trim().length < 4) {
      setError(t.enterCode)
      return
    }
    const generation = beginRequestGeneration(emailGeneration)
    const token = readSession()?.token || ""
    setBusy("verify")
    setError("")
    try {
      const session = await verifyCode(sent.email, code.trim(), readReferralCode())
      if (!current(generation, token)) return
      clearReferralCode()
      writeSession(session)
      onSignedIn?.(session)
    } catch (err) {
      if (current(generation, token)) setError(errorMessage(err, t.loginFailed))
    } finally {
      if (mounted.current && isCurrentRequestGeneration(emailGeneration, generation)) setBusy("")
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    setBusy(provider)
    setError("")
    try {
      window.location.href = await getOAuthRedirectURL(provider, oauthDestination(returnTo))
    } catch (err) {
      setError(errorMessage(err, t.network))
      setBusy("")
    }
  }

  if (!appEnv.apiConfigured && process.env.NODE_ENV === "production") {
    return <p role="alert" className="rounded-2xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">{te.apiMissing}</p>
  }

  return (
    <div className="space-y-4">
      {referralCode && (
        <p role="status" className="rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm text-body">
          {ts.inviteSaved(referralCode)}
        </p>
      )}

      {(methods.status === "idle" || methods.status === "loading") && (
        <p role="status" className="text-center text-sm text-muted-foreground">{ts.loadingMethods}</p>
      )}
      {methods.status === "error" && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">
          {ts.methodsFailed}
          {methods.failure.requestId && <span className="mt-1 block text-xs">{te.requestId}: <code>{methods.failure.requestId}</code></span>}
          {methods.failure.retryable && (
            <button type="button" onClick={() => void loadMethods(true)} className={cn(buttonStyles.secondary, "mt-2 h-8")}>
              {te.retry}
            </button>
          )}
        </div>
      )}

      {providers.map((provider) => {
        const name = provider === "github" ? "GitHub" : "Google"
        return (
          <button
            key={provider}
            type="button"
            onClick={() => void handleOAuth(provider)}
            disabled={busy !== ""}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
            {busy === provider ? ts.redirecting : ts.continueWith(name)}
          </button>
        )
      })}

      {emailEnabled && providers.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {ts.or}
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {emailEnabled && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void (sent ? handleVerify() : handleSendCode())
          }}
        >
          {!sent ? (
            <>
              <label htmlFor="sign-in-email" className="text-sm font-medium text-foreground">{t.emailLabel}</label>
              <input
                id="sign-in-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.emailPlaceholder}
                className={inputStyles}
                disabled={busy !== ""}
              />
              <button type="submit" disabled={busy !== "" || !email} className={cn(buttonStyles.primary, "w-full")}>
                {busy === "send" ? t.sending : t.sendCode}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-body">
                {ts.sentTo(sent.email)}{" "}
                <button type="button" onClick={() => { setSent(null); setCode(""); setError("") }} className="cursor-pointer font-medium text-primary hover:text-primary-hover">
                  {ts.changeEmail}
                </button>
              </p>
              <label htmlFor="sign-in-code" className="text-sm font-medium text-foreground">{t.codeLabel}</label>
              <input
                id="sign-in-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder={t.codePlaceholder}
                maxLength={6}
                className={inputStyles}
                disabled={busy !== ""}
              />
              <button type="submit" disabled={busy !== "" || !code} className={cn(buttonStyles.primary, "w-full")}>
                {busy === "verify" ? t.signingIn : t.signIn}
              </button>
              <button
                type="button"
                onClick={() => void handleSendCode()}
                disabled={countdown > 0 || busy !== ""}
                className="w-full cursor-pointer text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
              >
                {countdown > 0 ? t.resendIn(countdown) : t.resend}
              </button>
            </>
          )}
        </form>
      )}

      {methods.status === "ready" && !emailEnabled && providers.length === 0 && (
        <p role="alert" className="text-center text-sm text-destructive">{ts.noMethods}</p>
      )}
      {sent?.debugCode && <p role="status" className="text-center text-xs text-muted-foreground">{ts.debugCode(sent.debugCode)}</p>}
      {error && (
        <p role="alert" className="rounded-2xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
