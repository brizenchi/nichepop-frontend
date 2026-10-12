import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reddit Marketing Panel - NichePop",
  description: "付费的 Reddit Marketing Panel，用来找线程、组织回复机会、追踪潜在客户并持续跟进。",
}

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
