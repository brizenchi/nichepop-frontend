"use client"

import { useSyncExternalStore } from "react"

// One clock for "checked 5 minutes ago" and "next check in 20 minutes": it ticks every
// 30 seconds while something shows a relative time. The server render has no time (0).

const TICK_MS = 30_000
let now = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
      now = 0
    }
  }
}

const getSnapshot = () => now || (now = Date.now())
const getServerSnapshot = () => 0

/** The current time in milliseconds, refreshed every 30 seconds; 0 on the server. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
