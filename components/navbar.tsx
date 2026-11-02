"use client"
/* Hallmark · genre: playful · nav: N12 banner + retract (fill: tint+ink · dismiss: yes · bar: floating pill) · design-system: design.md */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import LoginDialog from "@/components/LoginDialog"
import { UserMenu } from "@/components/user-menu"
import { BrandLogo } from "@/components/brand-logo"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useLocale, useT } from "@/components/i18n/locale-provider"
import { localizedHref } from "@/lib/i18n"

const BANNER_KEY = "np_banner_trends_dismissed"
/** Banner height in px; the whole header translates by this much to retract it. */
const BANNER_H = 36

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const lastY = useRef(0)
  const locale = useLocale()
  const t = useT()

  const home = localizedHref("/", locale)
  const trendsToday = localizedHref("/new-keywords", locale)
  const navItems = [
    { label: t.nav.howItWorks, href: `${home}#features` },
    { label: t.nav.newKeywords, href: trendsToday },
    { label: t.nav.pricing, href: localizedHref("/pricing", locale) },
    { label: t.nav.blog, href: "/blog" },
  ]

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href)

  useEffect(() => {
    setBannerOpen(localStorage.getItem(BANNER_KEY) !== "1")
  }, [])

  // Past 48px going down → retract the banner; going up (or near the top) → bring it back.
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 48) setCompact(false)
        else if (y > lastY.current + 4) setCompact(true)
        else if (y < lastY.current - 4) setCompact(false)
        lastY.current = y
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  const dismissBanner = () => {
    localStorage.setItem(BANNER_KEY, "1")
    setBannerOpen(false)
  }

  const retracted = bannerOpen && compact && !mobileMenuOpen

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: retracted ? `translateY(-${BANNER_H}px)` : undefined }}
      >
        {bannerOpen && (
          <div className="relative flex items-center justify-center bg-pear-soft px-10 text-sm text-ink" style={{ height: BANNER_H }}>
            <p className="flex min-w-0 items-center gap-2">
              <span className="hidden h-2 w-2 shrink-0 rounded-full bg-pear-deep sm:block" aria-hidden />
              <span className="truncate font-medium">{t.nav.banner}</span>
              <Link href={trendsToday} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold underline decoration-pear-deep decoration-2 underline-offset-4 hover:decoration-ink">
                {t.nav.bannerLink}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
            <button
              onClick={dismissBanner}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink/70 transition-colors hover:bg-pear/60 hover:text-ink cursor-pointer"
              aria-label={t.nav.dismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="px-3 pt-2 sm:px-4">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full bg-raised/95 pl-4 pr-4 shadow-card ring-1 ring-rule backdrop-blur sm:pl-5 lg:pr-5">
            <div className="flex min-w-0 items-center gap-8">
              <Link href={home} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <BrandLogo size="sm" />
              </Link>

              <div className="hidden items-center gap-0.5 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-paper-2 hover:text-foreground",
                      isActive(item.href) ? "bg-paper-2 font-semibold text-foreground" : "text-body",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <LanguageSwitcher />
              {isAuthenticated && user ? (
                <>
                  <Link href="/ask" className="btn btn--sm">
                    {t.common.openRadar}
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <>
                  <button onClick={() => setLoginDialogOpen(true)} className="btn btn--ghost btn--sm">
                    {t.common.signIn}
                  </button>
                  <Link href="/start" className="btn btn--sm">
                    {t.common.startFree}
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              {!(isAuthenticated && user) && (
                <Link href="/start" className="btn btn--sm">
                  {t.common.startFree}
                </Link>
              )}
              <button
                className="rounded-full p-2 text-muted-foreground hover:bg-paper-2 hover:text-foreground cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t.common.closeMenu : t.common.openMenu}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>

          {mobileMenuOpen && (
            <div className="mx-auto mt-2 max-w-6xl rounded-2xl bg-raised p-3 shadow-lift ring-1 ring-rule lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-full px-3 py-2.5 text-sm text-body hover:bg-paper-2 hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              <div className="mt-2 flex gap-2 border-t border-rule pt-3">
                {isAuthenticated && user ? (
                  <Link href="/ask" className="btn flex-1" onClick={() => setMobileMenuOpen(false)}>
                    {t.common.openRadar}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setLoginDialogOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="btn btn--soft flex-1"
                  >
                    {t.common.signIn}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
    </>
  )
}
