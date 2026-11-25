import type { Locale } from '../i18n'

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60_000],
  ['hour', 3_600_000],
  ['day', 86_400_000],
]

const UNDER_A_MINUTE: Record<Locale, { past: string; future: string }> = {
  en: { past: 'just now', future: 'in a moment' },
  zh: { past: '刚刚', future: '马上' },
}

/** "5 minutes ago", "in 2 hours", "3天前": the time from `now` to `at`, in the largest unit that fits. */
export function relativeTime(at: number, now: number, locale: Locale): string {
  const diff = at - now
  const abs = Math.abs(diff)
  if (abs < 60_000) return diff < 0 ? UNDER_A_MINUTE[locale].past : UNDER_A_MINUTE[locale].future
  let [unit, size] = STEPS[0]
  for (const step of STEPS) if (abs >= step[1]) [unit, size] = step
  return new Intl.RelativeTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', { numeric: 'auto' }).format(Math.round(diff / size), unit)
}
