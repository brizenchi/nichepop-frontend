export interface PainPoint {
  title: string
  description: string
}

export interface MvpSuggestion {
  title: string
  description: string
  target: string
}

// ==================== Keyword 相关类型 ====================

/**
 * 关键词竞争等级
 */
export type CompetitionLevel = 'low' | 'medium' | 'high';

/**
 * 关键词状态
 */
export type KeywordStatus = 'pending' | 'processing' | 'succeed' | 'failed';

/**
 * 月度搜索数据
 */
export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

/**
 * 搜索量趋势
 */
export interface SearchVolumeTrend {
  monthly: number | null;
  quarterly: number | null;
  yearly: number | null;
}

/**
 * 反向链接信息
 */
export interface BacklinksInfo {
  se_type: string;
  backlinks: number | null;
  dofollow: number | null;
  referring_pages: number | null;
  referring_domains: number | null;
  referring_main_domains: number | null;
  rank: number | null;
  main_domain_rank: number | null;
  last_updated_time: string;
}

/**
 * 竞争对手信息
 */
export interface Competitor {
  se_type: string;
  domain: string;
  avg_position: number | null;
  median_position: number | null;
  rating: number | null;
  etv: number | null;
  keywords_count: number | null;
  visibility: number | null;
  relevant_serp_items: number | null;
  keywords_positions: Record<string, number[]>;
}

/**
 * 搜索意图信息
 */
export interface SearchIntentInfo {
  se_type: string;
  main_intent: string;
  foreign_intent: string | null;
  last_updated_time: string;
}

/**
 * SERP信息
 */
export interface SerpInfo {
  se_type: string;
  check_url: string;
  se_results_count: number;
  serp_item_types: string[];
  last_updated_time: string;
  previous_updated_time: string;
}

/**
 * Highlight 信息（用于 free 用户的 locked 数据）
 */
export interface KeywordHighlight {
  highlight_type: 'growth' | 'volume' | 'competition' | 'cpc' | 'default';
  highlight_text: string;
  highlight_value: number | null;
}

/**
 * 解锁关键词响应
 */
export interface UnlockKeywordResponse {
  success: boolean;
  message: string;
  keyword: {
    id: number;
    task_id: number;
    keyword: string;
    growth_rate: number | null;
    competition_score: number | null;
    profit_estimation: number | null;
    is_locked: boolean;
    is_unlocked: boolean;
  };
  credits_used: number;
  remaining_credits: number;
}

/**
 * 关键词数据（从后端列表返回）
 */
export interface Keyword {
  id: number;
  task_id?: number | null;
  keyword: string;
  search_volume?: number | null;
  cpc?: number | null;
  growth_rate: number | null;
  competition_level: CompetitionLevel | null;
  competition_score?: number | null;
  profit_estimation: number | null;
  opportunity_score?: number | null; // 机会分数（从后端返回）
  search_intent_info?: SearchIntentInfo;
  is_locked: boolean;
  is_unlocked?: boolean;
  free: boolean;
  highlight?: KeywordHighlight;
  category?: string; // 关键词分类
  source?: string; // 数据来源（reddit, google等）
  intent?: string; // 用户搜索意图描述
}

/**
 * 竞争对手详细信息（Google Trends）
 */
export interface CompetitorDetail {
  position: number;
  title: string;
  url: string;
  domain: string;
  description: string;
}

/**
 * 关键词详情数据（从详情接口返回）
 */
export interface KeywordDetailData extends Keyword {
  source_type: string;
  se_type: string | null;
  status: string;
  endpoint: string;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  categories: number[] | null;
  monthly_searches: MonthlySearch[] | null;
  search_volume_trend: SearchVolumeTrend | null;
  avg_backlinks_info: BacklinksInfo | null;
  competitors: Competitor[] | CompetitorDetail[];
  competition_level: CompetitionLevel | null;
  search_intent_info?: SearchIntentInfo;
  top_domains: string[]; // Top ranking domains
  serp_info?: SerpInfo; // SERP information (需要从 response_result 中提取)
  created_at: string;
  updated_at: string;

