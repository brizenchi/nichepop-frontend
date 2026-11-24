"use client"

import { useState, type ReactNode } from "react"
import { AtSign, Check, Cloud, Copy, Globe, MessagesSquare, Music2, Newspaper, PenLine, Youtube, type LucideIcon } from "lucide-react"
import { useT } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"
import type { Mention, MentionIntent, MentionSource } from "@/lib/types"

const SOURCE_ICONS: Record<MentionSource, LucideIcon> = { x: AtSign, hn: Newspaper, bluesky: Cloud, youtube: Youtube, web: Globe, reddit: MessagesSquare, tiktok: Music2 }

export const INTENT_STYLES: Record<MentionIntent, string> = {
  alternatives: "bg-success-soft text-success",
  recommendation: "bg-success-soft text-success",
  money: "bg-primary-soft text-primary",
  pain: "bg-warning-soft text-warning",
  advice: "bg-primary-soft text-primary",
  launch: "bg-muted text-muted-foreground",
}

/** People asking for a recommendation or an alternative are ready to buy, so their posts are pushed in real time. */
export const isHighIntent = (mention: Mention) => mention.intent === "recommendation" || mention.intent === "alternatives"

/** `context` renders above the post, e.g. which monitor it came from. */
export function MentionCard({ mention, showDraft = true, context }: { mention: Mention; showDraft?: boolean; context?: ReactNode }) {
  const t = useT().mentions
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const Icon = SOURCE_ICONS[mention.source] ?? Globe

  const copy = async () => {
    if (!mention.replyDraft) return
    await navigator.clipboard.writeText(mention.replyDraft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <li className="px-4 py-4 sm:px-5">
      {context && <div className="mb-1.5">{context}</div>}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-label={t.sources[mention.source]} />
        <span className="font-medium text-foreground">{mention.author}</span>
        <span>· {mention.hoursAgo === null ? t.agoUnknown : t.ago(mention.hoursAgo)}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {isHighIntent(mention) && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">{t.highIntent}</span>}
          <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", INTENT_STYLES[mention.intent])}>{t.intents[mention.intent]}</span>
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{mention.text}</p>
      {mention.translation && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{mention.translation}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{mention.engagement}</span>
        {showDraft && mention.replyDraft && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover cursor-pointer"
          >
            <PenLine className="h-3.5 w-3.5" />
            {open ? t.hideDraft : t.replyDraft}
          </button>
        )}
      </div>
      {showDraft && open && mention.replyDraft && (
        <div className="mt-2 flex items-start gap-3 rounded-lg border border-border bg-subtle p-3">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-body">{mention.replyDraft}</p>
          <button
            onClick={copy}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-subtle cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
    </li>
  )
}
