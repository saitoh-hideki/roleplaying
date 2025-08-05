'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Clock, Award, Play, ArrowRight } from 'lucide-react'

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
        scenario: { title: (r.scenarios as any)?.title || 'シナリオなし' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">接客ロープレ ダッシュボード</h1>
              <p className="text-gray-600 mt-1">あなたの接客スキル向上をサポートします</p>
            </div>
            <Link href="/record">
              <Button className="btn-saas-primary flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>ロープレを始める</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-saas">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">総練習回数</p>
                  <p className="text-2xl font-bold text-slate-900">{recentRoleplays.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-saas">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">平均スコア</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {recentRoleplays.filter(r => r.evaluation).length > 0 
                      ? Math.round(recentRoleplays.filter(r => r.evaluation).reduce((acc, r) => acc + (r.evaluation?.total_score || 0), 0) / recentRoleplays.filter(r => r.evaluation).length)
                      : 0
                    }点
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-saas">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">最高スコア</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {recentRoleplays.length > 0 
                      ? Math.max(...recentRoleplays.filter(r => r.evaluation).map(r => r.evaluation?.total_score || 0))
                      : 0
                    }点
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* スコア推移チャート */}
        <Card className="card-saas mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <span>スコア推移</span>
            </CardTitle>
            <CardDescription>最近の評価スコアの推移を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0f172a" 
                    strokeWidth={3}
                    dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">まだデータがありません</p>
                <p className="text-gray-400 text-sm mt-1">最初のロープレを始めてスコアを記録しましょう</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近のロープレ */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-slate-600" />
              <span>最近のロープレ</span>
            </h2>
            <Link href="/history">
              <Button variant="outline" className="flex items-center space-x-2">
                <span>すべて見る</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">読み込み中...</p>
            </div>
          ) : recentRoleplays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRoleplays.map((roleplay) => (
                <Card key={roleplay.id} className="card-saas group hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 group-hover:text-slate-700 transition-colors">
                      {roleplay.scenario?.title || 'シナリオなし'}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(new Date(roleplay.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {roleplay.evaluation ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">評価スコア</span>
                          <div className="text-2xl font-bold text-blue-600">
                            {roleplay.evaluation.total_score}点
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${roleplay.evaluation.total_score}%` }}
                          ></div>
                        </div>
                        <Link href={`/result/${roleplay.id}`}>
                          <Button variant="outline" className="w-full btn-saas-secondary">
                            詳細を見る
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Award className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">未評価</p>
                          <p className="text-gray-400 text-sm">評価を完了してください</p>
                        </div>
                        <Link href={`/record?retry=${roleplay.id}`}>
                          <Button className="w-full btn-saas-primary">
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
            <Card className="card-saas">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">まだロープレの記録がありません</h3>
                <p className="text-gray-500 mb-6">最初のロープレを始めて、接客スキルを向上させましょう</p>
                <Link href="/record">
                  <Button className="btn-saas-primary">
                    最初のロープレを始める
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}