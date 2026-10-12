import { NextRequest, NextResponse } from 'next/server'

const mockMonitorData = {
  stats: {
    impressions: 48200,
    mentionPosts: 34,
    mentionComments: 127,
    todayTasks: 8,
    potentialUsers: 19,
  },
  trends: {
    impressionsGrowth: 23,
    mentionsGrowth: 18,
    platforms: [
      { name: "Reddit", impressions: 48200, growth: 23 },
    ],
  },
  suggestedPosts: [
    {
      id: "post_01",
      platform: "Reddit",
      subreddit: "r/SaaS",
      title: "How we use Reddit threads to decide what to build next",
      reason: "Matches the 'validate saas idea' cluster with 286 engagement score.",
      tone: "Share a workflow, not a pitch. End with a question.",
    },
    {
      id: "post_02",
      platform: "Reddit",
      subreddit: "r/startups",
      title: "I stopped using keyword tools and started reading Reddit threads. Here's what changed.",
      reason: "Pain-point framing resonates in r/startups, validated by 3 similar high-engagement posts.",
      tone: "Personal story angle. Open with a mistake, close with the lesson.",
    },
    {
      id: "post_03",
      platform: "Reddit",
      subreddit: "r/SEO",
      title: "The gap between keyword volume and buyer intent — and how Reddit threads fill it",
      reason: "Directly addresses a top pain point in audience map.",
      tone: "Educational tone. Use examples from real threads (anonymized).",
    },
  ],
  suggestedComments: [
    {
      id: "comment_01",
      platform: "Reddit",
      target: "r/SaaS — 'How do you actually validate a SaaS idea before wasting months building?'",
      suggestion: "Share a 3-step validation loop. Mention community signals without linking.",
      url: "https://www.reddit.com/r/SaaS/comments/mock03",
    },
    {
      id: "comment_02",
      platform: "Reddit",
      target: "r/SEO — 'Anyone using Reddit to find SEO content ideas that actually convert?'",
      suggestion: "Give one concrete example of turning a thread into a content piece.",
      url: "https://www.reddit.com/r/SEO/comments/mock04",
    },
    {
      id: "comment_03",
      platform: "Reddit",
      target: "r/marketing — 'What's the best way to find people who need your product RIGHT NOW?'",
      suggestion: "Agree with the pain, share a community-first approach framework.",
      url: "https://www.reddit.com/r/marketing/comments/mock05",
    },
  ],
  leads: [
    {
      id: "lead_01",
      name: "bootstrap_ops",
      platform: "Reddit",
      signal: "Asked how to validate SaaS idea with real user pain",
      engagement: 286,
      status: "new",
      url: "https://www.reddit.com/user/bootstrap_ops",
      threadUrl: "https://www.reddit.com/r/SaaS/comments/mock03",
      avatar: null,
    },
    {
      id: "lead_02",
      name: "contentpilot",
      platform: "Reddit",
      signal: "Looking for repeatable Reddit-to-content workflow",
      engagement: 244,
      status: "new",
      url: "https://www.reddit.com/user/contentpilot",
      threadUrl: "https://www.reddit.com/r/SEO/comments/mock04",
      avatar: null,
    },
    {
      id: "lead_03",
      name: "growth_ops_23",
      platform: "Reddit",
      signal: "Asking where to find people who need your product right now",
      engagement: 198,
      status: "replied",
      url: "https://www.reddit.com/user/growth_ops_23",
      threadUrl: "https://www.reddit.com/r/marketing/comments/mock05",
      avatar: null,
    },
    {
      id: "lead_04",
      name: "serial_builder",
      platform: "Reddit",
      signal: "Posted retrospective about SaaS marketing failures, looking for tools",
      engagement: 312,
      status: "new",
      url: "https://www.reddit.com/user/serial_builder",
      threadUrl: "https://www.reddit.com/r/startups/comments/feed03",
      avatar: null,
    },
    {
      id: "lead_05",
      name: "new_saas_guy",
      platform: "Reddit",
      signal: "Asking about tools for finding first 10 customers",
      engagement: 142,
      status: "watching",
      url: "https://www.reddit.com/user/new_saas_guy",
      threadUrl: "https://www.reddit.com/r/SaaS/comments/feed01",
      avatar: null,
    },
  ],
  devDirections: [
    {
      id: "dev_01",
      direction: "Reddit 帖子自动抓取 + 痛点提取",
      evidence: "28 条 hot topic 来自手动 Reddit 搜索，用户反复提到 'stitching together tools by hand'",
      priority: "high",
      effort: "medium",
    },
    {
      id: "dev_02",
      direction: "意向用户自动标记 & 跟进提醒",
      evidence: "19 个意向客户目前需要手动追踪，容易遗漏高分线索",
      priority: "high",
      effort: "low",
    },
    {
      id: "dev_03",
      direction: "AI 生成评论草稿（基于帖子上下文）",
      evidence: "每日建议评论 3-5 条，手写回复耗时，模板化可提效 3x",
      priority: "medium",
      effort: "medium",
    },
    {
      id: "dev_04",
      direction: "Subreddit 智能推荐 + 新社区发现",
      evidence: "用户经常问 '还有哪些相关 subreddit'，自动发现关联社区可扩大监控范围",
      priority: "medium",
      effort: "medium",
    },
  ],
  feed: [
    {
      id: "feed_01",
      platform: "Reddit",
      subreddit: "r/SaaS",
      title: "What tools do you use for finding your first 10 customers?",
      summary: "Founder asking about early traction tools, several replies mention manual Reddit scraping.",
      url: "https://www.reddit.com/r/SaaS/comments/feed01",
      author: "new_saas_guy",
      authorUrl: "https://www.reddit.com/user/new_saas_guy",
      engagement: 142,
      postedAt: "2026-05-10T14:20:00Z",
      relevance: 94,
    },
    {
      id: "feed_02",
      platform: "Reddit",
      subreddit: "r/startups",
      title: "I built 3 SaaS products and failed at marketing all of them. Here's what I learned.",
      summary: "Retrospective post mentioning the gap between building and finding the right people to sell to.",
      url: "https://www.reddit.com/r/startups/comments/feed03",
      author: "serial_builder",
      authorUrl: "https://www.reddit.com/user/serial_builder",
      engagement: 312,
      postedAt: "2026-05-10T10:30:00Z",
      relevance: 91,
    },
    {
      id: "feed_03",
      platform: "Reddit",
      subreddit: "r/marketing",
      title: "What's the best way to find people who need your product RIGHT NOW?",
      summary: "Highly relevant demand-signal thread. Top answers mention Reddit search and community lurking.",
      url: "https://www.reddit.com/r/marketing/comments/feed05",
      author: "growth_ops_23",
      authorUrl: "https://www.reddit.com/user/growth_ops_23",
      engagement: 198,
      postedAt: "2026-05-09T22:00:00Z",
      relevance: 96,
    },
    {
      id: "feed_04",
      platform: "Reddit",
      subreddit: "r/SEO",
      title: "Most keyword tools are solving a 2015 problem. The real signal is in conversations.",
      summary: "Thread getting traction from growth operators, 4 replies mention wanting conversation-first tools.",
      url: "https://www.reddit.com/r/SEO/comments/feed04",
      author: "seo_realist",
      authorUrl: "https://www.reddit.com/user/seo_realist",
      engagement: 89,
      postedAt: "2026-05-09T18:45:00Z",
      relevance: 88,
    },
    {
      id: "feed_05",
      platform: "Reddit",
      subreddit: "r/indiehackers",
      title: "How I found my first 5 paying customers by lurking Reddit for 2 weeks",
      summary: "Detailed playbook of using Reddit for customer discovery. Exact subreddits and approach shared.",
      url: "https://www.reddit.com/r/indiehackers/comments/feed05",
      author: "lurker_to_founder",
      authorUrl: "https://www.reddit.com/user/lurker_to_founder",
      engagement: 267,
      postedAt: "2026-05-09T15:30:00Z",
      relevance: 93,
    },
  ],
}

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 700))

  return NextResponse.json({
    success: true,
    data: mockMonitorData,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  await new Promise((resolve) => setTimeout(resolve, 1600))

  return NextResponse.json({
    success: true,
    data: {
      ...mockMonitorData,
      product: body,
      message: "Monitor created successfully",
    },
  })
}
