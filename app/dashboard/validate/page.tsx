"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Loader2, ShieldCheck, TrendingUp, CreditCard, Swords, ArrowRight } from "lucide-react"
import { dashboardService, type ValidationReport } from "@/lib/api/services/dashboard.service"

const dimensionIcons: Record<string, typeof TrendingUp> = {
  市场热度: TrendingUp,
  搜索需求: TrendingUp,
  付费意愿: CreditCard,
  竞品密度: Swords,
}

const scoreColor = (score: number) => {
  if (score >= 80) return "text-[#43B86E]"
  if (score >= 60) return "text-[#D49A00]"
  return "text-[#DC2626]"
}

export default function ValidatePage() {
  return (
    <Suspense fallback={null}>
      <ValidateContent />
    </Suspense>
  )
}

function ValidateContent() {
  const searchParams = useSearchParams()
  const prefilledIdea = searchParams.get("idea") || ""

  const [ideaInput, setIdeaInput] = useState(prefilledIdea)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ValidationReport | null>(null)

  const handleRunSample = async () => {
    if (!ideaInput.trim()) return
    setLoading(true)
    setReport(null)
    try {
      const data = await dashboardService.validateIdea(ideaInput)
      setReport(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <Badge className="border-[#E8E1F4] bg-white/90 px-3 py-1 text-[#1479D6]">Free Tool 2</Badge>
          <h1
            className="mt-3 text-3xl font-black tracking-tight text-[#111111] sm:text-4xl"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
          >
            Idea Analysis
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6E677D]">
            第二个免费工具。输入任何 idea，直接看它的商业机会、竞争强度、痛点密度和付费潜力，先判断值不值得做，再决定要不要进入付费 Reddit Marketing。
          </p>
        </div>

        <Card className="border-[#E8E1F4] bg-white/95">
          <CardContent className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">描述你的 Idea</label>
              <Textarea
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                className="min-h-28 rounded-2xl border-[#E8E1F4] bg-[#F7F4FF]/75 text-[#111111] placeholder:text-[#8E86A0] focus:border-[#7D4CE6]"
                placeholder="例如：帮助电商卖家实时追踪竞品价格变动，自动触发调价建议..."
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.65fr_0.35fr]">
              <div className="rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <ShieldCheck className="h-4 w-4 text-[#1479D6]" />
                  先免费判断值不值得做
                </div>
                <p className="mt-2 text-sm leading-7 text-[#6E677D]">
                  这一步保持免费，是为了先把商业机会看清楚，再决定是否要投入时间、内容或开发资源。
                </p>
              </div>
              <div className="rounded-2xl border border-[#F1D89A] bg-[#FFF7D8] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[#D49A00]">Not sure yet?</div>
                <Link href="/dashboard/ideas" className="mt-3 flex items-center justify-between text-sm font-semibold text-[#111111] hover:text-[#D49A00]">
                  回到 Ideas DB 继续免费看机会
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <Button
              onClick={handleRunSample}
              disabled={!ideaInput.trim() || loading}
              className="rounded-full bg-[#111111] px-6 text-white hover:bg-[#111111]/92"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Run Free Idea Analysis
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <Card className="border-[#E8E1F4] bg-white/92">
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1479D6]" />
                <p className="mt-4 text-sm text-[#6E677D]">正在跨平台检索数据并生成免费商业机会分析...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <div className="space-y-6">
            <Card className="border-[#E8E1F4] bg-white/95">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#7D7590]">综合机会评分</div>
                    <div className={`mt-2 text-5xl font-black ${scoreColor(report.overallScore)}`}>
                      {report.overallScore}
                      <span className="text-lg text-[#7D7590]"> / 100</span>
                    </div>
                  </div>
                  <div className="w-full max-w-xs">
                    <Progress value={report.overallScore} className="h-3 bg-[#E8E1F4]" />
                    <p className="mt-2 text-xs text-[#7D7590]">这个工具持续免费，先帮你把商业机会看清楚。</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {report.dimensions.map((dim) => {
                const Icon = dimensionIcons[dim.name] || TrendingUp
                return (
                  <Card key={dim.name} className="border-[#E8E1F4] bg-white/95">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[#1479D6]" />
                          <span className="text-sm font-semibold text-[#111111]">{dim.name}</span>
                        </div>
                        <span className={`text-2xl font-black ${scoreColor(dim.score)}`}>{dim.score}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#6E677D]">{dim.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {dim.sources.map((source) => (
                          <span key={source} className="rounded-full border border-[#E8E1F4] bg-[#F7F4FF]/75 px-2.5 py-1 text-xs text-[#7D7590]">
                            {source}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="border-[#F1D89A] bg-[#FFF7D8]/95">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#111111]">下一步才是付费 Reddit 面板</div>
                  <p className="mt-1 max-w-3xl text-sm leading-7 text-[#8C6410]">
                    当一个 idea 已经被判断为值得继续，下一步通常不是再买一份报告，而是去 Reddit 找线程、试回复、追踪潜在客户。
                  </p>
                </div>
                <Link href="/dashboard">
                  <Button className="rounded-full bg-[#111111] text-white hover:bg-[#111111]/92">
                    Open Paid Reddit Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-[#E8E1F4] bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg text-[#111111]">用户痛点样本</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.painPoints.slice(0, 2).map((point) => (
                  <div key={point.url} className="rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
                    <p className="text-sm leading-7 text-[#111111]">"{point.text}"</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge className="border-[#E8E1F4] bg-white text-[#7D7590]">{point.source}</Badge>
                      <a href={point.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#1479D6] hover:underline">
                        查看原帖 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
