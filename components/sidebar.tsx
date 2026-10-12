"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp, CreditCard, User, Rss } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import LoginDialog from "@/components/LoginDialog"
import { UserMenu } from "@/components/user-menu"
import { BrandMark } from "@/components/brand-logo"

const navItems = [
  { icon: TrendingUp, label: "Reddit Panel", href: "/dashboard" },
  { icon: Rss, label: "Reddit Feed", href: "/dashboard/live-feed" },
  { icon: CreditCard, label: "Pricing", href: "/pricing" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAuthenticated, loading } = useAuth()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r border-border bg-sidebar flex flex-col items-center py-6 gap-2 justify-between">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="mb-6"
          >
            <BrandMark className="h-10 w-10 transition-all duration-200 hover:drop-shadow-[0_0_12px_rgba(0,128,255,0.55)]" />
          </Link>

          <nav className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.label} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-indigo"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-card border-border">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-2">
          {loading ? (
            <div className="flex h-10 w-10 items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-sidebar-foreground animate-pulse" />
            </div>
          ) : isAuthenticated && user ? (
            <UserMenu  />
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLoginDialogOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo text-primary-foreground hover:bg-indigo/90 transition-all duration-200"
                >
                  <User className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-card border-border">
                <p>Sign in</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
      <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
    </TooltipProvider>
  )
}
