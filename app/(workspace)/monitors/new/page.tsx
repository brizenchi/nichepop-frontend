"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { MonitorForm, NEW_MONITOR } from "@/components/monitors/monitor-form"
import { usePlan } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { useMonitors } from "@/hooks/use-monitors"
import { useAuthGate } from "@/hooks/use-auth-gate"
import type { MonitorDraft } from "@/lib/data/monitors"
import type { MonitorKind } from "@/lib/types"

const splitParam = (value: string | null) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [])

export default function NewMonitorPage() {
  return (
    <Suspense>
      <NewMonitorForm />
    </Suspense>
  )
}

/** Prefill from "Build it" on the radar or "Monitor this" in Ask AI. */
function draftFromParams(params: URLSearchParams): MonitorDraft {
  const name = params.get("name")
  if (!name) return NEW_MONITOR
  const requested = params.get("kind")
  const kind: MonitorKind = requested === "product" || requested === "market" ? requested : "keyword"
  const keywords = splitParam(params.get("keywords"))
  return { ...NEW_MONITOR, kind, name, competitors: splitParam(params.get("competitors")), rankKeywords: keywords.length ? keywords : kind === "keyword" ? [name] : [] }
}

function NewMonitorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useT().monitors
  const { custom, loaded, limits: listLimits, add } = useMonitors()
  const { limits } = usePlan()
  const { gate, dialog } = useAuthGate()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [showPricing, setShowPricing] = useState(false)
  const initial = useMemo(() => draftFromParams(searchParams), [searchParams])

  // Paused monitors do not count towards the plan. The API checks again (PLAN_LIMIT_REACHED).
  const atLimit = loaded && custom.filter((monitor) => monitor.status !== "paused").length >= (listLimits?.monitors ?? limits.monitors)

  const create = async (draft: MonitorDraft) => {
    setSaving(true)
    setSaveError(null)
    try {
      const monitor = await add(draft)
      router.push(`/monitors/${monitor.id}`)
    } catch (failure) {
      setSaveError(failure)
      setSaving(false)
    }
  }

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
        <Link href="/monitors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{t.newTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.newIntro}</p>

        <MonitorForm
          key={searchParams.toString()}
          initial={initial}
          saving={saving}
          error={saveError}
          atLimit={atLimit}
          submitLabel={t.save}
          onSubmit={(draft) => gate("monitor", () => create(draft))}
          onUpgrade={() => setShowPricing(true)}
        />
      </main>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.title} />
      {dialog}
    </div>
  )
}
