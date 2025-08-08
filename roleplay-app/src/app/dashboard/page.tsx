'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Clock, Award, Play, ArrowRight, Target, Zap } from 'lucide-react'
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

      const scores = evaluations?.map(e => ({
        date: format(new Date(e.created_at), 'MM/dd'),
        score: e.total_score
      })) || []

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

  return (
    <div className="bg-[#0F111A] py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                🧑‍🏫 Roleplay Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                Track your customer interaction practice sessions and analyze your progress.
              </p>
            </div>
            <Link href="/scenes">
              <Button className="bg-[#7C4DFF] hover:bg-[#6b3bff] text-white flex items-center gap-2">
                🎯 Training Scenes
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計パネル（3枚の指標カード） */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 text-white">
            <h4 className="text-sm text-slate-400 mb-1">Total Sessions</h4>
            <p className="text-2xl font-bold text-[#7C4DFF]">{totalPracticeCount}</p>
          </Card>
          
          <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 text-white">
            <h4 className="text-sm text-slate-400 mb-1">Average Score</h4>
            <p className="text-2xl font-bold text-[#7C4DFF]">{averageScore}</p>
          </Card>
          
          <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-5 text-white">
            <h4 className="text-sm text-slate-400 mb-1">Best Score</h4>
            <p className="text-2xl font-bold text-[#7C4DFF]">{highestScore}</p>
          </Card>
        </div>

        {/* メイン2カラム（履歴 + チャート） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Roleplays */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white mb-2">🕒 Recent Roleplays</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 mt-4">Loading...</p>
              </div>
            ) : recentRoleplays.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentRoleplays.slice(0,7).map((roleplay) => (
                  <Link
                    key={roleplay.id}
                    href={`/result/${roleplay.id}`}
                    className="block"
                  >
                    <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-4 rounded-lg text-white flex justify-between items-center hover:bg-[rgba(124,77,255,0.12)] transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-200">{roleplay.scenario?.title || 'No Scenario'}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(roleplay.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        {roleplay.evaluation ? (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-[#7C4DFF] border-[#7C4DFF]">
                            {roleplay.evaluation.total_score} pts
                          </div>
                        ) : (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-400 border-slate-500">
                            未評価
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
                <div className="text-right pt-1">
                  <Link href="/history">
                    <Button variant="outline" className="border-[#2A2E3D] text-slate-300 hover:bg-[#1A1F2B] hover:text-slate-50 text-sm py-1.5">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Card className="bg-[#1A1F2B] border border-[#2A2E3D] p-6 text-center text-white">
                <div className="w-12 h-12 bg-[#2A2E3D] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No roleplay sessions yet</h3>
                <p className="text-slate-400 mb-4">Start your first roleplay to track your progress</p>
                <Link href="/record">
                  <Button className="bg-[#7C4DFF] hover:bg-[#6b3bff] text-white">
                    Start Roleplay
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Score Trend Chart */}
          <div className="bg-[#1A1F2B] border border-[#2A2E3D] rounded-lg p-6">
            <h3 className="text-base font-semibold text-white mb-4">📈 Score Trend</h3>
            {scoreData.length > 0 ? (
              <div className="bg-[#111827] rounded-lg p-4 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2E3D" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#0F111A',
                        border: '1px solid #2A2E3D',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                        color: '#f1f5f9'
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7C4DFF" 
                      strokeWidth={3}
                      dot={{ fill: '#7C4DFF', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#7C4DFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#2A2E3D] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 font-medium">No data available</p>
                <p className="text-slate-500 text-sm mt-1">Complete your first evaluation to see score trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Planner Section */}
        <LearningPlanner />
      </div>
    </div>
  )
}