"use client"

import { ApiErrorNotice } from "@/components/account/ui"
import { useT } from "@/components/i18n/locale-provider"
import { buttonStyles } from "@/components/radar/ui"
import { errorCode } from "@/lib/api/client"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { usePlan } from "./use-plan"

/**
 * Why saving, resuming or creating a monitor was refused (docs/monitors.md): the plan's limit
 * or a Pro-only track comes with an upgrade button; other refusals say what to fix.
 */
export function MonitorSaveError({ error, onUpgrade }: { error: unknown; onUpgrade: () => void }) {
  const dict = useT()
  const t = dict.monitorManage.errors
  const { limits } = usePlan()
  if (!error) return null
  const code = errorCode(error)
  const data = error instanceof ApiError ? (error.data as { field?: string; limits?: { monitors?: number } } | null) : null

  if (code === "PLAN_LIMIT_REACHED" || code === "PLAN_FEATURE_UNAVAILABLE") {
    const text = code === "PLAN_LIMIT_REACHED" ? dict.monitors.limitReached(data?.limits?.monitors ?? limits.monitors) : t.feature
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">{text}</p>
        <button type="button" onClick={onUpgrade} className={cn(buttonStyles.primary, "h-9 shrink-0")}>
          {dict.common.upgrade}
        </button>
      </div>
    )
  }
  if (code === "DUPLICATE" || code === "INVALID") {
    const field = data?.field ?? ""
    return (
      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
        {code === "DUPLICATE" ? t.duplicate : t.invalid(t.fields[field] ?? field)}
      </p>
    )
  }
  return <ApiErrorNotice error={error} />
}
