"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Layers, Package, Sprout, type LucideIcon } from "lucide-react"
import { ApiErrorNotice } from "@/components/account/ui"
import { BrandMark } from "@/components/brand-logo"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { usePlan } from "@/components/monitors/use-plan"
import { TagInput } from "@/components/radar/tag-input"
import { buttonStyles, cardStyles, inputStyles } from "@/components/radar/ui"
import { useAuthGate } from "@/hooks/use-auth-gate"
import { useMonitors } from "@/hooks/use-monitors"
import { useRadarWatchlist } from "@/hooks/use-radar-watchlist"
import { errorCode } from "@/lib/api/client"
import { cleanDomain } from "@/lib/utils/domain"
import { defaultXQuery } from "@/lib/data/monitors"
import { suggestedRoots } from "@/lib/data/radar"
import { localizedHref } from "@/lib/i18n"
import { ONBOARDING_DRAFT_KEY, ONBOARDING_KEY } from "@/lib/storageKeys"
import { cn } from "@/lib/utils"
import type { MonitorTrack } from "@/lib/types"

type Role = "sites" | "product" | "both"

const ROLES: { id: Role; icon: LucideIcon }[] = [
  { id: "sites", icon: Sprout },
  { id: "product", icon: Package },
  { id: "both", icon: Layers },
]

interface Draft {
  role: Role | null
  roots: string[]
  product: string
  description: string
}

const normalizeRoot = (raw: string) => {
  const value = raw.trim().toLowerCase().replace(/\s+/g, " ")
  return value && !value.includes("xxx") ? `xxx ${value}` : value
}

/** First run: pick what you work on, give the radar something to watch, land on a useful page. */
export default function StartPage() {
  const router = useRouter()
  const locale = useLocale()
  const dict = useT()
  const t = dict.start
  const { save: saveWatchlist } = useRadarWatchlist()
  const { add: addMonitor } = useMonitors()
  const { limits } = usePlan()
  const { gate, dialog } = useAuthGate()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>({ role: null, roots: [], product: "", description: "" })
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<unknown>(null)

  // Keep the draft across a Google sign-in round trip; people who already finished go straight to Today.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(ONBOARDING_KEY) && !window.localStorage.getItem(ONBOARDING_DRAFT_KEY)) {
        router.replace("/trends")
        return
      }
      const stored = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Draft
        setDraft(parsed)
        if (parsed.role) setStep(2)
      }
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    }
  }, [router])

  const update = (patch: Partial<Draft>) =>
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next))
      return next
    })

  const wantsSites = draft.role === "sites" || draft.role === "both"
  const wantsProduct = draft.role === "product" || draft.role === "both"

  const complete = async () => {
    setSaveError(null)
    try {
      if (wantsSites) {
        await saveWatchlist({ roots: draft.roots, sites: [], delivery: { email: "", realtimeAlerts: limits.checkEvery === "hour" } })
      }
      let productDomain = ""
      if (wantsProduct) {
        productDomain = cleanDomain(draft.product)
        const tracks: MonitorTrack[] = limits.xPosts > 0 ? ["mentions", "competitors", "rankings", "trends"] : ["competitors", "rankings", "trends"]
        try {
          await addMonitor({
            kind: "product",
            name: productDomain,
            description: draft.description.trim(),
            site: productDomain,
            xQuery: defaultXQuery("product", productDomain),
            competitors: [],
            rankKeywords: [],
            tracks,
            delivery: limits.checkEvery === "hour" ? "realtime" : "digest",
            channels: ["email"],
          })
        } catch (failure) {
          // Coming back through onboarding: the product is already monitored.
          if (errorCode(failure) !== "DUPLICATE") throw failure
        }
      }
      window.localStorage.setItem(ONBOARDING_KEY, draft.role ?? "sites")
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
      // Product owners start a chat about their product; site builders land on their trends.
      router.push(wantsProduct ? `/ask?${new URLSearchParams({ q: productDomain }).toString()}` : "/trends")
    } catch (failure) {
      setSaveError(failure)
    }
  }

  const finish = () => {
    if (wantsSites && draft.roots.length === 0) {
      setError(t.errorRoots)
      return
    }
    if (wantsProduct && !draft.product.trim()) {
      setError(t.errorProduct)
      return
    }
    setError(null)
    gate("save", complete)
  }

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
      <header className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
        <Link href={localizedHref("/", locale)} className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">NichePop</span>
        </Link>
        <LanguageSwitcher compact />
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
        <p className="text-xs font-medium text-muted-foreground">{t.step(step, 2)}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {[1, 2].map((n) => (
            <span key={n} className={cn("h-1 flex-1 rounded-full", n <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>

        {step === 1 && (
          <section className="mt-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.intro}</p>
            <div className="mt-6 grid gap-3" role="radiogroup">
              {ROLES.map(({ id, icon: Icon }) => {
                const selected = draft.role === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update({ role: id })}
                    className={cn(
                      cardStyles,
                      "flex items-center gap-4 p-4 text-left transition-colors cursor-pointer",
                      selected ? "border-primary bg-primary-soft" : "hover:border-primary/40",
                    )}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary text-white" : "bg-subtle text-muted-foreground ring-1 ring-border")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">{t.roles[id].label}</span>
                      <span className="block text-sm text-muted-foreground">{t.roles[id].hint}</span>
                    </span>
                    {selected && <Check className="h-5 w-5 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Link href="/trends" className="text-sm text-muted-foreground hover:text-foreground">
                {t.skip}
              </Link>
              <button onClick={() => setStep(2)} disabled={!draft.role} className={cn(buttonStyles.primary, "h-10 px-5")}>
                {t.next}
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 space-y-6">
            {wantsSites && (
              <div className={cn(cardStyles, "space-y-3 p-5")}>
                <h2 className="text-lg font-semibold text-foreground">{t.rootsTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.rootsIntro}</p>
                <TagInput values={draft.roots} onChange={(roots) => update({ roots })} max={10} placeholder="codes, tier list, ai…" suggestions={suggestedRoots} normalize={normalizeRoot} />
              </div>
            )}
            {wantsProduct && (
              <div className={cn(cardStyles, "space-y-3 p-5")}>
                <h2 className="text-lg font-semibold text-foreground">{t.productTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.productIntro}</p>
                <input value={draft.product} onChange={(e) => update({ product: e.target.value })} placeholder="yourproduct.com" aria-label={t.productTitle} className={inputStyles} />
                <input
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder={dict.monitors.descriptionPlaceholder}
                  aria-label={dict.monitors.description}
                  className={inputStyles}
                />
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <ApiErrorNotice error={saveError} />
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className={cn(buttonStyles.ghost, "h-10 px-2")}>
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </button>
              <button onClick={finish} className={cn(buttonStyles.primary, "h-10 px-5")}>
                {wantsProduct ? t.finishProduct : t.finish}
              </button>
            </div>
          </section>
        )}
      </main>
      {dialog}
    </div>
  )
}
