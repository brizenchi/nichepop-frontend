export interface IdeaSource {
  platform: string
  count: number
  url: string
}

export interface Idea {
  id: string
  title: string
  description: string
  industry: string
  tags: string[]
  heatScore: number
  sources: IdeaSource[]
  createdAt: string
}

export interface IdeasResponse {
  ideas: Idea[]
  total: number
  updatedAt: string
}

export interface ValidationDimension {
  name: string
  score: number
  description: string
  sources: string[]
}

export interface PainPoint {
  text: string
  source: string
  url: string
}

export interface Competitor {
  name: string
  description: string
  strengths: string
  weaknesses: string
}

export interface ValidationReport {
  id: string
  ideaInput: string
  overallScore: number
  generatedAt: string
  dimensions: ValidationDimension[]
  painPoints: PainPoint[]
  competitors: Competitor[]
}

export interface MonitorStats {
  impressions: number
  mentionPosts: number
  mentionComments: number
  todayTasks: number
  potentialUsers: number
}

export interface PlatformTrend {
  name: string
  impressions: number
  growth: number
}

export interface SuggestedPost {
  id: string
  platform: string
  subreddit: string | null
  title: string
  reason: string
  tone: string
}

export interface SuggestedComment {
  id: string
  platform: string
  target: string
  suggestion: string
  url: string
}

export interface Lead {
  id: string
  name: string
  platform: string
  signal: string
  engagement: number
  status: string
  url: string
  threadUrl: string
  avatar: string | null
}

export interface DevDirection {
  id: string
  direction: string
  evidence: string
  priority: string
  effort: string
}

export interface FeedItem {
  id: string
  platform: string
  subreddit: string | null
  title: string
  summary: string
  url: string
  author: string
  authorUrl: string
  engagement: number
  postedAt: string
  relevance: number
}

export interface MonitorData {
  stats: MonitorStats
  trends: {
    impressionsGrowth: number
    mentionsGrowth: number
    platforms: PlatformTrend[]
  }
  suggestedPosts: SuggestedPost[]
  suggestedComments: SuggestedComment[]
  leads: Lead[]
  devDirections: DevDirection[]
  feed: FeedItem[]
}

class DashboardService {
  private baseUrl = ''

  private getBaseUrl() {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return this.baseUrl
  }

  async getIdeas(): Promise<IdeasResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/ideas`)
    const json = await res.json()
    if (!json.success) throw new Error('Failed to fetch ideas')
    return json.data
  }

  async validateIdea(idea: string): Promise<ValidationReport> {
    const res = await fetch(`${this.getBaseUrl()}/api/ideas/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    })
    const json = await res.json()
    if (!json.success) throw new Error('Failed to validate idea')
    return json.data
  }

  async getMonitorData(): Promise<MonitorData> {
    const res = await fetch(`${this.getBaseUrl()}/api/monitor`)
    const json = await res.json()
    if (!json.success) throw new Error('Failed to fetch monitor data')
    return json.data
  }

  async createMonitor(product: { name: string; url: string; description: string }): Promise<MonitorData> {
    const res = await fetch(`${this.getBaseUrl()}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })
    const json = await res.json()
    if (!json.success) throw new Error('Failed to create monitor')
    return json.data
  }
}

export const dashboardService = new DashboardService()
