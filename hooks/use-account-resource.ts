"use client"

// YOURS. One account API resource for the signed-in session; the same rules as
// the template's useConsoleResource (components/console-kit.tsx): results of
// an older session or an older request are dropped, and a background refresh
// keeps the shown data when it fails for a passing reason.

import { useCallback, useEffect, useRef, useState } from "react"
import { readSession } from "@/lib/auth"
import { describeRequestFailure } from "@/lib/request-state"
import { retainEqualData } from "@/lib/resource-data"

type Result<T> = { owner: string; data: T | null; loading: boolean; error: unknown }

export function useAccountResource<T>(token: string, loader: (token: string) => Promise<T>, initialData?: (token: string) => T | null) {
  const [result, setResult] = useState<Result<T>>({ owner: "", data: null, loading: false, error: null })
  const generation = useRef(0)

  const refresh = useCallback(async (background = false) => {
    if (!token || readSession()?.token !== token) return
    const current = ++generation.current
    setResult((previous) => {
      if (background && previous.owner === token && previous.data !== null) return previous
      const data = previous.owner === token ? previous.data : initialData?.(token) ?? null
      return { owner: token, data, loading: initialData ? data === null : true, error: null }
    })
    try {
      const data = await loader(token)
      if (generation.current !== current || readSession()?.token !== token) return
      setResult((previous) => {
        const stable = retainEqualData(previous.owner === token ? previous.data : null, data)
        return previous.owner === token && previous.data === stable && !previous.loading && previous.error === null
          ? previous
          : { owner: token, data: stable, loading: false, error: null }
      })
    } catch (error) {
      if (generation.current !== current || readSession()?.token !== token) return
      setResult((previous) =>
        background && previous.owner === token && previous.data !== null && describeRequestFailure(error, "Account").retryable
          ? previous
          : { owner: token, data: null, loading: false, error },
      )
    }
  }, [loader, token, initialData])

  const revalidate = useCallback(() => refresh(true), [refresh])

  useEffect(() => {
    const counter = generation
    void refresh()
    return () => {
      counter.current++
    }
  }, [refresh])

  const view = result.owner === token ? result : { data: initialData?.(token) ?? null, error: null, loading: Boolean(token) }
  return { data: view.data, error: view.error, loading: view.loading, refresh, revalidate }
}
