'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RecentRoleplay {
  id: string
  created_at: string
  scenario: {
    title: string
  }
  evaluation: {
    total_score: number
  } | null
}

interface ScoreData {
  date: string
  score: number
}

export default function DashboardPage() {
  const [recentRoleplays, setRecentRoleplays] = useState<RecentRoleplay[]>([])
  const [scoreData, setScoreData] = useState<ScoreData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch recent roleplays with evaluations
      const { data: recordings, error } = await supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          scenarios (title),
          evaluations (total_score)
        `)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error

      const formattedRecordings = recordings?.map(r => ({
        id: r.id,
        created_at: r.created_at,
        scenario: r.scenarios,
        evaluation: r.evaluations?.[0] || null
      })) || []

      setRecentRoleplays(formattedRecordings)

      // Fetch score history for chart
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          total_score,
          created_at,
          recordings (created_at)
        `)
        .order('created_at', { ascending: true })
        .limit(10)

      if (evalError) throw evalError

      const scores = evaluations?.map(e => ({
        date: format(new Date(e.created_at), 'MM/dd'),
        score: e.total_score
      })) || []

      setScoreData(scores)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">接客ロープレ ダッシュボード</h1>
        <Link href="/record">
          <Button size="lg">
            ロープレを始める
          </Button>
        </Link>
      </div>

      {/* スコア推移チャート */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>スコア推移</CardTitle>
          <CardDescription>最近の評価スコアの推移</CardDescription>
        </CardHeader>
        <CardContent>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">まだデータがありません</p>
          )}
        </CardContent>
      </Card>

      {/* 最近のロープレ */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">最近のロープレ</h2>
        {loading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : recentRoleplays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRoleplays.map((roleplay) => (
              <Card key={roleplay.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{roleplay.scenario?.title || 'シナリオなし'}</CardTitle>
                  <CardDescription>
                    {format(new Date(roleplay.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roleplay.evaluation ? (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {roleplay.evaluation.total_score}点
                      </div>
                      <Link href={`/result/${roleplay.id}`}>
                        <Button variant="outline" className="mt-2" size="sm">
                          詳細を見る
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <p>未評価</p>
                      <Link href={`/record?retry=${roleplay.id}`}>
                        <Button variant="outline" className="mt-2" size="sm">
                          評価する
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">まだロープレの記録がありません</p>
              <Link href="/record">
                <Button>最初のロープレを始める</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}