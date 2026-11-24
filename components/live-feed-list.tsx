"use client"

import { useState, useEffect, useRef } from "react"
import { KeywordDetailDialog } from "@/components/keyword-detail-dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { keywordService } from "@/lib/api/services/keyword.service"
import type { Keyword } from "@/lib/types"
import { calculateOpportunityScore, formatNumber, formatCurrency, formatPercentage } from "@/lib/utils/keyword-metrics"
import { TrendingUp, TrendingDown, Minus, DollarSign, Search, Target, Sparkles, Unlock } from "lucide-react"
import { UnlockKeywordDialog } from "@/components/unlock-keyword-dialog"
import { cn } from "@/lib/utils"
import { useAccount } from "@/hooks/use-account"
import LoginDialog from "@/components/LoginDialog"

interface LiveFeedListProps {
  sortBy?: string
  filterBy?: string
}

// Mock data for demonstration
const mockKeywords: Keyword[] = [
  {
    id: -1,
    keyword: "AI productivity tools",
    search_volume: 45000,
    cpc: 3.2,
    competition_score: 65,
    competition_level: "medium",
    growth_rate: 15.5,
    profit_estimation: 125000,
    is_locked: false,
    free: true,
  },
  {
    id: -2,
    keyword: "remote work software",
    search_volume: 82000,
    cpc: 4.5,
    competition_score: 78,
    competition_level: "high",
    growth_rate: 22.3,
    profit_estimation: 280000,
    is_locked: false,
    free: true,
  },
  {
    id: -3,
    keyword: "sustainable fashion brands",
    search_volume: 33000,
    cpc: 2.1,
    competition_score: 45,
    competition_level: "medium",
    growth_rate: 18.7,
    profit_estimation: 95000,
    is_locked: false,
    free: true,
  },
  {
    id: -4,
    keyword: "crypto trading platform",
    search_volume: 125000,
    cpc: 8.9,
    competition_score: 92,
    competition_level: "high",
    growth_rate: 35.2,
    profit_estimation: 650000,
    is_locked: false,
    free: true,
  },
  {
    id: -5,
    keyword: "meal prep delivery",
    search_volume: 67000,
    cpc: 5.3,
    competition_score: 71,
    competition_level: "high",
    growth_rate: 12.8,
    profit_estimation: 220000,
    is_locked: false,
    free: true,
  },
] as Keyword[]

// 模块级缓存 - 在组件外部，页面切换时数据仍然保留
let cachedLiveFeedKeywords: Keyword[] | null = null
let liveFeedCacheTimestamp: number | null = null
const LIVE_FEED_CACHE_DURATION = 30 * 1000 // 30秒缓存（live feed 刷新更频繁）

