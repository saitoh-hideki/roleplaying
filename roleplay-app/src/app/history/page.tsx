'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HistoryItem {
  id: string
  created_at: string
  scenario: {
    title: string
  }
  evaluation: {
    total_score: number
  } | null
}

type SortOption = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  const supabase = createClient()

  useEffect(() => {
    fetchHistory()
  }, [sortBy, currentPage])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          scenarios (title),
          evaluations (total_score)
        `, { count: 'exact' })

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
          // For score sorting, we'll sort client-side after fetching
          query = query.order('created_at', { ascending: false })
          break
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      let formattedData = data?.map(r => ({
        id: r.id,
        created_at: r.created_at,
        scenario: { title: (r.scenarios as any)?.title || 'シナリオなし' },
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
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">履歴</h1>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="date_desc" className="text-slate-50 hover:bg-slate-700">日付（新しい順）</SelectItem>
              <SelectItem value="date_asc" className="text-slate-50 hover:bg-slate-700">日付（古い順）</SelectItem>
              <SelectItem value="score_desc" className="text-slate-50 hover:bg-slate-700">スコア（高い順）</SelectItem>
              <SelectItem value="score_asc" className="text-slate-50 hover:bg-slate-700">スコア（低い順）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 mt-4">読み込み中...</p>
          </div>
        ) : history.length > 0 ? (
          <>
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="bg-slate-800 border-0 shadow-lg text-slate-50 hover:shadow-xl transition-all duration-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-slate-50">{item.scenario?.title || 'シナリオなし'}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {format(new Date(item.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </CardDescription>
                      </div>
                      {item.evaluation ? (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(item.evaluation.total_score)}`}>
                            {item.evaluation.total_score}点
                          </div>
                          <Link href={`/result/${item.id}`}>
                            <Button variant="outline" size="sm" className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50">
                              詳細を見る
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-slate-400 mb-2">未評価</p>
                          <Link href={`/record?retry=${item.id}`}>
                            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50">
                              評価する
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 ${
                        page === currentPage 
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white" 
                          : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50"
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="bg-slate-800 border-0 shadow-lg text-slate-50">
            <CardContent className="text-center py-12">
              <p className="text-slate-400 mb-4">まだ履歴がありません</p>
              <Link href="/record">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">録音を始める</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}