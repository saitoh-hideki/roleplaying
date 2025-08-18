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
    <div className="min-h-screen bg-[#0E1117]">
      <div className="w-full px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">履歴</h1>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-48 bg-[#1A1B26] border-[#374151] text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1B26] border-[#374151]">
              <SelectItem value="date_desc" className="text-white hover:bg-[#374151]">日付（新しい順）</SelectItem>
              <SelectItem value="date_asc" className="text-white hover:bg-[#374151]">日付（古い順）</SelectItem>
              <SelectItem value="score_desc" className="text-white hover:bg-[#374151]">スコア（高い順）</SelectItem>
              <SelectItem value="score_asc" className="text-white hover:bg-[#374151]">スコア（低い順）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">読み込み中...</p>
          </div>
        ) : history.length > 0 ? (
          <>
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="bg-gradient-to-r from-[#1A1B26] to-[#1F2937] border-0 p-6 rounded-2xl shadow-lg shadow-black/20 text-white hover:shadow-2xl hover:shadow-[#6366F1]/20 transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{item.scenario?.title || 'シナリオなし'}</h3>
                      <p className="text-slate-400">
                        {format(new Date(item.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                    </div>
                    {item.evaluation ? (
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(item.evaluation.total_score)} mb-3`}>
                          {item.evaluation.total_score}点
                        </div>
                        <Link href={`/result/${item.id}`}>
                          <Button variant="outline" size="sm" className="border-[#374151] text-slate-300 hover:bg-[#1F2937] hover:text-slate-50 rounded-xl">
                            詳細を見る
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-slate-400 mb-3 text-lg">未評価</p>
                        <Link href={`/record?retry=${item.id}`}>
                          <Button variant="outline" size="sm" className="border-[#374151] text-slate-300 hover:bg-[#1F2937] hover:text-slate-50 rounded-xl">
                            評価する
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-[#374151] text-slate-300 hover:bg-[#1F2937] hover:text-slate-50 rounded-xl"
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
                      className={`w-10 rounded-xl ${
                        page === currentPage 
                          ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5B5BE6] hover:to-[#7C3AED] text-white" 
                          : "border-[#374151] text-slate-300 hover:bg-[#1F2937] hover:text-slate-50"
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