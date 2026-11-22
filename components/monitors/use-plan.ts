"use client"

import { useAccount } from "@/hooks/use-account"
import { DEMO_POINTS_USED, DEMO_X_POSTS_USED, PLAN_LIMITS, type PlanLimits } from "@/lib/data/plans"

/**
 * The reader's plan and what it gives: from GET /usage when signed in, else the
 * free plan with demo usage (signed-out and demo visits).
 */
export function usePlan() {
  const { usage } = useAccount()
  const plan = usage?.plan ?? "free"
  const limits: PlanLimits = usage
    ? { points: usage.limits.monthly_credits, monitors: usage.limits.monitors, xPosts: usage.limits.x_posts, checkEvery: usage.check_every }
    : PLAN_LIMITS[plan]
  const xPostsUsed = usage ? usage.x_posts.used : DEMO_X_POSTS_USED[plan]
  return { plan, limits, xPostsUsed, xPostsLeft: Math.max(0, limits.xPosts - xPostsUsed) }
}

/**
 * AI points left. Signed in: the ledger balance (the same number /credits shows).
 * Otherwise the demo balance less what this visit's demo answers spent.
 * null while a signed-in reader's balance is loading.
 */
export function usePoints(spent = 0) {
  const { isAuthenticated, usage } = useAccount()
  const { plan, limits } = usePlan()
  if (usage) return { balance: usage.credits.balance, monthly: usage.credits.monthly }
  if (isAuthenticated) return { balance: null, monthly: limits.points }
  return { balance: limits.points - DEMO_POINTS_USED[plan] - spent, monthly: limits.points }
}
