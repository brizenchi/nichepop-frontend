import { NextResponse } from 'next/server'

const mockIdeas = [
  {
    id: "idea_01",
    title: "AI 驱动的竞品价格监控工具",
    description: "帮助电商卖家实时追踪竞品价格变动，自动触发调价建议。",
    industry: "电商 / SaaS",
    tags: ["pricing", "ecommerce", "automation"],
    heatScore: 87,
    sources: [
      { platform: "reddit", count: 14, url: "https://www.reddit.com/r/ecommerce/comments/mock01" },
      { platform: "google_trends", count: 6, url: "" },
    ],
    createdAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "idea_02",
    title: "面向独立开发者的用户访谈匹配平台",
    description: "根据产品方向自动匹配目标用户，安排 15 分钟付费访谈。",
    industry: "SaaS / 创业工具",
    tags: ["user-research", "indie-hacker", "validation"],
    heatScore: 79,
    sources: [
      { platform: "reddit", count: 22, url: "https://www.reddit.com/r/SaaS/comments/mock02" },
      { platform: "google_trends", count: 4, url: "" },
    ],
    createdAt: "2026-05-10T07:30:00Z",
  },
  {
    id: "idea_03",
    title: "Reddit 社区冷启动自动化工具",
    description: "帮创业者在 Reddit 相关社区自动发现高意向帖子并生成回复建议。",
    industry: "营销 / Growth",
    tags: ["reddit", "cold-start", "marketing"],
    heatScore: 92,
    sources: [
      { platform: "reddit", count: 31, url: "https://www.reddit.com/r/startups/comments/mock03" },
      { platform: "google_trends", count: 9, url: "" },
    ],
    createdAt: "2026-05-10T06:45:00Z",
  },
  {
    id: "idea_04",
    title: "SaaS 用户反馈聚合 + 自动分类看板",
    description: "从 Reddit、Product Hunt、App Store 等渠道自动收集用户反馈，AI 分类后生成产品路线图建议。",
    industry: "SaaS / 产品管理",
    tags: ["feedback", "product-management", "automation"],
    heatScore: 74,
    sources: [
      { platform: "reddit", count: 18, url: "https://www.reddit.com/r/SaaS/comments/mock04" },
      { platform: "google_trends", count: 3, url: "" },
    ],
    createdAt: "2026-05-09T22:00:00Z",
  },
  {
    id: "idea_05",
    title: "基于搜索意图的 Landing Page 自动生成器",
    description: "输入目标关键词，AI 自动生成针对该搜索意图的高转化落地页。",
    industry: "SEO / 建站",
    tags: ["seo", "landing-page", "ai-generation"],
    heatScore: 85,
    sources: [
      { platform: "reddit", count: 15, url: "https://www.reddit.com/r/SEO/comments/mock05" },
      { platform: "google_trends", count: 7, url: "" },
    ],
    createdAt: "2026-05-09T20:30:00Z",
  },
  {
    id: "idea_06",
    title: "SaaS Churn 预测 + 自动挽留系统",
    description: "通过用户行为数据预测即将流失的客户，自动触发个性化挽留邮件和优惠。",
    industry: "SaaS / 客户成功",
    tags: ["churn", "retention", "automation"],
    heatScore: 81,
    sources: [
      { platform: "reddit", count: 11, url: "https://www.reddit.com/r/SaaS/comments/mock06" },
      { platform: "google_trends", count: 5, url: "" },
    ],
    createdAt: "2026-05-09T18:00:00Z",
  },
]

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json({
    success: true,
    data: {
      ideas: mockIdeas,
      total: mockIdeas.length,
      updatedAt: new Date().toISOString(),
    },
  })
}
