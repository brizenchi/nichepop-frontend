"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, ExternalLink, Loader2 } from "lucide-react"
import { dashboardService, type Idea } from "@/lib/api/services/dashboard.service"

const platformIcon: Record<string, string> = {
  reddit: "🟠",
  x: "🔵",
  linkedin: "🟢",
  google_trends: "📈",
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getIdeas().then((data) => {
      setIdeas(data.ideas)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7FD0FF]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="border-[#21305F] bg-[#0B132B] px-3 py-1 text-[#7CFF8D]">Free Tool 1</Badge>
          <h1
            className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
          >
            Ideas DB
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#96A5D1]">
            第一个免费工具。各种值得做的机会先免费看，先逛机会、看来源、挑方向，再决定哪些 idea 值得进入下一步分析。
          </p>
        </div>
        <div className="rounded-2xl border border-[#1A254A] bg-[#081022]/90 p-4 lg:max-w-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7080AC]">Next step</div>
          <Link
            href="/dashboard/validate"
            className="mt-3 flex items-center justify-between text-sm font-semibold text-white transition-colors hover:text-[#7FD0FF]"
          >
            挑中一个机会后，去免费分析商业机会
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ideas.map((idea) => (
          <Card key={idea.id} className="border-[#1A254A] bg-[#0B132B]/95 transition-all hover:border-[#2B69FF]/40">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-[#21305F] bg-[#111A38] text-[#8FA0CB]">{idea.industry}</Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className="h-3.5 w-3.5 text-[#FFB26A]" />
                      <span className="font-semibold text-[#FFB26A]">{idea.heatScore}</span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{idea.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#8FA0CB]">{idea.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#1A254A] bg-[#081022] px-2.5 py-1 text-xs text-[#7080AC]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#1A254A] pt-4">
                <div className="flex items-center gap-3">
                  {idea.sources.filter(s => s.count > 0).map((source) => (
                    <a
                      key={source.platform}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#7080AC] hover:text-white transition-colors"
                    >
                      <span>{platformIcon[source.platform] || "📌"}</span>
                      <span>{source.platform}</span>
                      <span className="font-semibold text-white">({source.count})</span>
                    </a>
                  ))}
                </div>
                <Link
                  href={`/dashboard/validate?idea=${encodeURIComponent(idea.title + " — " + idea.description)}`}
                  className="flex items-center gap-1 text-xs font-semibold text-[#7FD0FF] hover:underline"
                >
                  免费分析这个 Idea
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
