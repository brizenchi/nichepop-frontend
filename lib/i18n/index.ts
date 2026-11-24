import { en, type Dictionary } from './en'
import { zh } from './zh'

export type Locale = 'en' | 'zh'

export const LOCALES: Locale[] = ['en', 'zh']
export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie that remembers the reader's language for app pages (radar, ask, shared reports). */
export const LOCALE_COOKIE = 'np_locale'

/** App sections: same URL in both languages, language comes from the cookie. */
const APP_PATHS = ['/trends', '/ask', '/monitors', '/start', '/usage', '/r', '/radar', '/today', '/login', '/invite', '/account', '/billing', '/credits', '/referrals']

/** Marketing pages that exist in both languages; Chinese versions live under /zh. */
export const LOCALIZED_PATHS = ['/', '/new-keywords', '/pricing'] as const

const dictionaries: Record<Locale, Dictionary> = { en, zh }

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale]

export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'zh'

/** Path of a localized marketing page in the given language, e.g. ('/pricing', 'zh') → '/zh/pricing'. */
export function localizedHref(path: (typeof LOCALIZED_PATHS)[number], locale: Locale) {
  if (locale === 'en') return path
  return path === '/' ? '/zh' : `/zh${path}`
}

/** Where the language switcher should take the reader from the current pathname. */
export function switchLocalePath(pathname: string, target: Locale): string | null {
  const basePath = pathname === '/zh' ? '/' : pathname.startsWith('/zh/') ? pathname.slice(3) : pathname
  const localized = (LOCALIZED_PATHS as readonly string[]).includes(basePath)
  if (localized) return localizedHref(basePath as (typeof LOCALIZED_PATHS)[number], target)
  // App pages keep their URL; the cookie decides the language.
  if (APP_PATHS.some((prefix) => basePath === prefix || basePath.startsWith(`${prefix}/`))) return null
  // English-only pages (blog, use cases, legal): send Chinese readers to the Chinese home page.
  return target === 'zh' ? '/zh' : null
}

export type { Dictionary }
