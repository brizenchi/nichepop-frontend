import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Idea Analysis - NichePop",
  description: "第二个免费工具。输入任意 idea，免费判断它的商业机会、竞争强度和付费潜力。",
}

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