export function LiveFeedList({ sortBy = "trending", filterBy = "all" }: LiveFeedListProps) {
  const { isAuthenticated, usage, refresh } = useAccount()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [newKeywordIds, setNewKeywordIds] = useState<Set<number>>(new Set())
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [keywordToUnlock, setKeywordToUnlock] = useState<Keyword | null>(null)
  const previousKeywordsRef = useRef<Set<number>>(new Set())
  const isFirstLoadRef = useRef(true)

  useEffect(() => {
    let ignore = false

    // 处理关键词数据的函数
    function processKeywords(data: Keyword[]) {
      let finalData: Keyword[] = []

      if (data && data.length > 0) {
        finalData = [...data]
      }

      // Only add mock data if we have less than 5 items
      const MIN_ITEMS = 5
      if (finalData.length < MIN_ITEMS) {
        const itemsNeeded = MIN_ITEMS - finalData.length
        for (let i = 0; i < itemsNeeded; i++) {
          const mockItem = mockKeywords[i % mockKeywords.length]
          finalData.push({
            ...mockItem,
            id: -(finalData.length + i + 1),
            keyword: `${mockItem.keyword} ${i + 1}`,
          })
        }
      }

      // 直接使用后端返回的顺序，不进行排序
      const sortedData = [...finalData]

      // Detect new keywords (skip on first load to avoid green flash)
      const currentIds = new Set(sortedData.map(k => k.id))
      const newIds = new Set<number>()

      if (!isFirstLoadRef.current) {
        sortedData.forEach(keyword => {
          if (!previousKeywordsRef.current.has(keyword.id)) {
            newIds.add(keyword.id)
          }
        })

        if (newIds.size > 0) {
          setNewKeywordIds(newIds)
          setTimeout(() => {
            setNewKeywordIds(new Set())
          }, 3000)
        }
      } else {
        isFirstLoadRef.current = false
      }

      previousKeywordsRef.current = currentIds
      setKeywords(sortedData)
    }

    async function fetchKeywords() {
      // 检查缓存是否有效
      const now = Date.now()
      if (cachedLiveFeedKeywords && liveFeedCacheTimestamp && (now - liveFeedCacheTimestamp < LIVE_FEED_CACHE_DURATION)) {
        // 使用缓存，不发起请求
        console.log('✅ Using cached live feed data')
        processKeywords(cachedLiveFeedKeywords)
        setLoading(false) // 重要：使用缓存时也要设置 loading 为 false
        return
      }

      setLoading(true)

      try {
        const response = await keywordService.getList({
          limit: 10,
          offset: 0,
        })

        if (ignore) return

        // 更新缓存 - 使用 response.items
        if (response && response.items && response.items.length > 0) {
          cachedLiveFeedKeywords = response.items
          liveFeedCacheTimestamp = Date.now()
        }

        processKeywords(response?.items || [])
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch keywords:', error)
          setKeywords(mockKeywords)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    // 首次加载时获取数据（可能使用缓存）
    fetchKeywords()

    // 每30秒自动刷新（会发起真实请求更新缓存）
    const interval = setInterval(() => {
      // 定时器触发时强制刷新，清除缓存
      liveFeedCacheTimestamp = null
      fetchKeywords()
    }, 30 * 1000)

    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [sortBy, filterBy])

  const handleKeywordClick = (keyword: Keyword, index: number) => {
    // Check if keyword is locked based on backend data
    if (keyword.is_locked) {
      setKeywordToUnlock(keyword)
      setShowUnlockDialog(true)
      return
    }

    // Don't open detail dialog for mock data (negative IDs)
    if (keyword.id < 0) {
      console.warn('Cannot view details for mock data')
      return
    }

    // Open detail dialog for unlocked keywords
    setSelectedKeywordId(keyword.id)
    setShowDetail(true)
  }

  const handleUnlockKeyword = async () => {
    if (!keywordToUnlock) return

    try {
      // Call unlock API - backend will deduct 1 credit and record unlock
      const response = await keywordService.unlock(keywordToUnlock.id)

      // Refresh user data to update credits
      await refresh()

      // Update the keyword in the list with the unlocked data
      setKeywords(prev => prev.map(kw =>
        kw.id === keywordToUnlock.id
          ? {
              ...kw,
              keyword: response.keyword.keyword, // Update with real keyword name
              is_locked: false,
              growth_rate: response.keyword.growth_rate,
              competition_score: response.keyword.competition_score,
              profit_estimation: response.keyword.profit_estimation,
            }
          : kw
      ))

      // Clear cache to force refresh on next load
      cachedLiveFeedKeywords = null
      liveFeedCacheTimestamp = null

      // Close unlock dialog
      setShowUnlockDialog(false)
      setKeywordToUnlock(null)

      // Note: User needs to click again to view details
      // This allows them to see the unlock was successful first
    } catch (error) {
      console.error('Failed to unlock keyword:', error)
      throw error
    }
  }

  const getTrendIcon = (growthRate: number | null | undefined) => {
    if (!growthRate) return Minus
    if (growthRate > 0) return TrendingUp
    if (growthRate < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = (growthRate: number | null | undefined) => {
    if (!growthRate) return "text-gray-600"
    if (growthRate > 0) return "text-green-600"
    if (growthRate < 0) return "text-red-600"
    return "text-gray-600"
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 relative">
        {keywords.slice(0, 10).map((keyword, index) => {
          const opportunityScore = calculateOpportunityScore(
            keyword.profit_estimation ?? null,
            keyword.growth_rate ?? null,
            keyword.competition_score ?? null
          )
          const TrendIcon = getTrendIcon(keyword.growth_rate ?? null)
          const trendColor = getTrendColor(keyword.growth_rate ?? null)
          const isNew = newKeywordIds.has(keyword.id)

          // Determine if item should be locked/blurred
          // Use backend's is_locked field to determine if keyword should be blurred
          const shouldBlur = keyword.is_locked === true
          const isUnauthenticatedLock = !isAuthenticated && shouldBlur

          return (
            <div key={keyword.id} className="relative">
              <Card
                className={cn(
                  "p-4 transition-all duration-500 cursor-pointer border-border/50",
                  shouldBlur ? "hover:shadow-md hover:border-indigo-500/30" : "hover:shadow-md hover:border-indigo-500/50",
                  isNew && "animate-in slide-in-from-top-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                )}
                onClick={() => handleKeywordClick(keyword, index)}
              >
                {/* Show highlight and unlock button for locked keywords (free users or unauthenticated) */}
                {shouldBlur && (
                  <div className="mb-3 space-y-2">
                    {keyword.highlight && (
                      <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                            {keyword.highlight.highlight_text}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-indigo-300 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-950/30 cursor-pointer h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isUnauthenticatedLock) {
                          // If user is not authenticated, show login dialog directly
                          setShowLoginDialog(true)
                        } else {
                          // If user is authenticated, show unlock dialog
                          setKeywordToUnlock(keyword)
                          setShowUnlockDialog(true)
                        }
                      }}
                    >
                      <Unlock className="h-3 w-3 mr-1.5" />
                      {isUnauthenticatedLock ? 'Sign in' : 'Unlock (1 Credit)'}
                    </Button>
                  </div>
                )}

                <div className={cn(
                  "flex items-center justify-between gap-4",
                  shouldBlur && "blur-md select-none pointer-events-none"
                )}>
                  {/* Left: Keyword Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {isNew && (
                        <Badge className="bg-emerald-500 text-white text-xs animate-pulse">
                          NEW
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {keyword.keyword}
                      </h3>
                      <Badge
                        variant={keyword.competition_level === 'high' ? 'destructive' : keyword.competition_level === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {keyword.competition_level?.toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Search className="h-4 w-4" />
                        <span>{formatNumber(keyword.search_volume ?? 0)} searches</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" />
                        <span>${(keyword.cpc ?? 0).toFixed(2)} CPC</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", trendColor)}>
                        <TrendIcon className="h-4 w-4" />
                        <span>{formatPercentage(keyword.growth_rate ?? 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Opportunity Score</div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-600" />
                        <span className="text-xl font-bold font-mono text-indigo-600">
                          {formatNumber(opportunityScore)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Profit Est.</div>
                      <div className="text-lg font-semibold font-mono text-green-600">
                        {formatCurrency(keyword.profit_estimation ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>

      <KeywordDetailDialog
        keywordId={selectedKeywordId}
        open={showDetail}
        onOpenChange={setShowDetail}
      />

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />

      <UnlockKeywordDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        keywordName={keywordToUnlock?.keyword || ''}
        userCredits={usage?.credits.balance ?? 0}
        onConfirm={handleUnlockKeyword}
        isUnauthenticated={!isAuthenticated}
        onLoginRequired={() => setShowLoginDialog(true)}
      />
    </>
  )
}
