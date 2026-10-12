import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ideas DB - NichePop",
  description: "第一个免费工具。先免费看各种机会，再决定哪些 idea 值得继续分析。",
}

export default function IdeasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
