"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight,
  BarChart3,
  Compass,
  Eye,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  MessageSquare,
  Radar,
  Rss,
  Settings2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { dashboardService, type MonitorData } from "@/lib/api/services/dashboard.service"
import { PricingModal } from "@/components/pricing-modal"
import LoginDialog from "@/components/LoginDialog"
import { useAuth } from "@/hooks/useAuth"
import { MarketingAnalysisLoader, getMarketingLoaderMinDuration } from "@/components/dashboard/marketing-analysis-loader"

type TabId = "overview" | "suggestions" | "leads" | "feed" | "dev-direction" | "adjust"

const tabs: { id: TabId; label: string; icon: typeof BarChart3; premium?: boolean }[] = [
  { id: "overview", label: "营销总览", icon: BarChart3 },
  { id: "suggestions", label: "推荐动作", icon: FileText },
  { id: "leads", label: "目标客户", icon: Users, premium: true },
  { id: "feed", label: "讨论动态", icon: Rss },
  { id: "dev-direction", label: "产品方向", icon: Compass, premium: true },
  { id: "adjust", label: "调整策略", icon: Settings2, premium: true },
]

type ProductInput = {
  name: string
  url: string
  description: string
}

interface MarketingWorkspaceProps {
  mode?: "dashboard" | "monitor-page"
}

