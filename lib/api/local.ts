/**
 * What a demo visit saves (monitors, the watchlist) stays in this browser's localStorage.
 * Only the demo branch of lib/api/* uses it; real builds never read these keys.
 */

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function readLocal<T>(key: string, valid: (value: unknown) => value is T): T | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return valid(parsed) ? parsed : null
  } catch {
    store.removeItem(key)
    return null
  }
}

export function writeLocal(key: string, value: unknown) {
  storage()?.setItem(key, JSON.stringify(value))
}
