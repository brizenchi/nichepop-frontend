"use client"

// The template's invitation landing page (app/(default)/(private)/invite) in
// NichePop's style. An inbound ?ref= is saved only while signed out, so a
// code can't leak into a later sign-up on a shared browser; the sign-in
// dialog sends the saved code when the account is created.

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BrandMark } from "@/components/brand-logo"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { Notice } from "@/components/account/ui"
import LoginDialog from "@/components/LoginDialog"
import { buttonStyles, cardStyles } from "@/components/radar/ui"
import { readReferralCode, readSession, REFERRAL_EVENT, SESSION_EVENT, writeReferralCode, type AuthSession } from "@/lib/auth"
import { localizedHref } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function InvitePageInner() {
  const t = useT().referrals.invite
  const locale = useLocale()
  const params = useSearchParams()
  const [savedCode, setSavedCode] = useState("")
  const [session, setSession] = useState<AuthSession | null>(null)
  const [ready, setReady] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const inboundCode = params.get("ref")

  useEffect(() => {
    // Existing accounts can't accept another invitation. Don't save an
    // inbound code that could leak into a later sign-up on a shared browser.
    if (!readSession() && inboundCode !== null) {
      writeReferralCode(inboundCode)
    }
    const sync = () => {
      setSavedCode(readReferralCode())
      setSession(readSession())
      setReady(true)
    }
    sync()
    window.addEventListener(REFERRAL_EVENT, sync)
    window.addEventListener(SESSION_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(REFERRAL_EVENT, sync)
      window.removeEventListener(SESSION_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [inboundCode])

  return (
    <div className="radar-theme min-h-dvh bg-radar-bg text-radar-text">
      <header className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
        <Link href={localizedHref("/", locale)} className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">NichePop</span>
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-24 pt-10 sm:px-6">
        <p className="mono-label text-muted-foreground">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.intro}</p>

        <section className={cn(cardStyles, "mt-6 space-y-4 p-6")}>
          {!ready ? (
            <p role="status" className="text-sm text-muted-foreground">{t.loading}</p>
          ) : session ? (
            <>
              <Notice>{t.signedIn}</Notice>
              <div className="flex flex-wrap gap-2">
                <Link href="/ask" className={buttonStyles.primary}>{t.openWorkspace}</Link>
                <Link href="/referrals" className={buttonStyles.secondary}>{t.inviteFriends}</Link>
              </div>
            </>
          ) : savedCode ? (
            <>
              <Notice>
                <span className="font-medium text-foreground">{t.saved(savedCode)}</span>
                <span className="mt-1 block">{t.savedNote}</span>
              </Notice>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSignInOpen(true)} className={buttonStyles.primary}>{t.create}</button>
                <Link href={localizedHref("/", locale)} className={buttonStyles.secondary}>{t.explore}</Link>
              </div>
            </>
          ) : (
            <>
              <Notice>{t.noCode}</Notice>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSignInOpen(true)} className={buttonStyles.primary}>{t.createPlain}</button>
              </div>
            </>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">{t.how}</h2>
          <ol className="mt-3 space-y-3">
            {t.steps.map((step, i) => (
              <li key={step.label} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pear text-xs font-semibold text-ink">{i + 1}</span>
                <span>
                  <span className="font-medium text-foreground">{step.label}</span>
                  <span className="text-body"> · {step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <LoginDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageInner />
    </Suspense>
  )
}
