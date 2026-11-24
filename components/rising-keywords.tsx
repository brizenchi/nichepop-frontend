"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Unlock, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react"
import { UnlockKeywordDialog } from "@/components/unlock-keyword-dialog"
import { KeywordCard } from "@/components/keyword-card"
import { PricingModal } from "@/components/pricing-modal"
import { KeywordDetailDialog } from "@/components/keyword-detail-dialog"
import LoginDialog from "@/components/LoginDialog"
import { Button } from "@/components/ui/button"
import { keywordDetails } from "@/lib/data"
import { keywordService } from "@/lib/api/services/keyword.service"
import type { Keyword, KeywordListParams, CompetitionLevel } from "@/lib/types"
import { useAccount } from "@/hooks/use-account"

interface RisingKeywordsProps {
  showResults?: boolean
}

// Helper to generate trend data from backend keyword
const generateTrendDataFromKeyword = (kw: Keyword) => {
  const data = []
  const growth = (kw.growth_rate ?? 0) * 10
  let currentValue = 20
  for (let i = 1; i <= 30; i++) {
    const change = (Math.random() - 0.2) * (growth / 50)
    currentValue = Math.max(10, currentValue + change)
    data.push({ day: `${i}`, value: Math.round(currentValue) })
  }
  return data
}

// 模块级缓存 - 按参数组合缓存
const pageCache = new Map<string, { data: Keyword[], total: number, totalPages: number, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000
const PAGE_SIZE = 8

// Filter options
const FIELD_OPTIONS = [
  { value: "", label: "All Fields" },
  { value: "openclaw", label: "OpenClaw" },
]

const COMPETITION_OPTIONS = [
  { value: "", label: "All Competition" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Latest" },
  { value: "opportunity_score", label: "Score" },
]

const MRR_OPTIONS = [
  { value: "", label: "All MRR" },
  { value: "0-1000", label: "$0 - $1K" },
  { value: "1000-5000", label: "$1K - $5K" },
  { value: "5000-20000", label: "$5K - $20K" },
  { value: "20000-", label: "$20K+" },
]

interface FilterState {
  field: string
  category: string
  competition_level: string
  sort_by: string
  sort_order: string
  mrr: string
  is_new: boolean | null
}

const defaultFilters: FilterState = {
  field: "",
  category: "",
  competition_level: "",
  sort_by: "created_at",
  sort_order: "desc",
  mrr: "",
  is_new: null,
}

function buildCacheKey(page: number, filters: FilterState): string {
  return JSON.stringify({ page, ...filters })
}

function buildApiParams(page: number, filters: FilterState): KeywordListParams {
  const offset = (page - 1) * PAGE_SIZE

  const params: KeywordListParams = {
    limit: PAGE_SIZE,
    offset,
    sort_by: filters.sort_by as KeywordListParams["sort_by"],
    sort_order: filters.sort_order as KeywordListParams["sort_order"],
  }

  if (filters.field) params.field = filters.field
  if (filters.category) params.category = filters.category
  if (filters.competition_level) params.competition_level = filters.competition_level as CompetitionLevel
  if (filters.is_new !== null) params.is_new = filters.is_new

  if (filters.mrr) {
    const [min, max] = filters.mrr.split("-")
    if (min) params.mrr_min = Number(min)
    if (max) params.mrr_max = Number(max)
  }

  return params
}

// Dropdown component
function FilterDropdown({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)
  const isActive = value !== "" && value !== options[0]?.value

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
          isActive
            ? "bg-primary-soft text-primary border-primary/40"
            : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
        }`}
      >
        {selected?.label || label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[160px] py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                value === opt.value
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function RisingKeywords({ showResults = false }: RisingKeywordsProps) {
  const { isAuthenticated, usage, refresh } = useAccount()
  const [showPricing, setShowPricing] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [shouldShowPricingAfterLogin, setShouldShowPricingAfterLogin] = useState(false)
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [backendKeywords, setBackendKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [keywordToUnlock, setKeywordToUnlock] = useState<Keyword | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters })

  const updateFilter = (key: keyof FilterState, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
    pageCache.clear()
  }

  const hasActiveFilters = (
    filters.field !== "" ||
    filters.category !== "" ||
    filters.competition_level !== "" ||
    filters.sort_by !== "created_at" ||
    filters.sort_order !== "desc" ||
    filters.mrr !== "" ||
    filters.is_new !== null
  )

  const resetFilters = () => {
    setFilters({ ...defaultFilters })
    setCurrentPage(1)
    pageCache.clear()
  }

  // Fetch keywords from API
  useEffect(() => {
    let ignore = false

    async function fetchKeywords(page: number) {
      const cacheKey = buildCacheKey(page, filters)
      const now = Date.now()
      const cached = pageCache.get(cacheKey)
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        setBackendKeywords(cached.data)
        setTotalPages(cached.totalPages)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const params = buildApiParams(page, filters)

        const response = await keywordService.getList(params)

        if (ignore) return

        if (response && response.items && response.items.length > 0) {
          pageCache.set(cacheKey, {
            data: response.items,
            total: response.total,
            totalPages: response.total_pages,
            timestamp: Date.now()
          })
          setBackendKeywords(response.items)
          setTotalPages(response.total_pages)
          setLastUpdated(new Date())
        } else if (response && response.items) {
          setBackendKeywords([])
          setTotalPages(1)
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch keywords:', error)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchKeywords(currentPage)

    return () => {
      ignore = true
    }
  }, [currentPage, filters])

  const handleKeywordClick = (keyword: Keyword) => {
    // Check if keyword is locked based on backend data
    if (keyword.is_locked) {
      setKeywordToUnlock(keyword)
      setShowUnlockDialog(true)
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
      setBackendKeywords(prev => prev.map(kw =>
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
      pageCache.clear()

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

  const handleLoginClose = () => {
    setShowLogin(false)
  }

  // Watch for authentication changes and show pricing modal after login
  useEffect(() => {
    if (isAuthenticated && shouldShowPricingAfterLogin) {
      setShouldShowPricingAfterLogin(false)
      setShowLogin(false)
      setShowPricing(true)
    }
  }, [isAuthenticated, shouldShowPricingAfterLogin])

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60) // minutes
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff} min ago`
    return `${Math.floor(diff / 60)} hr ago`
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {showResults ? "Search Results" : "Rising Keywords"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {showResults ? "Opportunities found matching your criteria" : "Emerging tech terms gaining traction"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
            <span className="font-mono text-xs text-muted-foreground">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          </div>
        </div>

        {/* Filter Bar - Two Rows */}
        <div className="space-y-3">
          {/* Row 1: Field/Type pills */}
          <div className="flex items-center gap-2">
            {FIELD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateFilter("field", opt.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                  filters.field === opt.value
                    ? "bg-success-soft text-success border-success/30"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Row 2: Dropdowns + toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown
              label="Competition"
              value={filters.competition_level}
              options={COMPETITION_OPTIONS}
              onChange={(v) => updateFilter("competition_level", v)}
            />
            <FilterDropdown
              label="Est. MRR"
              value={filters.mrr}
              options={MRR_OPTIONS}
              onChange={(v) => updateFilter("mrr", v)}
            />
            <FilterDropdown
              label="Order By"
              value={filters.sort_by}
              options={SORT_BY_OPTIONS}
              onChange={(v) => updateFilter("sort_by", v)}
            />

            {/* New keyword toggle */}
            <button
              onClick={() => updateFilter("is_new", filters.is_new === true ? null : true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filters.is_new === true
                  ? "bg-success-soft text-success border-success/30"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              New Only
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          {loading && backendKeywords.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-sm">Loading keywords...</span>
              </div>
            </div>
          ) : backendKeywords.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {backendKeywords.map((kw, index) => {
                  const detail = keywordDetails[kw.keyword]
                  const trendData = detail
                    ? detail.trendData.map(d => d.value)
                    : generateTrendDataFromKeyword(kw).map(d => d.value)

                  // Logic for blur overlay:
                  // Use backend's is_locked field to determine if keyword should be blurred
                  const shouldBlur = kw.is_locked === true
                  const isUnauthenticatedLock = !isAuthenticated && shouldBlur

                  return (
                    <div key={`${kw.keyword}-${index}`} className="relative">
                      <KeywordCard
                        keyword={kw}
                        trendData={trendData}
                        onClick={() => handleKeywordClick(kw)}
                      />

                      {shouldBlur && (
                        <div className="absolute inset-0 backdrop-blur-[6px] bg-background/60 rounded-xl z-10 flex flex-col items-center justify-center p-4 gap-3">
                          {kw.highlight && (
                            <div className="bg-card p-3 rounded-lg shadow-lg border-2 border-success/30 max-w-[180px]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="h-4 w-4 text-success" />
                                <span className="text-xs font-bold text-success">Premium</span>
                              </div>
                              <p className="text-xs font-medium text-foreground">
                                {kw.highlight.highlight_text}
                              </p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold cursor-pointer h-8 text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isUnauthenticatedLock) {
                                // If user is not authenticated, show login dialog directly
                                setShowLogin(true)
                              } else {
                                // If user is authenticated, show unlock dialog
                                setKeywordToUnlock(kw)
                                setShowUnlockDialog(true)
                              }
                            }}
                          >
                            <Unlock className="h-3 w-3 mr-1.5" />
                            {isUnauthenticatedLock ? 'Sign in' : 'Unlock'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="border-border bg-card text-foreground hover:bg-primary-soft hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = []
                      const showEllipsis = totalPages > 7
                      
                      if (!showEllipsis) {
                        // Show all pages if total <= 7
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i)
                        }
                      } else {
                        // Always show first page
                        pages.push(1)
                        
                        if (currentPage <= 3) {
                          // Near start: 1 2 3 4 5 ... 50
                          pages.push(2, 3, 4, 5, '...', totalPages)
                        } else if (currentPage >= totalPages - 2) {
                          // Near end: 1 ... 46 47 48 49 50
                          pages.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                        } else {
                          // Middle: 1 ... 23 24 25 ... 50
                          pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
                        }
                      }
                      
                      return pages.map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            disabled={loading}
                            className={`min-w-[32px] border-border cursor-pointer ${
                              currentPage === page
                                ? 'bg-primary text-white border-primary/40'
                                : 'bg-card text-muted-foreground hover:bg-primary-soft hover:border-primary/40 hover:text-primary'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {page}
                          </Button>
                        )
                      })
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="border-border bg-card text-foreground hover:bg-primary-soft hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <span className="text-sm">No keywords found. Please check your API connection.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginDialog open={showLogin} onClose={handleLoginClose} />
      <PricingModal open={showPricing} onOpenChange={setShowPricing} feature="Full Keyword Insights" />
      <KeywordDetailDialog
        keywordId={selectedKeywordId}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
      <UnlockKeywordDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        keywordName={keywordToUnlock?.keyword || ''}
        userCredits={usage?.credits.balance ?? 0}
        onConfirm={handleUnlockKeyword}
        isUnauthenticated={!isAuthenticated}
        onLoginRequired={() => setShowLogin(true)}
      />
    </>
  )
}
