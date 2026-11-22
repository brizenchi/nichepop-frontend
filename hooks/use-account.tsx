"use client"

// YOURS. The signed-in account for every NichePop page, on the template's
// session (lib/auth.ts): who is signed in, their plan and points (GET
// /usage). A 401 from any call clears the session, and pages fall back to
// the signed-out state.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { logout } from "@/lib/api"
import { readSession, SESSION_EVENT, writeSession, type AuthSession, type SessionUser } from "@/lib/auth"
import { getUsage, type PlanId, type Usage } from "@/lib/account"
import { LEGACY_TOKEN_KEY, LEGACY_USER_KEY } from "@/lib/storageKeys"

type AccountContextValue = {
  /** False until the browser session has been read (first client render). */
  ready: boolean
  session: AuthSession | null
  user: SessionUser | null
  isAuthenticated: boolean
  /** The plan and this month's use; null when signed out or not loaded yet. */
  usage: Usage | null
  /** Why usage could not be loaded, until the next successful load. */
  usageError: unknown
  plan: PlanId
  /** Reloads usage, e.g. after a payment or an AI task. */
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

type Loaded = { owner: string; usage: Usage | null; error: unknown }

export function AccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loaded, setLoaded] = useState<Loaded>({ owner: "", usage: null, error: null })
  const generation = useRef(0)

  useEffect(() => {
    // The old sign-in's token no longer works with the API; don't keep it around.
    window.localStorage.removeItem(LEGACY_TOKEN_KEY)
    window.localStorage.removeItem(LEGACY_USER_KEY)
    const sync = () => setSession(readSession())
    sync()
    setReady(true)
    window.addEventListener("storage", sync)
    window.addEventListener(SESSION_EVENT, sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(SESSION_EVENT, sync)
    }
  }, [])

  const token = session?.token || ""
  const refresh = useCallback(async () => {
    if (!token) return
    const current = ++generation.current
    try {
      const usage = await getUsage(token)
      if (generation.current === current) setLoaded({ owner: token, usage, error: null })
    } catch (error) {
      // A 401 has already cleared the session. Otherwise keep what was shown.
      if (generation.current === current) setLoaded((previous) => ({ owner: token, usage: previous.owner === token ? previous.usage : null, error }))
    }
  }, [token])

  useEffect(() => {
    void refresh()
    return () => {
      generation.current++
    }
  }, [refresh])

  const signOut = useCallback(async () => {
    const current = readSession()
    // Revokes the token on the API; this browser is signed out either way.
    if (current) await logout(current.token).catch(() => undefined)
    writeSession(null)
  }, [])

  // Another account's usage is never shown, even for a moment after switching.
  const usage = token && loaded.owner === token ? loaded.usage : null
  const usageError = token && loaded.owner === token ? loaded.error : null
  const value = useMemo<AccountContextValue>(() => ({
    ready,
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    usage,
    usageError,
    plan: usage?.plan ?? "free",
    refresh,
    signOut,
  }), [ready, session, usage, usageError, refresh, signOut])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext)
  if (!value) throw new Error("useAccount must be used inside AccountProvider")
  return value
}
