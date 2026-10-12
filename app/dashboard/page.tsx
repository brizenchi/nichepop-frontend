import type { Metadata } from "next"
import { MarketingWorkspace } from "@/components/dashboard/marketing-workspace"

export const metadata: Metadata = {
  title: "Reddit Marketing Panel - NichePop",
  description: "付费的 Reddit Marketing Panel，用来找 Reddit 线程、组织回复、追踪潜在客户并持续跟进。",
}

export default function DashboardPage() {
  return <MarketingWorkspace mode="dashboard" />
}