  // Google Trends 特有字段
  intent?: string; // 用户搜索意图描述
  target_market?: string; // 目标市场
  time_to_mvp?: string; // MVP 开发时间
  user_target?: string; // 目标用户类型
  opportunity_score?: number; // 机会分数
  reddit_posts?: any; // Reddit 讨论数据
  commercialization_strategy?: string; // 商业化策略
  risk_assessment?: string; // 风险评估
  category?: string; // 关键词分类
  source?: string; // 数据来源
}

/**
 * 关键词列表请求参数
 */
export interface KeywordListParams {
  limit?: number;
  offset?: number;
  keyword_status?: KeywordStatus;
  search?: string;
  field?: string;
  category?: string;
  competition_level?: CompetitionLevel;
  sort_by?: 'created_at' | 'opportunity_score';
  sort_order?: 'asc' | 'desc';
  mrr_min?: number;
  mrr_max?: number;
  is_new?: boolean;
}

/**
 * 关键词列表响应数据
 */
export interface KeywordListData {
  items: Keyword[];
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
}

/**
 * 关键词列表响应
 */
export interface KeywordListResponse {
  code: number;
  message: string;
  data: KeywordListData;
}

// 旧的类型定义（向后兼容，后续可以逐步迁移）
export interface LegacyKeyword {
  keyword: string;
  growth: number;
  source: string;
}

export interface KeywordDetail extends LegacyKeyword {
  trendData: TrendDataPoint[];
  painPoints: PainPoint[];
  mvpSuggestion: MvpSuggestion;
}

export interface TrendDataPoint {
  day: string
  value: number
}

