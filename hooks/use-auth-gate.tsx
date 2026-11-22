"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import LoginDialog from "@/components/LoginDialog"
import { useAccount } from "@/hooks/use-account"
import { DEMO_MODE } from "@/lib/demo"

export type GateReason = "save" | "ask" | "monitor"

/**
 * Runs an action that needs an account. Signed-out readers get the login dialog first;
 * after an in-page (email) sign-in the action runs automatically.
 * Google sign-in leaves the page, so callers keep drafts in localStorage.
 */
export function useAuthGate() {
  const { isAuthenticated } = useAccount()
  const [reason, setReason] = useState<GateReason | null>(null)
  const pending = useRef<(() => void) | null>(null)

  const gate = useCallback(
    (why: GateReason, action: () => void) => {
      if (isAuthenticated || DEMO_MODE) {
        action()
        return
      }
      pending.current = action
      setReason(why)
    },
    [isAuthenticated],
  )

  useEffect(() => {
    if (isAuthenticated && pending.current) {
      const action = pending.current
      pending.current = null
      setReason(null)
      action()
    }
  }, [isAuthenticated])

  const dialog = (
    <LoginDialog
      open={reason !== null}
      reason={reason ?? undefined}
      onClose={() => {
        pending.current = null
        setReason(null)
      }}
    />
  )

  return { gate, dialog }
}
