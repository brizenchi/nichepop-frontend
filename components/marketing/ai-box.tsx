"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Zap } from "lucide-react"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { PUBLIC_DELAY_HOURS, getDemoWords } from "@/lib/data/radar"
import { REPORT_KINDS } from "@/lib/data/reports"
import { DEMO_MODE } from "@/lib/demo"

/** The homepage's main call to action: ask a question, land in the workspace chat with it already asked. */
export function AiBox() {
  const router = useRouter()
  const locale = useLocale()
  const t = useT()
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const [burst, setBurst] = useState(0)
  // The "live trend" chip is a demo word; real builds leave it out until the trend library (frontend#8) feeds it.
  const fresh = DEMO_MODE
    ? getDemoWords(locale)
        .filter((w) => w.verdict === "build" && w.firstSeenHoursAgo < PUBLIC_DELAY_HOURS)
        .sort((a, b) => a.firstSeenHoursAgo - b.firstSeenHoursAgo)[0]
    : undefined

  const go = (question: string) => router.push(`/ask?${new URLSearchParams({ q: question.trim() }).toString()}`)

  // The typed question gets the star-burst; it plays briefly before the workspace opens.
  const submit = () => {
    if (!value.trim()) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return go(value)
    setBurst((n) => n + 1)
    window.setTimeout(() => go(value), 260)
  }

  return (
    <div className="w-full min-w-0">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="relative rounded-2xl bg-raised p-3 pt-4 shadow-lift ring-1 ring-rule transition-shadow focus-within:ring-2 focus-within:ring-sky sm:p-4 sm:pt-5"
      >
        {/* The character: a pear radar blip peeking over the box's corner. */}
        <div className="blip absolute -left-3 -top-7 sm:-left-6 sm:-top-8" data-state={focused || value ? "listening" : undefined} aria-hidden>
          <span className="blip__ring" />
          <span className="blip__core" />
          <span className="blip__eye blip__eye--l" />
          <span className="blip__eye blip__eye--r" />
          {burst > 0 && <span key={burst} className="star-burst" />}
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          rows={4}
          placeholder={t.home.boxPlaceholder}
          aria-label={t.home.boxLabel}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-base leading-relaxed text-foreground outline-none placeholder:text-faint sm:text-lg"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <span className="min-w-0 text-xs text-muted-foreground">{t.home.boxNote}</span>
          <button type="submit" disabled={!value.trim()} className="btn btn--lg ml-auto">
            {t.home.boxSubmit}
            <ArrowUp className="btn__arrow h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {fresh && (
          <button
            onClick={() => go(t.ask.todayTrend(fresh.keyword, fresh.firstSeenHoursAgo))}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-xs font-semibold text-success ring-1 ring-mint transition-colors hover:bg-mint/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky active:bg-mint/60 cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.home.liveTrend(fresh.keyword, fresh.firstSeenHoursAgo)}</span>
          </button>
        )}
        {REPORT_KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => go(t.ask.starters[kind])}
            className="max-w-full truncate rounded-full bg-raised px-3 py-1.5 text-xs text-body ring-1 ring-rule transition-colors hover:bg-sky-soft hover:text-sky-ink hover:ring-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky active:bg-sky/20 cursor-pointer"
          >
            {t.ask.starters[kind]}
          </button>
        ))}
      </div>
    </div>
  )
}
