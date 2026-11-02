"use client"
/* Hallmark · genre: playful · macrostructure: workbench · design-system: design.md · designed-as-app */

import { Suspense, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ArrowUpRight, Bot, Eye, Lightbulb, LogIn, Map, Menu, MessageSquare, Package, Plus, Search, Sparkles, TrendingUp, X, type LucideIcon } from "lucide-react"
import { BrandMark } from "@/components/brand-logo"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import LoginDialog from "@/components/LoginDialog"
import { UserMenu } from "@/components/user-menu"
import { useAuth } from "@/hooks/useAuth"
import { usePlan } from "@/components/monitors/use-plan"
import { PricingModal } from "@/components/pricing-modal"
import { buttonStyles } from "@/components/radar/ui"
import type { Conversation } from "@/lib/data/chat"
import { DEMO_POINTS_USED } from "@/lib/data/plans"
import { localizedHref } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { ReportKind } from "@/lib/types"
import { useChatStore } from "./chat-store"

const KIND_ICONS: Record<ReportKind, LucideIcon> = { keyword: Search, idea: Lightbulb, product: Package, market: Map }

function useNavItems() {
  const t = useT()
  return [
    { label: t.appHeader.trends, href: "/trends", icon: TrendingUp },
    { label: t.appHeader.ask, href: "/ask", icon: Bot },
    { label: t.appHeader.monitors, href: "/monitors", icon: Eye },
  ]
}

/** First user message of a conversation, in the reader's language for seeded starters. */
export function conversationTitle(conversation: Conversation, starters: Record<string, string>, fallback: string) {
  const first = conversation.messages.find((m) => m.role === "user")
  if (!first || first.role !== "user") return fallback
  return "starter" in first ? starters[first.starter] : first.text
}

function RecentChats({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { conversations } = useChatStore()
  const activeId = pathname === "/ask" ? searchParams.get("c") : null

  return (
    <ul className="space-y-0.5">
      {conversations.slice(0, 8).map((c) => {
        const report = [...c.messages].reverse().find((m) => m.role === "report")
        const Icon = report && report.role === "report" ? KIND_ICONS[report.kind] : MessageSquare
        return (
          <li key={c.id}>
            <Link
              href={`/ask?c=${c.id}`}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                c.id === activeId ? "bg-raised font-medium text-foreground ring-1 ring-rule" : "text-body hover:bg-paper-3 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="min-w-0 truncate">{conversationTitle(c, t.ask.starters, t.workspace.newChat)}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function SidebarContent({ onNavigate, onUpgrade, onSignIn }: { onNavigate?: () => void; onUpgrade: () => void; onSignIn: () => void }) {
  const t = useT()
  const locale = useLocale()
  const pathname = usePathname()
  const navItems = useNavItems()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { plan, limits } = usePlan()
  const { spent } = useChatStore()
  const balance = limits.points - DEMO_POINTS_USED[plan] - spent
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <BrandMark className="h-7 w-7" />
        <span className="text-[15px] font-semibold tracking-tight text-foreground">NichePop</span>
        <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-rule">{t.workspace.name}</span>
      </div>

      <div className="px-3">
        <Link href="/ask" onClick={onNavigate} className={cn(buttonStyles.secondary, "h-9 w-full justify-start")}>
          <Plus className="h-4 w-4" />
          {t.workspace.newChat}
        </Link>
        <nav className="mt-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 text-sm transition-colors",
                  active ? "bg-raised font-semibold text-foreground ring-1 ring-rule" : "text-body hover:bg-paper-3 hover:text-foreground",
                )}
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", active && "bg-pear text-ink")}>
                  <item.icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="mono-label mb-2 px-3 text-muted-foreground">{t.workspace.recent}</p>
        <Suspense>
          <RecentChats onNavigate={onNavigate} />
        </Suspense>
      </div>

      <div className="shrink-0 space-y-3 border-t border-rule p-3">
        <div className="rounded-xl bg-raised p-3 ring-1 ring-rule">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{t.ask.balanceLabel}</span>
            <Link href="/usage" onClick={onNavigate} className="font-medium text-primary hover:text-primary-hover">
              {t.ask.usageLink}
            </Link>
          </div>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{t.ask.balance(balance)}</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-paper-3">
            <div className="h-1.5 rounded-full bg-sky" style={{ width: `${Math.max(0, (balance / limits.points) * 100)}%` }} />
          </div>
          {plan !== "premium" && (
            <button onClick={onUpgrade} className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer">
              <Sparkles className="h-3.5 w-3.5" />
              {t.usage.planNames[plan]} · {t.common.upgrade}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            {isAuthenticated && user ? (
              <UserMenu variant="sidebar" />
            ) : authLoading ? (
              <div className="flex h-11 items-center px-2" aria-busy>
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm font-medium text-foreground transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LogIn className="h-4 w-4" />
                </span>
                {t.common.signIn}
              </button>
            )}
          </div>
          <Link href={localizedHref("/", locale)} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-paper-3 hover:text-foreground" aria-label={t.workspace.backToSite} title={t.workspace.backToSite}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * The workspace: Trends, Ask AI and Monitors behind one persistent sidebar (desktop),
 * or a top bar, a drawer and bottom tabs (phones).
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const t = useT()
  const pathname = usePathname()
  const navItems = useNavItems()
  const { user, isAuthenticated } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => setDrawer(false), [pathname])

  return (
    <div className="radar-theme min-h-dvh bg-radar-bg text-radar-text lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-rule bg-paper-2 lg:block">
        <SidebarContent onUpgrade={() => setShowPricing(true)} onSignIn={() => setShowLogin(true)} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-rule bg-paper/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setDrawer(true)} className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground cursor-pointer" aria-label={t.workspace.menu}>
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/ask" className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">NichePop</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowPricing(true)} className={cn(buttonStyles.secondary, "h-8 px-2.5")} aria-label={t.common.upgrade}>
            <Sparkles className="h-3.5 w-3.5 text-sky-ink" />
          </button>
          {isAuthenticated && user ? (
            <UserMenu className="h-9 w-9" />
          ) : (
            <button onClick={() => setShowLogin(true)} className={cn(buttonStyles.secondary, "h-8 px-2.5")} aria-label={t.common.signIn}>
              <LogIn className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/30" onClick={() => setDrawer(false)} aria-label={t.workspace.close} />
          <aside className="relative h-full w-72 max-w-[85%] bg-paper-2 shadow-lift">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-3.5 rounded-md p-1 text-muted-foreground hover:text-foreground cursor-pointer" aria-label={t.workspace.close}>
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} onUpgrade={() => setShowPricing(true)} onSignIn={() => { setDrawer(false); setShowLogin(true) }} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="NichePop">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-0.5 py-1.5 text-[11px] transition-colors", active ? "font-semibold text-foreground" : "text-radar-text-3")}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-pear text-ink")}>
                <item.icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature={t.radar.upgradeFeature} />
      <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}