export function MarketingWorkspace({ mode = "dashboard" }: MarketingWorkspaceProps) {
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState<ProductInput>({ name: "", url: "", description: "" })
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MonitorData | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [showPricing, setShowPricing] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleStart = async () => {
    if (!product.name.trim() || !product.description.trim()) return
    setLoading(true)
    const startedAt = Date.now()
    try {
      const result = await dashboardService.createMonitor(product)
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, getMarketingLoaderMinDuration() - elapsed)

      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }

      setData(result)
      setStarted(true)
      setActiveTab("overview")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStarted(false)
    setData(null)
    setActiveTab("overview")
  }

  const openUpgrade = () => {
    if (isAuthenticated) {
      setShowPricing(true)
    } else {
      setShowLogin(true)
    }
  }

  const isPremiumTab = tabs.find((tab) => tab.id === activeTab)?.premium

  if (loading) {
    return (
      <>
        <MarketingAnalysisLoader product={product} />
        <PricingModal open={showPricing} onOpenChange={setShowPricing} feature="Reddit marketing panel" />
        <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
      </>
    )
  }

  if (!started) {
    return (
      <>
        <div className="space-y-8" id="project-intake">
          <div className="max-w-4xl">
            <Badge className="border-[#E8E1F4] bg-white/90 px-3 py-1 text-[#7D4CE6]">
              {mode === "dashboard" ? "Paid Reddit Workflow" : "Reddit Marketing Core"}
            </Badge>
            <h1
              className="mt-4 text-3xl font-black tracking-tight text-[#111111] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
            >
              {mode === "dashboard"
                ? "把 Reddit 营销变成一个可执行、可跟进的工作台"
                : "持续跟踪 Reddit 线程、回复机会和潜在客户"}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6E677D] sm:text-base">
              {mode === "dashboard"
                ? "Ideas DB 和 Idea Analysis 是免费的。这一页是付费的 Reddit Marketing Panel: 帮你找值得回复的线程、生成回复角度、整理潜在客户，并把跟进动作留在一个面板里。"
                : "输入你的项目后，系统会生成一版 Reddit 营销工作台，帮助你持续追踪讨论、机会和线索。"}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-[#E8E1F4] bg-white/92 shadow-[0_20px_44px_rgba(77,54,42,0.08)]">
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">项目名称</label>
                    <Input
                      value={product.name}
                      onChange={(e) => setProduct((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：NichePop"
                      className="h-11 rounded-2xl border-[#E8E1F4] bg-white text-[#111111] placeholder:text-[#8E86A0]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">项目 URL（可选）</label>
                    <Input
                      value={product.url}
                      onChange={(e) => setProduct((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      className="h-11 rounded-2xl border-[#E8E1F4] bg-white text-[#111111] placeholder:text-[#8E86A0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">你卖什么，卖给谁</label>
                  <Textarea
                    value={product.description}
                    onChange={(e) => setProduct((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="例如：帮助独立开发者发现值得做的 AI agent 工具，并在 Reddit 找到高相关线程与潜在客户..."
                    className="min-h-36 rounded-2xl border-[#E8E1F4] bg-white text-[#111111] placeholder:text-[#8E86A0]"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={handleStart}
                    disabled={!product.name.trim() || !product.description.trim() || loading}
                    className="rounded-full bg-[#111111] px-6 text-white hover:bg-[#111111]/92"
                  >
                    <Radar className="mr-2 h-4 w-4" />
                    Generate Reddit Panel
                  </Button>
                  <span className="text-xs text-[#7D7590]">Ideas DB 和 Idea Analysis 免费。Reddit 面板负责执行和持续跟进。</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-[#E8E1F4] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F4FF_65%,#EFE9FF_100%)] shadow-[0_20px_44px_rgba(77,54,42,0.08)]">
              <CardHeader>
                <CardTitle className="text-lg text-[#111111]">这个付费面板解决什么</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#6E677D]">
                {[
                  "一个围绕 Reddit 的执行面板，集中放线程、回复和线索",
                  "可直接参考的回帖角度和发帖建议",
                  "潜在客户与高意向讨论的集中视图",
                  "持续跟进而不是每次都从零搜索",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-[#E8E1F4] bg-white/82 p-4">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#43B86E]" />
                    <span>{item}</span>
                  </div>
                ))}
                <div className="rounded-2xl border border-[#F1D89A] bg-[#FFF7D8] p-4 text-[#8C6410]">
                  适合付费的原因：它是一个高频执行工作流，不只是一次性分析结果。
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PricingModal open={showPricing} onOpenChange={setShowPricing} feature="Reddit marketing panel" />
        <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
      </>
    )
  }

  if (!data) return null

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[#E8E1F4] bg-white text-[#7D4CE6]">Reddit Marketing Panel</Badge>
              <Badge className="border-[#F1D89A] bg-[#FFF7D8] text-[#D49A00]">Paid workflow</Badge>
            </div>
            <h1
              className="mt-3 text-2xl font-black tracking-tight text-[#111111] sm:text-3xl"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
            >
              {product.name} 的 Reddit 营销工作台
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[#6E677D]">
              这里不是泛泛的“营销 dashboard”，而是专门用来找 Reddit 线程、回复机会和潜在客户的执行面板。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-full border-[#E8E1F4] bg-white/72 text-[#111111] hover:bg-[#F7F4FF]"
            >
              重新输入项目
            </Button>
            <Button onClick={openUpgrade} className="rounded-full bg-[#111111] text-white hover:bg-[#111111]/92">
              Unlock Full Reddit Workflow
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.25fr_0.75fr]">
          <div className="rounded-3xl border border-[#E8E1F4] bg-white/92 p-4 shadow-[0_24px_64px_rgba(77,54,42,0.08)] backdrop-blur-xl">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[#F3EDFF] text-[#111111] shadow-[0_0_0_1px_rgba(125,76,230,0.16)]"
                        : "text-[#6E677D] hover:bg-[#F7F4FF] hover:text-[#111111]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.premium ? <Lock className="h-3.5 w-3.5 text-[#D49A00]" /> : null}
                  </button>
                )
              })}
            </nav>

            <div className="mt-4 rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#7D7590]">工具入口</div>
              <div className="mt-3 space-y-2">
                <Link href="/dashboard/ideas" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#6E677D] transition-colors hover:bg-white hover:text-[#111111]">
                  Ideas DB
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/validate" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#6E677D] transition-colors hover:bg-white hover:text-[#111111]">
                  Idea Analysis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === "overview" && <OverviewPanel data={data} />}
            {activeTab === "suggestions" && <SuggestionsPanel data={data} />}
            {activeTab === "feed" && <FeedPanel data={data} />}

            {activeTab === "leads" && (
              <PremiumGate
                title="目标客户名单"
                description="完整线索名单和可跟进对象放在付费 Reddit workflow 里，因为这是最直接的执行价值。"
                preview={<LeadsPanel data={data} previewMode />}
                onUpgrade={openUpgrade}
              />
            )}

            {activeTab === "dev-direction" && (
              <PremiumGate
                title="建议开发方向"
                description="这里保留部分方向判断，完整的持续变化和优先级调整更适合放在付费工作流里。"
                preview={<DevDirectionPanel data={data} previewMode />}
                onUpgrade={openUpgrade}
              />
            )}

            {activeTab === "adjust" && (
              <PremiumGate
                title="调整策略"
                description="反复调整项目定位和 Reddit 监控策略，是高频工作流，适合放在升级后解锁。"
                preview={<AdjustPanel product={product} locked />}
                onUpgrade={openUpgrade}
              />
            )}
          </div>
        </div>

        {isPremiumTab ? (
          <Card className="border-[#F1D89A] bg-[#FFF7D8]/90">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[#111111]">为什么这里适合放付费墙</div>
                <p className="mt-1 max-w-3xl text-sm leading-7 text-[#8C6410]">
                  用户先用免费工具找到机会、判断 idea，再为 Reddit 执行面板付费，阻力比一上来就收费低得多。
                </p>
              </div>
              <Button onClick={openUpgrade} className="rounded-full bg-[#111111] text-white hover:bg-[#111111]/92">
                Upgrade to Reddit Marketing
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature="Reddit marketing panel" />
      <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}

function PremiumGate({
  title,
  description,
  preview,
  onUpgrade,
}: {
  title: string
  description: string
  preview: React.ReactNode
  onUpgrade: () => void
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#E8E1F4] bg-white/92">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F7F4FF]" />
      <div className="max-h-[30rem] overflow-hidden opacity-60 blur-[1px]">{preview}</div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <Card className="border-[#D8CCF2] bg-white/96 shadow-[0_24px_80px_rgba(77,54,42,0.12)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-[#D49A00]">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-semibold">{title}</span>
            </div>
            <p className="text-sm leading-7 text-[#6E677D]">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={onUpgrade} className="rounded-full bg-[#111111] text-white hover:bg-[#111111]/92">
                Unlock Reddit Workflow
              </Button>
              <Link href="/pricing">
                <Button variant="outline" className="rounded-full border-[#E8E1F4] bg-white text-[#111111] hover:bg-[#F7F4FF]">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: typeof Eye; accent: string }) {
  return (
    <Card className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#7D7590]">{label}</div>
            <div className="mt-2 text-2xl font-black text-[#111111]">{typeof value === "number" ? value.toLocaleString() : value}</div>
          </div>
          <div className={cn("rounded-2xl p-3", accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewPanel({ data }: { data: MonitorData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">营销总览</h2>
        <p className="mt-1 text-sm text-[#6E677D]">这版先回答值不值得继续做 marketing follow-up。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="总曝光量" value={data.stats.impressions} icon={Eye} accent="text-[#1479D6] bg-[#EAF6FF]" />
        <StatCard label="相关帖子" value={data.stats.mentionPosts} icon={FileText} accent="text-[#43B86E] bg-[#EEF9F2]" />
        <StatCard label="相关评论" value={data.stats.mentionComments} icon={MessageSquare} accent="text-[#D49A00] bg-[#FFF7D8]" />
        <StatCard label="建议动作" value={data.stats.todayTasks} icon={ListChecks} accent="text-[#7D4CE6] bg-[#F3EDFF]" />
        <StatCard label="潜在客户" value={data.stats.potentialUsers} icon={UserPlus} accent="text-[#BA87FF] bg-[#F7F0FF]" />
      </div>
      <Card className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg text-[#111111]">过去 7 天趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-[#6E677D]">
            <TrendingUp className="h-4 w-4 text-[#43B86E]" />
            <span>
              曝光量增长 <span className="font-semibold text-[#43B86E]">+{data.trends.impressionsGrowth}%</span>，有效提及增长{" "}
              <span className="font-semibold text-[#43B86E]">+{data.trends.mentionsGrowth}%</span>
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.trends.platforms.map((p) => (
              <div key={p.name} className="rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7D7590]">{p.name}</div>
                <div className="mt-2 text-lg font-bold text-[#111111]">{p.impressions.toLocaleString()}</div>
                <div className="mt-1 text-xs text-[#43B86E]">+{p.growth}% vs last week</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SuggestionsPanel({ data }: { data: MonitorData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">推荐动作</h2>
        <p className="mt-1 text-sm text-[#6E677D]">用户现在就能照着发帖、评论和切入。</p>
      </div>
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#111111]">
          <FileText className="h-4 w-4 text-[#1479D6]" />
          建议发帖
        </h3>
        <div className="space-y-3">
          {data.suggestedPosts.map((post) => (
            <Card key={post.id} className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Badge className="border-[#D9EAFB] bg-[#EAF6FF] text-[#1479D6]">{post.platform}</Badge>
                  {post.subreddit ? <span className="text-xs text-[#7D7590]">{post.subreddit}</span> : null}
                </div>
                <h4 className="mt-3 text-base font-semibold text-[#111111]">{post.title}</h4>
                <p className="mt-2 text-sm leading-7 text-[#6E677D]">{post.reason}</p>
                <div className="mt-3 rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 px-4 py-3 text-sm text-[#111111]">
                  <span className="text-xs uppercase tracking-[0.18em] text-[#7D7590]">语气建议：</span>
                  {post.tone}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#111111]">
          <MessageSquare className="h-4 w-4 text-[#43B86E]" />
          建议评论
        </h3>
        <div className="space-y-3">
          {data.suggestedComments.map((comment) => (
            <Card key={comment.id} className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="border-[#CDEED8] bg-[#EEF9F2] text-[#43B86E]">{comment.platform}</Badge>
                  <a href={comment.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1479D6] hover:underline">
                    打开帖子 →
                  </a>
                </div>
                <h4 className="mt-3 text-sm font-semibold text-[#111111]">{comment.target}</h4>
                <p className="mt-2 text-sm leading-7 text-[#6E677D]">{comment.suggestion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadsPanel({ data, previewMode = false }: { data: MonitorData; previewMode?: boolean }) {
  const leads = previewMode ? data.leads.slice(0, 2) : data.leads

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">目标客户</h2>
        <p className="mt-1 text-sm text-[#6E677D]">通过公开讨论发现的高意向潜在用户。</p>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[#111111]">{lead.name}</span>
                    <Badge className="border-[#D9EAFB] bg-[#EAF6FF] text-[#1479D6]">{lead.platform}</Badge>
                    <Badge
                      className={cn(
                        "border",
                        lead.status === "new" && "border-[#CDEED8] bg-[#EEF9F2] text-[#43B86E]",
                        lead.status === "replied" && "border-[#D9EAFB] bg-[#EAF6FF] text-[#1479D6]",
                        lead.status === "watching" && "border-[#F1D89A] bg-[#FFF7D8] text-[#D49A00]"
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#6E677D]">{lead.signal}</p>
                  <div className="mt-2 text-xs text-[#7D7590]">
                    Engagement: <span className="font-semibold text-[#111111]">{lead.engagement}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={lead.threadUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8E1F4] bg-white px-3 py-2 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F4FF]">
                    查看帖子
                  </a>
                  {!previewMode ? (
                    <a href={lead.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8E1F4] bg-white px-3 py-2 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F4FF]">
                      查看主页
                    </a>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function FeedPanel({ data }: { data: MonitorData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">讨论动态</h2>
        <p className="mt-1 text-sm text-[#6E677D]">先给用户可参与的帖子，帮助他立刻感知价值。</p>
      </div>
      <div className="space-y-3">
        {data.feed.map((item) => (
          <Card key={item.id} className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-[#D9EAFB] bg-[#EAF6FF] text-[#1479D6]">{item.platform}</Badge>
                    {item.subreddit ? <span className="text-xs text-[#7D7590]">{item.subreddit}</span> : null}
                    <span className="text-xs text-[#7D7590]">by {item.author}</span>
                    <span className="ml-auto text-xs text-[#7D7590]">
                      相关度 <span className="font-semibold text-[#43B86E]">{item.relevance}%</span>
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-[#111111]">{item.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-[#6E677D]">{item.summary}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[#7D7590]">
                    <span>Engagement: {item.engagement}</span>
                    <span>
                      {new Date(item.postedAt).toLocaleString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 rounded-full border border-[#E8E1F4] bg-white px-3 py-2 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F7F4FF]"
                >
                  打开 <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DevDirectionPanel({ data, previewMode = false }: { data: MonitorData; previewMode?: boolean }) {
  const directions = previewMode ? data.devDirections.slice(0, 2) : data.devDirections

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">建议开发方向</h2>
        <p className="mt-1 text-sm text-[#6E677D]">基于用户反馈和市场信号推荐的产品迭代方向。</p>
      </div>
      <div className="space-y-3">
        {directions.map((item) => (
          <Card key={item.id} className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-semibold text-[#111111]">{item.direction}</h4>
                  <p className="mt-2 text-sm leading-7 text-[#6E677D]">{item.evidence}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Badge
                    className={cn(
                      "border",
                      item.priority === "high" && "border-[#CDEED8] bg-[#EEF9F2] text-[#43B86E]",
                      item.priority === "medium" && "border-[#F1D89A] bg-[#FFF7D8] text-[#D49A00]"
                    )}
                  >
                    {item.priority}
                  </Badge>
                  {!previewMode ? (
                    <Badge className="border-[#E8E1F4] bg-[#F7F4FF] text-[#7D7590]">Effort: {item.effort}</Badge>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AdjustPanel({ product, locked = false }: { product: ProductInput; locked?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">调整策略</h2>
        <p className="mt-1 text-sm text-[#6E677D]">修改项目定位后，系统会重新生成监控策略和建议。</p>
      </div>
      <Card className="border-[#E8E1F4] bg-white/92 shadow-[0_16px_34px_rgba(77,54,42,0.06)]">
        <CardContent className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">当前项目描述</label>
            <div className="rounded-2xl border border-[#E8E1F4] bg-[#F7F4FF]/75 px-4 py-3 text-sm leading-7 text-[#111111]">
              {product.description}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">新的定位方向</label>
            <Textarea
              disabled={locked}
              className="min-h-32 rounded-2xl border-[#E8E1F4] bg-white text-[#111111] placeholder:text-[#8E86A0] focus:border-[#7D4CE6]"
              placeholder="描述你想要调整的项目方向..."
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#7D7590]">监控社区</label>
            <Input
              disabled={locked}
              className="h-11 rounded-2xl border-[#E8E1F4] bg-white text-[#111111] placeholder:text-[#8E86A0]"
              placeholder="例如：r/SaaS, r/startups, r/SEO, r/marketing"
              defaultValue="r/SaaS, r/startups, r/SEO, r/marketing, r/indiehackers"
            />
          </div>
          <Button disabled={locked} className="w-full rounded-full bg-[#111111] text-white hover:bg-[#111111]/92">
            重新生成监控策略
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
