// YOURS. NichePop's account calls that the template's lib/api.ts does not
// have. Requests go through the template's apiRequest, so a 401 signs the
// browser out like every other call.
import { apiRequest } from "./api";
import { creditDescription, creditSourceName } from "./customer-records";
import type { CreditTransaction } from "./operations-api";

export type PlanId = "free" | "pro" | "premium";

/** What a plan gives (backend internal/plans/limits.go). */
export type PlanLimits = {
  plan: PlanId;
  monthly_credits: number;
  monitors: number;
  x_posts: number;
  mentions: boolean;
  realtime: boolean;
  api_keys: number;
  agent_units: number;
};

type Counted = { used: number; limit: number };

/** GET /usage: the signed-in user's plan, its rules and this month's use. */
export type Usage = {
  plan: PlanId;
  period_start: string;
  period_end: string;
  limits: PlanLimits;
  check_every: "day" | "hour";
  credits: { balance: number; monthly: number; used_this_month: number; expiring: number; next_expiry_at?: string };
  monitors: Counted;
  x_posts: Counted;
  api_keys: Counted;
};

export function getUsage(token: string, signal?: AbortSignal): Promise<Usage> {
  return apiRequest<Usage>("/usage", { authToken: token, signal });
}

/** The plan as NichePop shows it; plans it does not sell map onto its tiers. */
export function planTier(plan?: string | null): PlanId {
  switch ((plan || "").trim().toLowerCase()) {
    case "pro":
      return "pro";
    case "premium":
    case "lifetime":
      return "premium";
    default:
      return "free";
  }
}

type Copy = { en: string; zh: string }

/** Names of the credit sources NichePop adds to the template's (lib/customer-records.ts). */
const SOURCES: Record<string, Copy> = {
  monthly_credits: { en: "Monthly plan points", zh: "每月套餐点数" },
  agent_run: { en: "AI analysis", zh: "AI 分析" },
  agent_reply: { en: "AI analyst reply", zh: "AI 分析师回答" },
  mcp_tool: { en: "Data lookup via API", zh: "通过 API 查询数据" },
}

/** Where a credit transaction came from, NichePop's sources first. */
export function creditSource(row: Pick<CreditTransaction, "source" | "kind" | "actor_id">): Copy {
  if (row.kind === "consume" || row.kind === "grant") {
    const own = Object.prototype.hasOwnProperty.call(SOURCES, row.source) ? SOURCES[row.source] : null
    if (own && !row.actor_id) return own
  }
  return creditSourceName(row)
}

/** The transaction's note, without the API's English labels for monthly points and replies. */
export function creditNote(row: Pick<CreditTransaction, "source" | "kind" | "actor_id" | "reason">): string {
  return row.source === "monthly_credits" || row.source === "agent_reply" ? "" : creditDescription(row)
}
