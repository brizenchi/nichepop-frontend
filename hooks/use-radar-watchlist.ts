"use client"

import { useCallback } from "react"
import { useAccount } from "@/hooks/use-account"
import { useResource } from "@/hooks/use-resource"
import { getWatchlist, saveWatchlist } from "@/lib/api/subscriptions"
import { DEMO_MODE } from "@/lib/demo"
import type { RadarWatchlist } from "@/lib/types"

/** The roots and sites the reader follows (lib/api/subscriptions.ts); real builds keep it on the account. */
export function useRadarWatchlist() {
  const { ready, isAuthenticated } = useAccount()
  const watchlist = useResource(DEMO_MODE || isAuthenticated ? getWatchlist : null)
  const { reload } = watchlist

  const save = useCallback(
    async (next: RadarWatchlist) => {
      const saved = await saveWatchlist(next)
      await reload()
      return saved
    },
    [reload],
  )

  return { watchlist: watchlist.data, loaded: ready && !watchlist.loading, error: watchlist.error, save }
}