export interface ApiResponse<T> {
  data: T
  total?: number
  query?: string | null
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface User {
  id: number
  email: string
  username: string
  avatar_url: string | null
  phone?: string | null
  membership_level: 'free' | 'pro' | 'premium'
  membership_expires_at: string | null
  referral_code: string | null
  credits: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface GoogleAuthUrlResponse {
  auth_url: string
}

export interface SendCodeRequest {
  email: string
}

export interface SendCodeResponse {
  message: string
  success: boolean
}

export interface EmailLoginRequest {
  email: string
  code: string
}

export interface EmailLoginResponse {
  token: string
  user: User
}

/**
 * Radar（新词雷达 + AI 报告）相关类型
 */
export type RadarSignalSource = 'community' | 'google_trends' | 'serp' | 'competitor' | 'search_console' | 'keyword' | 'x'

export type RadarVerdict = 'build' | 'content' | 'skip'

export type RadarConfidence = 'high' | 'medium' | 'low'

/** Opportunity score parts: momentum /25, durability /25, rankability /35, value /15. */
export interface RadarScoreParts {
  momentum: number
  durability: number
  rankability: number
  value: number
}

export interface RadarWord {
  id: string
  keyword: string
  score: number
  scoreDelta: number
  scoreParts: RadarScoreParts
  confidence: RadarConfidence
  root: string
  category: string
  firstSeenHoursAgo: number
  growthPct: number
  growthWindow: '24h' | '48h' | '72h' | '7d' | '30d'
  trend: number[]
  volume: number
  kd: number
  kgr: number
  sitesThen: number
  sitesNow: number
  intents: string[]
  verdict: RadarVerdict
  reason: string
}

export interface RadarWatchlist {
  roots: string[]
  sites: string[]
  delivery: {
    email: string
    realtimeAlerts: boolean
  }
}

export type RadarActionType = 'rising_topic' | 'competitor_gap' | 'quick_win'

export interface RadarSignal {
  source: RadarSignalSource
  value: string
}

export interface RadarBrief {
  workingTitle: string
  targetKeyword: string
  secondaryKeywords: string[]
  outline: string[]
}

export interface RadarAction {
  id: string
  type: RadarActionType
  title: string
  summary: string
  score: number
  window: string
  effort: string
  upside: string
  signals: RadarSignal[]
  brief: RadarBrief
}

export interface RadarCompetitorMove {
  domain: string
  change: string
  impact: string
  direction: 'up' | 'down'
  /** Monitors only (backend #24): what the competitor did; `pages` are new pages found in its sitemap. */
  what?: 'pages' | 'pricing' | 'ranking'
  /** The new pages (`pages`). */
  urls?: string[]
  /** The page behind the move, e.g. the pricing page. */
  url?: string
  /** When the move was found (ISO time). */
  at?: string
}

export interface ReportScore {
  label: string
  value: string
  note: string
  tone: 'good' | 'warn' | 'bad'
}

/**
 * Data sources the agent can call. Labels live in the dictionaries under tools. The backend's
 * tools map onto these (GET /agent/platform/pricing, `ask_tool`); google_suggest is Google autocomplete.
 */
export type AskTool = 'nichepop' | 'dfs_labs' | 'dfs_serp' | 'dfs_keywords' | 'dfs_trends' | 'dfs_content' | 'x' | 'community' | 'web' | 'gsc' | 'ai' | 'google_suggest'

/** One data call behind a report, shown as its evidence. */
export interface ReportSource {
  tool: AskTool
  calls: number
}

/** What a report judges: a trending keyword, an idea, an existing product, or a whole market. */
export type ReportKind = 'keyword' | 'idea' | 'product' | 'market'

/** Where a post was found: monitors (backend #23) and reports (backend docs/agent-tools.md). Wording for readers is frontend#17's. */
export type MentionSource = 'x' | 'hn' | 'bluesky' | 'youtube' | 'web' | 'reddit' | 'tiktok'

/**
 * What a post is about, GummySearch-style themes. People asking for a recommendation or an
 * alternative are high intent and pushed in real time.
 */
export type MentionIntent = 'pain' | 'recommendation' | 'advice' | 'money' | 'alternatives' | 'launch'

export interface Mention {
  id: string
  source: MentionSource
  author: string
  text: string
  /** null when the source gave no date. */
  hoursAgo: number | null
  intent: MentionIntent
  engagement: string
  replyDraft?: string
  /** Chinese readers get a translation of English posts. */
  translation?: string
  /** Monitors only: the original post. */
  url?: string
}

export interface ReportSerpRow {
  rank: number
  domain: string
  pageType: string
  note: string
}

export interface KeywordReport {
  id: string
  kind: 'keyword'
  query: string
  /** RFC 3339 from the API; demo reports carry a display date. */
  createdAt: string
  /** How long NichePop has seen the word; null until the opportunity library knows it (backend #16). */
  wordAgeHours: number | null
  verdict: RadarVerdict
  headline: string
  scores: ReportScore[]
  roi: string
  traps: string[]
  serp: ReportSerpRow[]
  nextSteps: string[]
  /** Tool behind each score card, same order as scores. */
  scoreSources?: AskTool[]
  sources?: ReportSource[]
}

export interface CompetitorRow {
  domain: string
  traffic: string
  trend: 'up' | 'down' | 'flat'
  pricing: string
  overlap: string
  note: string
}

/** Missing figures are null and show as unknown. */
export interface KeywordGap {
  keyword: string
  volume: number | null
  kd: number | null
  owner: string
  note: string
}

export interface DiscussionChannel {
  source: MentionSource
  label: string
  volume: string
  note: string
}

/** "Is this idea worth building?" — ends in a go / pivot / no-go call. */
export interface IdeaReport {
  id: string
  kind: 'idea'
  query: string
  createdAt: string
  verdict: 'go' | 'pivot' | 'no'
  headline: string
  demand: ReportScore[]
  alternatives: CompetitorRow[]
  complaints: { text: string; source: string; count: string }[]
  monetization: string[]
  angle: string
  sources?: ReportSource[]
}

/** Where an existing product stands: traffic, competitors, what people say, what to do next. */
export interface ProductReport {
  id: string
  kind: 'product'
  query: string
  createdAt: string
  headline: string
  ownerMetrics: { label: string; value: string; delta: string }[]
  competitors: CompetitorRow[]
  gaps: KeywordGap[]
  channels: DiscussionChannel[]
  mentions: Mention[]
  actions: RadarAction[]
  sources?: ReportSource[]
}

/** A map of a market: momentum, who leads, what's rising, where the openings are. */
export interface MarketReport {
  id: string
  kind: 'market'
  query: string
  createdAt: string
  headline: string
  metrics: { label: string; value: string; note: string }[]
  /** Interest over time, oldest first; null for a missing point. */
  trend: (number | null)[]
  players: CompetitorRow[]
  rising: { keyword: string; growth: string; volume: number | null; kd: number | null }[]
  openings: string[]
  sources?: ReportSource[]
}

export type RadarReport = KeywordReport | IdeaReport | ProductReport | MarketReport

/**
 * Monitors: keep watch on a word you're building on, or on your own product.
 */
export type MonitorKind = 'keyword' | 'product' | 'market'

export type MonitorTrack = 'mentions' | 'competitors' | 'rankings' | 'trends'

export interface Monitor {
  id: string
  kind: MonitorKind
  /** The keyword, the product's domain, or the market's name. */
  name: string
  /** Product and market monitors: one line describing it, used to find discussions. */
  description: string
  /** Site whose rankings are tracked. */
  site: string
  xQuery: string
  competitors: string[]
  rankKeywords: string[]
  tracks: MonitorTrack[]
  delivery: 'realtime' | 'digest'
  /** Where pushes go: email plus optional webhooks (Telegram, Discord, Slack, Feishu). */
  channels?: string[]
  webhook?: string
  createdAt: number
  /** Saved monitors only: paused ones are not checked (over the plan's limit, or paused by the user). */
  status?: 'active' | 'paused'
  /** Saved monitors only: when the last check finished. */
  lastCheckedAt?: number
  /** Saved monitors only: when the next check is due (paused monitors have none). */
  nextCheckAt?: number
  /** Saved monitors only: how often it is checked, in seconds (follows the plan). */
  checkEverySeconds?: number
  /** Saved monitors only: how the latest check went; null before the first one. */
  lastCheck?: MonitorCheck | null
  /** Saved monitors only: alerts that could not be sent in the last 7 days, with the latest reason. */
  pushFailures?: number
  lastPushError?: string
  /** Seeded examples that come with demo data. */
  demo?: boolean
}

/** A saved monitor's latest check (backend `last_check`). */
export interface MonitorCheck {
  ok: boolean
  finishedAt?: number
  /** Failed checks in a row, the latest included; 0 when the latest one worked. */
  failures: number
  error?: string
  /** Data the latest check could not fetch, though the check itself may have worked. */
  failedFetches: number
  /** `x_quota_exhausted`, `daily_limit:<source>`. */
  notices: string[]
}

export interface MonitorRanking {
  keyword: string
  position: number | null
  change: number
  volume: number
  trend: number[]
  /** Monitors only: how deep the results were read (10 or 100), so `position: null` means "not in the top N". */
  depth?: number
}

export interface MonitorTrend {
  topic: string
  growth: string
  note: string
}

export interface MonitorFeed {
  lastCheckedMinutes: number
  /** Saved monitors only: when the last check finished (ISO time). */
  lastCheckedAt?: string
  postsToday: number
  postsThisMonth: number
  mentions: Mention[]
  competitorMoves: RadarCompetitorMove[]
  rankings: MonitorRanking[]
  trends: MonitorTrend[]
  suggestions: RadarAction[]
  /** One-line AI summary per theme: the pattern across this week's posts. */
  themes?: Partial<Record<MentionIntent, string>>
}
