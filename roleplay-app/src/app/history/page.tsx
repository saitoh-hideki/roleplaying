'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Search, Filter, Calendar, Clock, Star, Eye, RefreshCw, TrendingUp, Mic, CheckCircle, Hourglass } from 'lucide-react'

interface HistoryItem {
  id: string
  created_at: string
  scene: {
    title: string
    description?: string
    icon?: string
  }
  evaluation: {
    total_score: number
  } | null
}

type SortOption = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'
type DateFilter = 'all' | 'today' | 'week' | 'month'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  const observer = useRef<IntersectionObserver>()
  const itemsPerPage = 20
  
  const supabase = createClient()

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('recordings')
          .select(`
            id,
            created_at,
            scenes!recordings_situation_id_fkey (title, description, icon),
            evaluations (total_score)
          `, { count: 'exact' })

        // Apply date filter
        if (dateFilter !== 'all') {
          const now = new Date()
          let startDate: Date
          
          switch (dateFilter) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
              break
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case 'month':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
            default:
              startDate = new Date(0)
          }
          
          query = query.gte('created_at', startDate.toISOString())
        }

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`scenes.title.ilike.%${searchQuery}%,scenes.description.ilike.%${searchQuery}%`)
        }

        // Apply sorting
        switch (sortBy) {
          case 'date_desc':
            query = query.order('created_at', { ascending: false })
            break
          case 'date_asc':
            query = query.order('created_at', { ascending: true })
            break
          case 'score_desc':
          case 'score_asc':
            query = query.order('created_at', { ascending: false })
            break
        }

        // Reset pagination for new filters
        setPage(1)
        setHistory([])
        setHasMore(true)

        // Get first page
        const { data, error, count } = await query.range(0, itemsPerPage - 1)

        if (error) throw error

        let formattedData = data?.map(r => ({
          id: r.id,
          created_at: r.created_at,
          scene: { 
            title: (r.scenes as any)?.title || 'シーンなし',
            description: (r.scenes as any)?.description || '',
            icon: (r.scenes as any)?.icon || '🎭'
          },
          evaluation: r.evaluations?.[0] || null
        })) || []

        // Client-side sorting for scores
        if (sortBy === 'score_desc' || sortBy === 'score_asc') {
          formattedData.sort((a, b) => {
            const scoreA = a.evaluation?.total_score ?? -1
            const scoreB = b.evaluation?.total_score ?? -1
            return sortBy === 'score_desc' ? scoreB - scoreA : scoreA - scoreB
          })
        }

        setHistory(formattedData)
        setHasMore(formattedData.length === itemsPerPage)
        setPage(2) // Next page will be 2
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    const loadStats = async () => {
      try {
        const { count: total } = await supabase
          .from('recordings')
          .select('*', { count: 'exact', head: true })

        // 評価完了数を取得（evaluationsテーブルに関連するレコード）
        const { count: completed } = await supabase
          .from('evaluations')
          .select('recording_id', { count: 'exact', head: true })

        setStats({
          total: total || 0,
          completed: completed || 0,
          pending: (total || 0) - (completed || 0)
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    loadInitialData()
    loadStats()
  }, [sortBy, dateFilter, searchQuery])

  const fetchHistory = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1)
      setHistory([])
      setHasMore(true)
    }

    if (!hasMore && !reset) return

    setLoading(true)
    try {
      let query = supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          scenes!recordings_situation_id_fkey (title, description, icon),
          evaluations (total_score)
        `, { count: 'exact' })

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`scenes.title.ilike.%${searchQuery}%,scenes.description.ilike.%${searchQuery}%`)
      }

      // Apply sorting
      switch (sortBy) {
        case 'date_desc':
          query = query.order('created_at', { ascending: false })
          break
        case 'date_asc':
          query = query.order('created_at', { ascending: true })
          break
        case 'score_desc':
        case 'score_asc':
          query = query.order('created_at', { ascending: false })
          break
      }

      // Apply pagination
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      let formattedData = data?.map(r => ({
        id: r.id,
        created_at: r.created_at,
        scene: { 
          title: (r.scenes as any)?.title || 'シーンなし',
          description: (r.scenes as any)?.description || '',
          icon: (r.scenes as any)?.icon || '🎭'
        },
        evaluation: r.evaluations?.[0] || null
      })) || []

      // Client-side sorting for scores
      if (sortBy === 'score_desc' || sortBy === 'score_asc') {
        formattedData.sort((a, b) => {
          const scoreA = a.evaluation?.total_score ?? -1
          const scoreB = b.evaluation?.total_score ?? -1
          return sortBy === 'score_desc' ? scoreB - scoreA : scoreA - scoreB
        })
      }

      if (reset) {
        setHistory(formattedData)
      } else {
        setHistory(prev => [...prev, ...formattedData])
      }

      setHasMore(formattedData.length === itemsPerPage)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, dateFilter, searchQuery, sortBy, page, hasMore, itemsPerPage])

  const fetchStats = useCallback(async () => {
    try {
      const { count: total } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true })

      const { count: completed } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true })
        .not('evaluations', 'is', null)

      setStats({
        total: total || 0,
        completed: completed || 0,
        pending: (total || 0) - (completed || 0)
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [supabase])

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchHistory(false)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore, fetchHistory])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/10 border-green-400/20'
    if (score >= 60) return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    return 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: '優秀', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20' }
    if (score >= 60) return { text: '良好', color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/20' }
    return { text: '要改善', color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/20' }
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '昨日'
    if (diffDays === 0) return format(date, 'HH:mm', { locale: ja })
    if (diffDays <= 7) return `${diffDays}日前`
    return format(date, 'MM/dd', { locale: ja })
  }

  const dateFilters = [
    { id: 'all', label: 'すべて', icon: Calendar },
    { id: 'today', label: '今日', icon: Clock },
    { id: 'week', label: '今週', icon: TrendingUp },
    { id: 'month', label: '今月', icon: Calendar },
  ]

  const sortOptions = [
    { value: 'date_desc', label: '日付（新しい順）', icon: Clock },
    { value: 'date_asc', label: '日付（古い順）', icon: Clock },
    { value: 'score_desc', label: 'スコア（高い順）', icon: Star },
    { value: 'score_asc', label: 'スコア（低い順）', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2b] to-[#0f0f1a]">
      <div className="w-full px-8 py-12">
        {/* ヘッダー */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">シーン履歴</h1>
          <p className="text-slate-400 text-lg">これまでの練習記録を確認できます</p>
        </div>

        {/* 検索バー */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="シーン名や内容で検索..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1a1a2b] border border-[#334155] text-white rounded-2xl text-lg placeholder:text-slate-500 focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/20 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* 日付フィルター */}
          <div className="flex gap-2">
            {dateFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <Button
                  key={filter.id}
                  variant={dateFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(filter.id as DateFilter)}
                  className={`rounded-xl px-4 py-2 ${
                    dateFilter === filter.id
                      ? "bg-gradient-to-r from-[#7C4DFF] to-[#9C6DFF] text-white shadow-lg shadow-[#7C4DFF]/25"
                      : "bg-[#1a1a2b] border-[#334155] text-slate-300 hover:bg-[#2a2a3b] hover:border-[#7C4DFF]"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {filter.label}
                </Button>
              )
            })}
          </div>

          {/* ソート */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-48 bg-[#1a1a2b] border-[#334155] text-white rounded-xl px-4 py-2">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2b] border-[#334155]">
              {sortOptions.map((option) => {
                const Icon = option.icon
                return (
                  <SelectItem key={option.value} value={option.value} className="text-white hover:bg-[#2a2a3b]">
                    <Icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-[#1a1a2b] to-[#2a2a3b] border-[#334155] rounded-2xl shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-[#7C4DFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-[#7C4DFF]" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
              <div className="text-slate-400">総録音数</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1a1a2b] to-[#2a2a3b] border-[#334155] rounded-2xl shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#10B981]" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.completed}</div>
              <div className="text-slate-400">評価完了</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1a1a2b] to-[#2a2a3b] border-[#334155] rounded-2xl shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-[#F59E0B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hourglass className="w-8 h-8 text-[#F59E0B]" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.pending}</div>
              <div className="text-slate-400">評価待ち</div>
            </CardContent>
          </Card>
        </div>

        {/* 履歴リスト */}
        {loading && history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-400 text-xl">読み込み中...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-6">
            {history.map((item, index) => (
              <div key={item.id} className="relative">
                {/* タイムライン */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#7C4DFF] via-[#7C4DFF] to-transparent"></div>
                
                {/* カード */}
                <Card className="bg-gradient-to-r from-[#1a1a2b] to-[#2a2a3b] border-[#334155] rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-[#7C4DFF]/20 transition-all duration-300 hover:scale-[1.01] ml-16">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-[#334155] rounded-full flex items-center justify-center text-2xl">
                            {item.scene.icon}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {item.scene.title}
                            </h3>
                            <div className="flex items-center gap-4 text-slate-400">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatRelativeDate(item.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(item.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {item.scene.description && (
                          <p className="text-slate-300 text-lg leading-relaxed mb-6">
                            {item.scene.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-8">
                        {item.evaluation ? (
                          <div className="space-y-4">
                            <div className="text-center">
                              <div className={`text-4xl font-bold mb-2 ${getScoreColor(item.evaluation.total_score)}`}>
                                {item.evaluation.total_score}点
                              </div>
                              <Badge className={`px-4 py-2 text-sm font-semibold border ${getScoreBadge(item.evaluation.total_score).bgColor} ${getScoreBadge(item.evaluation.total_score).borderColor}`}>
                                {getScoreBadge(item.evaluation.total_score).text}
                              </Badge>
                            </div>
                            <Link href={`/result/${item.id}`}>
                              <Button className="w-full bg-gradient-to-r from-[#7C4DFF] to-[#9C6DFF] hover:from-[#6B3DFF] hover:to-[#8B5DFF] text-white rounded-xl px-6 py-3 shadow-lg shadow-[#7C4DFF]/25">
                                <Eye className="w-4 h-4 mr-2" />
                                詳細を見る
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-slate-400 mb-4">
                              <div className="text-2xl font-semibold mb-2">未評価</div>
                              <Badge className="px-4 py-2 text-sm font-semibold bg-slate-600/20 border-slate-500/30 text-slate-300">
                                評価待ち
                              </Badge>
                            </div>
                            <Link href={`/record?retry=${item.id}`}>
                              <Button variant="outline" className="w-full border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white rounded-xl px-6 py-3">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                評価する
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 無限スクロール用の監視要素 */}
                {index === history.length - 1 && hasMore && (
                  <div ref={lastElementRef} className="h-4" />
                )}
              </div>
            ))}

            {/* 読み込み中インジケーター */}
            {loading && history.length > 0 && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 mt-2">さらに読み込み中...</p>
              </div>
            )}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-[#1a1a2b] to-[#2a2a3b] border-[#334155] rounded-2xl shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-[#334155] rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">まだ履歴がありません</h3>
              <p className="text-slate-400 mb-8 text-lg">
                {searchQuery ? '検索条件に該当する録音がありません。' : '選択したフィルターに該当する録音がありません。'}
              </p>
              <Link href="/record">
                <Button className="bg-gradient-to-r from-[#7C4DFF] to-[#9C6DFF] hover:from-[#6B3DFF] hover:to-[#8B5DFF] text-white rounded-xl px-8 py-4 text-lg shadow-lg shadow-[#7C4DFF]/25">
                  録音を始める
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}