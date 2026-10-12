import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { idea } = body

  await new Promise((resolve) => setTimeout(resolve, 800))

  const mockReport = {
    id: "report_" + Date.now(),
    ideaInput: idea,
    overallScore: 76,
    generatedAt: new Date().toISOString(),
    dimensions: [
      {
        name: "市场热度",
        score: 82,
        description: "该话题在 Reddit 上近 30 天讨论频次明显上升，多个相关帖子获得高互动。",
        sources: ["r/SaaS (14 posts)", "r/startups (6 posts)", "r/ecommerce (8 posts)"],
      },
      {
        name: "搜索需求",
        score: 71,
        description: "相关关键词月搜索量中等，长尾词竞争度较低，有明确的信息搜索意图。",
        sources: ["Google Trends (上升趋势)", "月搜索量: 2,400", "竞争度: Low-Medium"],
      },
      {
        name: "付费意愿",
        score: 68,
        description: "部分用户在讨论中主动询问工具推荐并表示愿意付费，但价格敏感度较高。",
        sources: ["Reddit 评论中 3 次提及 'willing to pay'", "2 个帖子主动询问付费工具推荐"],
      },
      {
        name: "竞品密度",
        score: 83,
        description: "现有解决方案较少，主要为通用型工具，缺乏专门针对该痛点的垂直产品。",
        sources: ["直接竞品: 2 个", "间接竞品: 5 个", "市场空白明显"],
      },
    ],
    painPoints: [
      {
        text: "I spend 3+ hours every week manually checking competitor prices across 5 different platforms.",
        source: "r/ecommerce",
        url: "https://www.reddit.com/r/ecommerce/comments/mock_pain01",
      },
      {
        text: "Current tools either cost $500/mo or only support Amazon. Need something for indie Shopify sellers.",
        source: "r/SaaS",
        url: "https://www.reddit.com/r/SaaS/comments/mock_pain02",
      },
      {
        text: "The biggest problem isn't finding prices, it's knowing WHEN to change mine and by how much.",
        source: "r/smallbusiness",
        url: "https://www.reddit.com/r/smallbusiness/comments/mock_pain03",
      },
    ],
    competitors: [
      {
        name: "Prisync",
        description: "企业级竞品价格监控，起价 $99/月",
        strengths: "数据全面、支持多平台",
        weaknesses: "价格高、面向大卖家、无 AI 调价建议",
      },
      {
        name: "Competera",
        description: "AI 定价优化平台，面向大型零售商",
        strengths: "算法成熟、客户案例多",
        weaknesses: "不面向小卖家、需要销售对接",
      },
      {
        name: "Price2Spy",
        description: "价格监控 + 比价工具",
        strengths: "功能全面、支持 API",
        weaknesses: "UI 老旧、学习曲线陡峭",
      },
    ],
  }

  return NextResponse.json({
    success: true,
    data: mockReport,
  })
}
