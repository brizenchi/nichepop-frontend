"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import LoginDialog from "@/components/LoginDialog"
import { UserMenu } from "@/components/user-menu"
import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"

const primaryNavItems = [
  { label: "Reddit Marketing", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
]

const toolItems = [
  {
    label: "Ideas DB",
    href: "/dashboard/ideas",
    description: "Free database of startup and market opportunities.",
  },
  {
    label: "Idea Analysis",
    href: "/dashboard/validate",
    description: "Free commercial analysis for any raw idea.",
  },
]

export function Navbar() {
  const { user, isAuthenticated } = useAuth()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tryFreeHref = "/dashboard/ideas"

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E8E1F4] bg-[#FAFAFA]/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#FAFAFA]/75">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <BrandLogo
                size="md"
                markClassName="transition-all duration-200 group-hover:drop-shadow-[0_0_12px_rgba(125,76,230,0.24)]"
              />
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-[#6E677D] transition-colors hover:text-[#111111]"
                >
                  {item.label}
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-sm font-medium text-[#6E677D] transition-colors hover:text-[#111111]">
                    Free Tools
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  sideOffset={12}
                  className="w-72 rounded-2xl border-[#E8E1F4] bg-white/96 p-2 text-[#111111] shadow-[0_24px_60px_rgba(77,54,42,0.12)]"
                >
                  {toolItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                      <Link
                        href={item.href}
                        className="block rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-[#E8E1F4] hover:bg-[#F7F4FF]"
                      >
                        <div className="text-sm font-semibold text-[#111111]">{item.label}</div>
                        <div className="mt-1 text-xs leading-5 text-[#6E677D]">{item.description}</div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {isAuthenticated && user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="cursor-pointer text-[#6E677D] hover:bg-[#F7F4FF] hover:text-[#111111]">
                      Open Reddit Panel
                    </Button>
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLoginDialogOpen(true)}
                    className="cursor-pointer text-[#111111] hover:bg-[#F7F4FF] hover:text-[#111111]"
                  >
                    Sign in
                  </Button>
                  <Link href={tryFreeHref}>
                    <Button
                      size="sm"
                      className="cursor-pointer rounded-full bg-[#111111] font-semibold text-white transition-all duration-200 hover:bg-[#111111]/92 hover:shadow-[0_14px_28px_rgba(17,17,17,0.14)]"
                    >
                      Open Free Tools
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="p-2 text-[#6E677D] hover:text-[#111111] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E8E1F4] bg-[#FAFAFA] md:hidden">
            <div className="container mx-auto max-w-7xl space-y-3 px-4 py-4">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-sm font-medium text-[#6E677D] transition-colors hover:text-[#111111]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="rounded-2xl border border-[#E8E1F4] bg-white/90 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7D7590]">Free Tools</div>
                <div className="mt-3 space-y-2">
                  {toolItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-[#E8E1F4] hover:bg-[#F7F4FF]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="text-sm font-semibold text-[#111111]">{item.label}</div>
                      <div className="mt-1 text-xs leading-5 text-[#6E677D]">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-[#E8E1F4] pt-3">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer text-[#6E677D] hover:bg-[#F7F4FF] hover:text-[#111111]">
                        Open Reddit Panel
                      </Button>
                    </Link>
                    <div className="px-2">
                      <UserMenu />
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full cursor-pointer text-[#111111] hover:bg-[#F7F4FF] hover:text-[#111111]"
                      onClick={() => {
                        setLoginDialogOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      Sign in
                    </Button>
                    <Link href={tryFreeHref} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-full bg-[#111111] font-semibold text-white hover:bg-[#111111]/92">
                        Open Free Tools
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
    </>
  )
}
