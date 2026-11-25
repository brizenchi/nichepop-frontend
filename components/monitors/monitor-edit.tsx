"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AccountGate } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { PricingModal } from "@/components/pricing-modal"
import { buttonStyles } from "@/components/radar/ui"
import { ErrorState, LoadingState } from "@/components/workspace/resource-states"
import { useAccount } from "@/hooks/use-account"
import { useMonitor } from "@/hooks/use-monitors"
import { updateMonitor } from "@/lib/api/monitors"
import type { MonitorDraft } from "@/lib/data/monitors"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { MonitorForm } from "./monitor-form"

/** /monitors/[id]/edit: everything but the kind and the name, saved with PATCH /monitors/:id. */
export function MonitorEdit({ id }: { id: string }) {
  const { ready, isAuthenticated } = useAccount()
  if (!DEMO_MODE && !(ready && isAuthenticated)) {
    return (
      <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
        <main className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
          <AccountGate>{null}</AccountGate>
        </main>
      </div>
    )
  }
  return <EditView id={id} />
}

function EditView({ id }: { id: string }) {
  const router = useRouter()
  const dict = useT()
  const t = dict.monitors
  const tm = dict.monitorManage
  const { data: monitor, error, loading, reload } = useMonitor(id)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [showPricing, setShowPricing] = useState(false)

  const save = async (draft: MonitorDraft) => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateMonitor(id, draft)
      router.push(`/monitors/${id}`)
    } catch (failure) {
      setSaveError(failure)
      setSaving(false)
    }
  }

  return (
    <div className="radar-theme min-h-screen bg-radar-bg text-radar-text">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
        <Link href={`/monitors/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {monitor?.name ?? t.back}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{tm.editTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tm.editIntro}</p>

        {error ? (
          <ErrorState error={error} onRetry={() => void reload()} className="mt-6" />
        ) : !monitor ? (
          loading ? (
            <LoadingState className="mt-6" />
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t.notFound}</p>
          )
        ) : monitor.demo ? (
          <p className="mt-6 text-sm text-muted-foreground">{dict.common.demoNote}</p>
        ) : (
          <MonitorForm
            key={monitor.id}
            initial={monitor}
            editing
            saving={saving}
            error={saveError}
            submitLabel={tm.saveChanges}
            onSubmit={(draft) => void save(draft)}
            onUpgrade={() => setShowPricing(true)}
            footer={
              <Link href={`/monitors/${id}`} className={cn(buttonStyles.ghost, "h-9 w-full")}>
                {tm.cancel}
              </Link>
            }
          />
        )}
      </main>
      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.title} />
    </div>
  )
}
