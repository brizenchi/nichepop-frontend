"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Radar, Search, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type ProductInput = {
  name: string
  url: string
  description: string
}

type LoaderStep = {
  id: string
  title: string
  detail: string
}

const STEP_INTERVALS = [700, 1100, 1800, 2600, 3400]
const MIN_LOADER_DURATION_MS = 4200

function deriveAudience(product: ProductInput) {
  const text = `${product.name} ${product.description}`.toLowerCase()

  if (text.includes("saas")) return "SaaS founders"
  if (text.includes("seo")) return "SEO operators"
  if (text.includes("shopify") || text.includes("ecommerce")) return "ecommerce teams"
  if (text.includes("reddit")) return "community-led builders"

  return "early adopters"
}

function deriveAngle(product: ProductInput) {
  const text = product.description.toLowerCase()

  if (text.includes("lead") || text.includes("customer")) return "customer discovery"
  if (text.includes("content") || text.includes("post")) return "content angle"
  if (text.includes("competitor")) return "competitive signal"
  if (text.includes("price")) return "pricing pain points"

  return "pain-point clustering"
}

export function getMarketingLoaderMinDuration() {
  return MIN_LOADER_DURATION_MS
}

export function MarketingAnalysisLoader({ product }: { product: ProductInput }) {
  const audience = useMemo(() => deriveAudience(product), [product])
  const angle = useMemo(() => deriveAngle(product), [product])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [progress, setProgress] = useState(7)
  const [elapsedMs, setElapsedMs] = useState(0)

  const steps: LoaderStep[] = useMemo(
    () => [
      {
        id: "positioning",
        title: "解析项目定位",
        detail: `理解 ${product.name || "你的产品"} 卖给谁、解决什么问题、优先切什么受众。`,
      },
      {
        id: "signal-map",
        title: "映射社区与关键词",
        detail: `围绕 ${audience} 建立社区列表、搜索词和讨论入口。`,
      },
      {
        id: "scan",
        title: "扫描公开讨论",
        detail: "交叉读取 Reddit、搜索趋势和高意图问题线程。",
      },
      {
        id: "cluster",
        title: "聚类痛点与机会",
        detail: `提炼 ${angle}，区分帖子机会、客户线索和产品方向。`,
      },
      {
        id: "compose",
        title: "生成营销 dashboard",
        detail: "整理推荐动作、讨论动态、目标客户和建议开发方向。",
      },
    ],
    [angle, audience, product.name]
  )

  useEffect(() => {
    const startedAt = Date.now()

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      setElapsedMs(elapsed)

      const nextStepIndex = STEP_INTERVALS.reduce((index, stepStart, currentIndex) => {
        return elapsed >= stepStart ? currentIndex : index
      }, 0)

      setActiveStepIndex(Math.min(nextStepIndex, steps.length - 1))

      const baseProgress = Math.min(92, 7 + Math.floor((elapsed / MIN_LOADER_DURATION_MS) * 85))
      setProgress(baseProgress)
    }, 80)

    return () => window.clearInterval(interval)
  }, [steps.length])

  const liveNotes = [
    `正在识别 ${audience} 常出现的讨论社区`,
    `正在提取与 ${product.name || "项目"} 相关的高意图问题`,
    `正在整理可直接下场互动的帖子机会`,
    `正在计算哪些线索更适合优先跟进`,
  ]

  const currentNoteIndex = Math.min(liveNotes.length - 1, Math.floor(elapsedMs / 900))

  return (
    <div className="space-y-6">
      <div className="max-w-4xl">
        <Badge className="border-[#E8E1F4] bg-white/90 px-3 py-1 text-[#7D4CE6]">
          AI Analysis In Progress
        </Badge>
        <h1
          className="mt-4 text-3xl font-black tracking-tight text-[#111111] sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
        >
          AI 正在为 {product.name || "你的项目"} 生成营销 dashboard
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6E677D] sm:text-base">
          这一步不该瞬间完成。系统正在解析定位、找社区、聚类痛点、筛选目标客户，并把结果整理成一个可操作的 dashboard。
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.62fr_0.38fr]">
        <Card className="border-[#E8E1F4] bg-white/95 shadow-[0_24px_80px_rgba(77,54,42,0.12)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg text-[#111111]">Processing Pipeline</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[#1479D6]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#7D7590]">
                <span>Overall progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3 h-2 bg-[#E8E1F4]" />
              <p className="mt-3 text-sm text-[#6E677D]">{liveNotes[currentNoteIndex]}</p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const isDone = index < activeStepIndex
                const isActive = index === activeStepIndex

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all duration-300",
                      isDone && "border-[#CDEED8] bg-[#EEF9F2]",
                      isActive && "border-[#D9EAFB] bg-[#EAF6FF] shadow-[0_0_0_1px_rgba(20,121,214,0.12)]",
                      !isDone && !isActive && "border-[#E8E1F4] bg-[#F7F4FF]/75"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                          isDone && "border-[#CDEED8] bg-white text-[#43B86E]",
                          isActive && "border-[#D9EAFB] bg-white text-[#1479D6]",
                          !isDone && !isActive && "border-[#E8E1F4] bg-white/90 text-[#7D7590]"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#111111]">{step.title}</div>
                        <div className="mt-1 text-sm leading-6 text-[#6E677D]">{step.detail}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#E8E1F4] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F4FF_65%,#EFE9FF_100%)]">
            <CardHeader>
              <CardTitle className="text-lg text-[#111111]">Live Analysis Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: Radar,
                  title: "Audience map",
                  text: `${audience} 正在被识别为当前最可能响应的一组人。`,
                },
                {
                  icon: Search,
                  title: "Signal discovery",
                  text: `系统正在找与 ${angle} 最相关的高意图线程。`,
                },
                {
                  icon: Users,
                  title: "Lead scoring",
                  text: "会优先标记主动提问、表达痛点、求工具推荐的用户。",
                },
                {
                  icon: Sparkles,
                  title: "Output shaping",
                  text: "最终结果会被整理成推荐动作、帖子建议和客户线索。",
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl border border-[#E8E1F4] bg-white/82 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-[#EAF6FF] p-2.5 text-[#1479D6]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#111111]">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-[#6E677D]">{item.text}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-[#E8E1F4] bg-white/95">
            <CardHeader>
              <CardTitle className="text-base text-[#111111]">预计输出</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#6E677D]">
              {[
                "推荐发帖角度与评论切入点",
                "相关讨论动态与高意图帖子",
                "部分可跟进目标客户预览",
                "后续适合收费解锁的持续跟进能力",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#E8E1F4] bg-white/82 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#43B86E]" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
