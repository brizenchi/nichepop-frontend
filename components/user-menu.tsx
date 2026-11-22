"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { User, LogOut, Gift, CreditCard, Crown, TrendingUp, Check, ChevronsUpDown, Coins, Receipt, UserRound, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAccount } from "@/hooks/use-account"
import { useT } from "@/components/i18n/locale-provider"
import { getReferralCode } from "@/lib/api"
import { cn } from "@/lib/utils"

interface UserMenuProps {
  /** `icon`: avatar-only trigger (site header). `sidebar`: full-width row with name and email (workspace sidebar). */
  variant?: "icon" | "sidebar"
  /** Where the menu opens relative to the trigger; the sidebar row opens upward by default. */
  side?: "top" | "bottom"
  className?: string
}

export function UserMenu({ variant = "icon", side, className }: UserMenuProps) {
  const { session, user, usage, plan, signOut } = useAccount()
  const t = useT().userMenu
  const nav = useT().account.nav
  const [loggingOut, setLoggingOut] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const inviteLink = useRef<{ token: string; link: string } | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
    }
  }

  // The invite link comes from the API (referral.base_link), so it carries the site's real domain.
  const handleInviteFriends = async () => {
    if (copying || !session) return
    setCopying(true)
    setCopied(false)
    setCopyFailed(false)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    try {
      if (inviteLink.current?.token !== session.token) {
        inviteLink.current = { token: session.token, link: (await getReferralCode(session.token)).link }
      }
      await navigator.clipboard.writeText(inviteLink.current.link)
      setCopied(true)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
    } finally {
      setCopying(false)
    }
  }

  const getPlanBadge = () => {
    switch (plan) {
      case "premium":
        return (
          <Badge className="bg-rose-600 text-white text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )
      case "pro":
        return (
          <Badge className="bg-indigo-600 text-white text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="text-xs">Free</Badge>
    }
  }

  if (!user) return null

  const name = user.username || user.email.split("@")[0]
  const avatar = user.avatar ? (
    <img
      src={user.avatar}
      alt={name}
      className="h-8 w-8 shrink-0 rounded-lg object-cover"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
      <User className="h-5 w-5 text-sidebar-foreground" />
    </span>
  )

  const links = [
    { href: "/account", label: nav.account, icon: UserRound },
    { href: "/billing", label: nav.billing, icon: Receipt },
    { href: "/credits", label: nav.credits, icon: Coins },
    { href: "/referrals", label: nav.referrals, icon: Users },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            aria-label={t.accountMenu}
            className={cn(
              "group flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              className,
            )}
          >
            {avatar}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight text-foreground">{name}</span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">{user.email}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t.accountMenu}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              className,
            )}
          >
            {avatar}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side ?? (variant === "sidebar" ? "top" : "bottom")}
        align={variant === "sidebar" ? "start" : "end"}
        sideOffset={8}
        collisionPadding={12}
        className={cn("w-64 max-w-[calc(100vw-1.5rem)]", variant === "sidebar" && "w-[var(--radix-dropdown-menu-trigger-width)] min-w-64")}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{name}</p>
              {getPlanBadge()}
            </div>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Points */}
        <div className="px-2 py-2">
          <Link href="/credits" className="flex items-center justify-between p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">{t.points}</span>
            </div>
            <Badge className="bg-indigo-600 text-white">{usage ? usage.credits.balance : "…"}</Badge>
          </Link>
        </div>

        <DropdownMenuSeparator />

        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
            <Link href={link.href}>
              <link.icon className="mr-2 h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Invite */}
        <DropdownMenuItem
          className="cursor-pointer"
          aria-busy={copying}
          onSelect={(event) => {
            // Keep focus and feedback in this menu for mouse, touch and keyboard selection.
            event.preventDefault()
            void handleInviteFriends()
          }}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Gift className="mr-2 h-4 w-4" />
          )}
          <span aria-live="polite">{copying ? t.copying : copied ? t.copied : t.invite}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{t.inviteReward}</Badge>
        </DropdownMenuItem>
        {copyFailed && <p role="alert" className="px-2 py-1.5 text-xs text-destructive">{t.copyFailed}</p>}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{loggingOut ? t.loggingOut : t.logOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
