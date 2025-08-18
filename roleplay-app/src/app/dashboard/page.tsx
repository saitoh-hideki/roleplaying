'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { BarChart3, Clock, Zap, Gauge, Award, TrendingUp, Target, Trophy } from 'lucide-react'
import { LearningPlanner } from '@/components/ui/learning-planner'

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
  label: string
  fullDate: string
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
          scenes (title),
          evaluations (total_score)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Recordings fetch error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      const formattedRecordings = recordings?.map(r => ({
        id: r.id,
        created_at: r.created_at,
        scenario: { title: (r.scenes as any)?.title || 'No Scene' },
        evaluation: r.evaluations?.[0] || null
      })) || []

      console.log('Available recording IDs:', formattedRecordings.map(r => r.id))
      console.log('Full recordings data:', formattedRecordings)
      setRecentRoleplays(formattedRecordings)

      // Fetch score history for chart - より詳細なデータを取得
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          total_score,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(15)

      if (evalError) {
        console.error('Evaluations fetch error:', evalError)
        console.error('Error details:', {
          code: evalError.code,
          message: evalError.message,
          details: evalError.details,
          hint: evalError.hint
        })
        throw evalError
      }

      // スコアデータを相対的なラベル付きでフォーマット
      const scores = evaluations?.map((e, index) => {
        const date = new Date(e.created_at)
        let label = ''
        
        if (index === 0) {
          label = '最新'
        } else if (index === 1) {
          label = '1回前'
        } else if (index === 2) {
          label = '2回前'
        } else if (index === 3) {
          label = '3回前'
        } else if (index === 4) {
          label = '4回前'
        } else if (index === 5) {
          label = '5回前'
        } else if (index === 6) {
          label = '6回前'
        } else if (index === 7) {
          label = '7回前'
        } else if (index === 8) {
          label = '8回前'
        } else if (index === 9) {
          label = '9回前'
        } else if (index === 10) {
          label = '10回前'
        } else if (index === 11) {
          label = '11回前'
        } else if (index === 12) {
          label = '12回前'
        } else if (index === 13) {
          label = '13回前'
        } else if (index === 14) {
          label = '14回前'
        } else {
          label = `${index + 1}回前`
        }

        // 日本語の曜日配列
        const weekdays = ['日', '月', '火', '水', '木', '金', '土']
        const weekday = weekdays[date.getDay()]
        const fullDate = `${format(date, 'MM/dd')} (${weekday})`

        return {
          date: label,
          score: e.total_score,
          label: label,
          fullDate: fullDate
        }
      }).slice(0, 10) || [] // 最新10件のみ表示

      setScoreData(scores)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // より詳細なエラー情報を表示
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  // 統計データの計算
  const totalPracticeCount = recentRoleplays.length
  const evaluatedRoleplays = recentRoleplays.filter(r => r.evaluation)
  const averageScore = evaluatedRoleplays.length > 0 
    ? Math.round(evaluatedRoleplays.reduce((acc, r) => acc + (r.evaluation?.total_score || 0), 0) / evaluatedRoleplays.length)
    : 0
  const highestScore = evaluatedRoleplays.length > 0 
    ? Math.max(...evaluatedRoleplays.map(r => r.evaluation?.total_score || 0))
    : 0

  // カスタムツールチップコンポーネント
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#1A1B26] border border-[#374151] rounded-2xl p-4 shadow-2xl shadow-black/30">
          <div className="text-center">
            <p className="text-lg font-bold text-white mb-1">{data.label}</p>
            <p className="text-sm text-slate-400 mb-2">{data.fullDate}</p>
            <p className="text-2xl font-bold text-[#22D3EE]">{data.score} 点</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-[#0E1117] min-h-screen py-12">
      <div className="w-full px-8">
        {/* ヘッダー - より大きな余白と洗練されたデザイン */}
        <div className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                Roleplay Dashboard
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Track your customer interaction practice sessions and analyze your progress with AI-powered insights.
              </p>
            </div>
            <Link href="/scenes">
              <Button className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5B5BE6] hover:to-[#7C3AED] text-white flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg shadow-[#6366F1]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#6366F1]/30 hover:scale-105">
                <Award className="w-5 h-5" /> 
                <span className="font-semibold">Training Scenes</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計パネル（主要KPI）- より大きな数値と洗練されたデザイン */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-[#6366F1]/10 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-medium">Total Sessions</p>
              </div>
            </div>
            <p className="text-5xl font-bold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">{totalPracticeCount}</p>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-[#6366F1]/10 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-medium">Average Score</p>
              </div>
            </div>
            <p className="text-5xl font-bold bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent">{averageScore}</p>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-[#6366F1]/10 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-medium">Best Score</p>
              </div>
            </div>
            <p className="text-5xl font-bold bg-gradient-to-r from-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">{highestScore}</p>
          </Card>
        </div>

        {/* メイン2カラム（55:45） 履歴 + チャート - 画面いっぱいに調整 */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 mb-12">
          {/* Recent Roleplays - より洗練されたデザイン */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Recent Roleplays</h3>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Loading your progress...</p>
              </div>
            ) : recentRoleplays.length > 0 ? (
              <div className="space-y-4 h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {recentRoleplays.slice(0, 7).map((roleplay) => (
                  <Link
                    key={roleplay.id}
                    href={`/result/${roleplay.id}`}
                    className="block group"
                  >
                    <Card className="bg-gradient-to-r from-[#1A1B26] to-[#1F2937] border-0 p-6 rounded-2xl shadow-lg shadow-black/20 text-white hover:shadow-2xl hover:shadow-[#6366F1]/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer group-hover:bg-gradient-to-r group-hover:from-[#1F2937] group-hover:to-[#374151]">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">{roleplay.scenario?.title || 'No Scenario'}</h4>
                          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                            {format(new Date(roleplay.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          {roleplay.evaluation ? (
                            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/25">
                              {roleplay.evaluation.total_score} pts
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-full border-2 border-slate-500 px-4 py-2 text-sm font-semibold text-slate-400">
                              未評価
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
                <div className="text-right pt-4">
                  <Link href="/history">
                    <Button variant="outline" className="border-[#374151] text-slate-300 hover:bg-[#1F2937] hover:text-slate-50 hover:border-[#6366F1] text-base py-3 px-6 rounded-xl transition-all duration-200">
                      View All Sessions
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-12 text-center text-white rounded-3xl shadow-2xl shadow-black/20">
                <div className="w-20 h-20 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">No roleplay sessions yet</h3>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">Start your first roleplay to track your progress and see your growth over time</p>
                <Link href="/record">
                  <Button className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5B5BE6] hover:to-[#7C3AED] text-white text-lg py-4 px-8 rounded-xl shadow-lg shadow-[#6366F1]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#6366F1]/30 hover:scale-105">
                    Start Your First Roleplay
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Score Trend Chart - 相対的なラベルと日付付き */}
          <div className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 rounded-3xl p-6 h-[480px] flex flex-col shadow-2xl shadow-black/20 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Score Trend</h3>
            </div>
            {scoreData.length > 0 ? (
              <div className="bg-[#0F111A] rounded-2xl p-4 flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" className="min-h-0">
                  <AreaChart data={scoreData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="#6B7280"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#22D3EE" 
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                      dot={{ fill: '#22D3EE', strokeWidth: 2, r: 2, stroke: '#0F111A' }}
                      activeDot={{ r: 4, stroke: '#22D3EE', strokeWidth: 2, fill: '#22D3EE' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <p className="text-slate-400 font-medium text-lg mb-2">No data available</p>
                <p className="text-slate-500 text-base">Complete your first evaluation to see score trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Planner Section */}
        <LearningPlanner />
      </div>

      {/* カスタムスクロールバーのスタイル */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6366F1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5B5BE6;
        }
      `}</style>
    </div>
  )
}