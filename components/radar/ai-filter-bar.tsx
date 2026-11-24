"use client"

import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { DEMO_MODE } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { parseAiFilter } from "@/lib/utils/ai-filter"
import { DEFAULT_FILTERS, activeFilterChips, type RadarFilters } from "@/lib/utils/radar-filters"

interface AiFilterBarProps {
  onApply: (filters: RadarFilters) => void
}

/** One-sentence filter: the AI turns what you describe into radar filters. Free, no points. */
export function AiFilterBar({ onApply }: AiFilterBarProps) {
  const t = useT()
  const [text, setText] = useState("")
  const [result, setResult] = useState<{ filters: RadarFilters } | "none" | null>(null)

  const run = (value: string) => {
    setText(value)
    const parsed = parseAiFilter(value)
    if (!parsed) {
      setResult("none")
      return
    }
    const filters = { ...DEFAULT_FILTERS, ...parsed }
    setResult({ filters })
    onApply(filters)
  }

  const chips = result && result !== "none" ? activeFilterChips(result.filters, t) : []
  const sortLabel = result && result !== "none" && result.filters.sort !== "score" ? t.filters.sort[result.filters.sort] : null

  return (
    <div className="rounded-xl border border-primary/25 bg-card p-2 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(text)
        }}
        className="flex items-center gap-2"
      >
        <Sparkles className="ml-2 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.aiFilter.placeholder}
          aria-label={t.aiFilter.label}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
        />
        <span className="hidden shrink-0 rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success sm:inline">{t.aiFilter.free}</span>
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
        >
          {t.aiFilter.apply}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 px-2 pb-1 pt-2">
        {result === null &&
          t.aiFilter.examples.map((example) => (
            <button
              key={example}
              onClick={() => run(example)}
              className="rounded-full bg-subtle px-2.5 py-1 text-xs text-body transition-colors hover:bg-primary-soft hover:text-primary cursor-pointer"
            >
              {example}
            </button>
          ))}
        {result === "none" && <p className="text-xs text-warning">{t.aiFilter.notUnderstood}</p>}
        {result && result !== "none" && (
          <>
            <span className="text-xs font-medium text-muted-foreground">{t.aiFilter.understood}</span>
            {[...chips.map((chip) => chip.label), ...(sortLabel ? [`${t.filters.sortPrefix} ${sortLabel}`] : [])].map((label) => (
              <span key={label} className={cn("rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary")}>
                {label}
              </span>
            ))}
            {DEMO_MODE && <span className="ml-auto text-[11px] text-faint">{t.aiFilter.demoNote}</span>}
          </>
        )}
      </div>
    </div>
  )
}
