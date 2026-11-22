"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, type Dictionary, type Locale } from "@/lib/i18n"

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

/**
 * Provides the reading language to client components.
 * `remember` writes it to the cookie so app pages (radar, ask, shared reports) follow the language
 * of the marketing page the reader came from.
 */
export function LocaleProvider({ locale, remember = false, children }: { locale: Locale; remember?: boolean; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    if (remember) setLocaleCookie(locale)
  }, [locale, remember])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)

export const useT = (): Dictionary => getDictionary(useContext(LocaleContext))

/** Picks the reader's language from an { en, zh } pair (the template's lib/ files return these). */
export function usePick() {
  const locale = useContext(LocaleContext)
  return (text: { en: string; zh: string }) => text[locale]
}
