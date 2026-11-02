"use client"

import { usePathname, useRouter } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"
import { ItemIndicator, RadioItem } from "@radix-ui/react-dropdown-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { switchLocalePath, type Locale } from "@/lib/i18n"
import { setLocaleCookie, useLocale, useT } from "./locale-provider"

/**
 * Language menu. Marketing pages move to the other language's URL; app pages switch in place.
 * `compact` keeps the same menu with a smaller trigger for tight headers.
 */
export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale()
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()

  const switchTo = (target: Locale) => {
    if (target === locale) return
    setLocaleCookie(target)
    const href = switchLocalePath(pathname, target)
    if (href) {
      router.push(href)
      return
    }
    const params = new URLSearchParams(window.location.search)
    if (params.has("lang")) {
      if (target === "zh") params.set("lang", "zh")
      else params.delete("lang")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    } else {
      router.refresh()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t.switcher.label}: ${locale === "en" ? "EN" : "中文"}`}
          className={cn(
            "group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-muted font-medium text-foreground transition-colors hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            compact ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm",
            className,
          )}
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span>{locale === "en" ? "EN" : "中文"}</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} className="w-44 rounded-2xl bg-card p-2 shadow-lg">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => switchTo(value as Locale)} aria-label={t.switcher.label}>
          {(["en", "zh"] as const).map((option) => (
            <RadioItem
              key={option}
              value={option}
              lang={option === "en" ? "en" : "zh-CN"}
              className="relative flex min-h-11 cursor-pointer select-none items-center rounded-xl py-3 pl-3 pr-10 text-sm outline-none focus:bg-muted data-[state=checked]:font-semibold data-[state=checked]:text-emerald-800 dark:data-[state=checked]:text-emerald-400"
            >
              {option === "en" ? "EN" : "中文"}
              <ItemIndicator className="absolute right-3 flex items-center">
                <Check className="h-4 w-4" aria-hidden />
              </ItemIndicator>
            </RadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
