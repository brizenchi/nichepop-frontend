"use client"

// One read through lib/api for a page: loading, then the data or the error. It waits
// for the browser session (so a signed-in reader's first request carries the token),
// asks again for another account, and drops the result of an older request.

import { useCallback, useEffect, useRef, useState } from "react"
import { useAccount } from "@/hooks/use-account"

export type Resource<T> = {
  data: T | null
  error: unknown
  loading: boolean
  /** Asks again, e.g. after a save; the shown data stays until the answer arrives. */
  reload: () => Promise<void>
}

type Loaded<T> = { owner: string | null; data: T | null; error: unknown; loading: boolean }

/** `load` must be stable (useCallback); null skips the request, e.g. for a signed-out reader. */
export function useResource<T>(load: (() => Promise<T>) | null): Resource<T> {
  const { ready, session } = useAccount()
  const owner = ready ? session?.token || "" : null
  const [loaded, setLoaded] = useState<Loaded<T>>({ owner: null, data: null, error: null, loading: true })
  const generation = useRef(0)

  const reload = useCallback(async () => {
    if (!load || owner === null) return
    const current = ++generation.current
    // Another account's data is never shown, even while this account's loads.
    setLoaded((previous) => ({ owner, data: previous.owner === owner ? previous.data : null, error: null, loading: true }))
    try {
      const data = await load()
      if (generation.current === current) setLoaded({ owner, data, error: null, loading: false })
    } catch (error) {
      if (generation.current === current) setLoaded({ owner, data: null, error, loading: false })
    }
  }, [load, owner])

  useEffect(() => {
    const counter = generation
    void reload()
    return () => {
      counter.current++
    }
  }, [reload])

  if (!load) return { data: null, error: null, loading: false, reload }
  if (owner === null || loaded.owner !== owner) return { data: null, error: null, loading: true, reload }
  return { data: loaded.data, error: loaded.error, loading: loaded.loading, reload }
}
