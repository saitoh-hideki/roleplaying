'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart } from '@/components/ui/radar-chart'
import { ReflectionChat } from '@/components/ui/reflection-chat'
import { CoreSkillsChart } from '@/components/ui/core-skills-chart'
import { SceneSkillsChart } from '@/components/ui/scene-skills-chart'
import { ReportDownload } from '@/components/ui/report-download'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, BarChart3, Target } from 'lucide-react'

interface ResultData {
  recording: {
    id: string
    created_at: string
    transcript: string
    situation_id?: string
    scenario: {
      title: string
      description: string
    }
  }
  evaluation: {
    id: string
    total_score: number
    summary_comment: string
  }
  feedbackNotes: {
    id: string
    score: number
    comment: string
    criterion: {
      label: string
      description: string
      max_score: number
      type?: string
    }
  }[]
  philosophyFeedbackNotes?: {
    id: string
    score: number
    comment: string
    philosophy_criterion: {
      code: 'vision' | 'mission' | 'purpose'
      label: string
      description?: string
      max_score: number
    }
  }[]
  sceneFeedbackNotes: {
    id: string
    score: number
    comment: string
    scene_criterion: {
      criterion_name: string
      criterion_description?: string
      max_score: number
    }
  }[]
  scene?: {
    id: string
    title: string
    description: string
  }
}

export default function ResultPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [philosophyPollAttempts, setPhilosophyPollAttempts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (id) {
      fetchResultData()
    }
  }, [id])

  // 軽いポーリングで理念評価が入ってきたら追従更新（最大6回=約30秒）
  useEffect(() => {
    if (!data?.evaluation?.id) return
    if ((data.philosophyFeedbackNotes?.length || 0) > 0) return
    if (philosophyPollAttempts >= 6) return

    const timer = setTimeout(async () => {
      try {
        const { data: philosophyNotes } = await supabase
          .from('philosophy_feedback_notes')
          .select(`
            id, score, comment,
            philosophy_evaluation_criteria (code, label, description, max_score)
          `)
          .eq('evaluation_id', data.evaluation.id)

        if (philosophyNotes && philosophyNotes.length > 0) {
          setData(prev => prev ? {
            ...prev,
            philosophyFeedbackNotes: philosophyNotes.map((p: any) => ({
              ...p,
              philosophy_criterion: {
                code: (p.philosophy_evaluation_criteria as any)?.code,
                label: (p.philosophy_evaluation_criteria as any)?.label,
                description: (p.philosophy_evaluation_criteria as any)?.description,
                max_score: (p.philosophy_evaluation_criteria as any)?.max_score
              }
            }))
          } : prev)
        }
      } finally {
        setPhilosophyPollAttempts(n => n + 1)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [data?.evaluation?.id, data?.philosophyFeedbackNotes?.length, philosophyPollAttempts, supabase])

  const fetchResultData = async () => {
    try {
      console.log('Fetching recording data for ID:', id)
      
      // Fetch recording with scenario
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          transcript,
          situation_id,
          scenarios (title, description)
        `)
        .eq('id', id)
        .single()

      if (recordingError) {
        console.error('Recording fetch error:', recordingError)
        console.error('Recording error details:', {
          code: recordingError.code,
          message: recordingError.message,
          details: recordingError.details,
          hint: recordingError.hint
        })
        throw recordingError
      }
      
      console.log('Recording data fetched successfully:', recording)

      // Fetch evaluation
      console.log('Fetching evaluation for recording ID:', id)
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .select('id, total_score, summary_comment')
        .eq('recording_id', id)
        .single()

      if (evalError) {
        console.error('Evaluation fetch error:', evalError)
        console.error('Evaluation error details:', {
          code: evalError.code,
          message: evalError.message,
          details: evalError.details,
          hint: evalError.hint
        })
        throw evalError
      }
      
      console.log('Evaluation data fetched successfully:', evaluation)

      // Fetch feedback notes with criteria
      console.log('Fetching feedback notes for evaluation ID:', evaluation.id)
      const { data: feedbackNotes, error: feedbackError } = await supabase
        .from('feedback_notes')
        .select(`
          id,
          score,
          comment,
          evaluation_criteria (label, description, max_score)
        `)
        .eq('evaluation_id', evaluation.id)

      if (feedbackError) {
        console.error('Feedback notes fetch error:', feedbackError)
        console.error('Feedback error details:', {
          code: feedbackError.code,
          message: feedbackError.message,
          details: feedbackError.details,
          hint: feedbackError.hint
        })
        throw feedbackError
      }
      
      console.log('Feedback notes fetched successfully:', feedbackNotes)

      // Fetch scene feedback notes
      // Fetch philosophy feedback notes
      const { data: philosophyNotes, error: philosophyError } = await supabase
        .from('philosophy_feedback_notes')
        .select(`
          id,
          score,
          comment,
          philosophy_evaluation_criteria (code, label, description, max_score)
        `)
        .eq('evaluation_id', evaluation.id)

      if (philosophyError) {
        console.error('Philosophy feedback notes fetch error:', philosophyError)
      }
      console.log('=== Fetching scene feedback notes ===')
      console.log('Evaluation ID:', evaluation.id)

      let sceneFeedbackNotes: any[] = []
      try {
        const { data: sceneFeedbackData, error: sceneFeedbackError } = await supabase
          .from('scene_feedback_notes')
          .select(`
            id,
            score,
            comment,
            scene_evaluation_criteria (criterion_name, criterion_description, max_score)
          `)
          .eq('evaluation_id', evaluation.id)

        if (sceneFeedbackError) {
          console.error('Scene feedback notes fetch error:', sceneFeedbackError)
          console.error('Scene feedback error details:', {
            code: sceneFeedbackError.code,
            message: sceneFeedbackError.message,
            details: sceneFeedbackError.details,
            hint: sceneFeedbackError.hint
          })
          // エラーが発生しても処理を続行（テーブルが存在しない可能性）
          console.log('Scene feedback notes table might not exist, continuing with empty array')
        } else {
          sceneFeedbackNotes = sceneFeedbackData || []
          console.log('Scene feedback notes fetched successfully:', sceneFeedbackNotes)
          console.log('Scene feedback notes count:', sceneFeedbackNotes.length)
          

        }
      } catch (error) {
        console.error('Scene feedback notes fetch failed:', error)
        // エラーが発生しても処理を続行
        sceneFeedbackNotes = []
      }
      
      console.log('Final scene feedback notes for UI:', sceneFeedbackNotes)

      // Fetch the specific scene for this result
      const { data: scene, error: sceneError } = await supabase
        .from('scenes')
        .select('id, title, description')
        .eq('id', recording.situation_id)
        .single()

      if (sceneError) {
        console.error('Scene fetch error:', sceneError)
        console.error('Scene error details:', {
          code: sceneError.code,
          message: sceneError.message,
          details: sceneError.details,
          hint: sceneError.hint
        })
        throw sceneError
      }
      
      console.log('Scene data fetched successfully:', scene)

      setData({
        recording: {
          ...recording,
          scenario: { title: (recording.scenarios as any)?.title || 'シナリオなし', description: (recording.scenarios as any)?.description || '' }
        },
        evaluation,
        feedbackNotes: feedbackNotes.map(fn => ({
          ...fn,
          criterion: { 
            label: (fn.evaluation_criteria as any)?.label || '', 
            description: (fn.evaluation_criteria as any)?.description || '', 
            max_score: (fn.evaluation_criteria as any)?.max_score || 0,
            type: 'basic' // 一時的にすべてbasicとして扱う
          }
        })),
        sceneFeedbackNotes: sceneFeedbackNotes.map(sFn => ({
          ...sFn,
          scene_criterion: {
            criterion_name: (sFn.scene_evaluation_criteria as any)?.criterion_name || '',
            criterion_description: (sFn.scene_evaluation_criteria as any)?.criterion_description || '',
            max_score: (sFn.scene_evaluation_criteria as any)?.max_score || 0
          }
        })),
        scene: scene
        ,
        philosophyFeedbackNotes: (philosophyNotes || []).map((p: any) => ({
          ...p,
          philosophy_criterion: {
            code: (p.philosophy_evaluation_criteria as any)?.code,
            label: (p.philosophy_evaluation_criteria as any)?.label,
            description: (p.philosophy_evaluation_criteria as any)?.description,
            max_score: (p.philosophy_evaluation_criteria as any)?.max_score
          }
        }))
      })
    } catch (error) {
      console.error('Error fetching result data:', error)
      // より詳細なエラー情報を表示
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-indigo-400'
    if (percentage >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBackgroundColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'bg-indigo-100 border-indigo-200'
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  // 基本評価とシーン評価を分離
  const basicEvaluations = data?.feedbackNotes || []
  const sceneEvaluations = data?.sceneFeedbackNotes || []
  
  // レーダーチャート用データ
  const basicChartData = basicEvaluations.map(note => ({
    label: note.criterion.label,
    score: note.score,
    maxScore: note.criterion.max_score,
  }))

  const sceneChartData = sceneEvaluations.map(note => ({
    label: note.scene_criterion.criterion_name,
    score: note.score,
    maxScore: note.scene_criterion.max_score,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="container mx-auto p-6 max-w-[1400px]">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 mt-4">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="container mx-auto p-6 max-w-[1400px]">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-50 mb-2">データが見つかりませんでした</h2>
            <p className="text-slate-400 mb-6">
              指定されたID（{id}）の評価データが存在しません。<br />
              ダッシュボードから正しい結果ページにアクセスしてください。
            </p>
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                ダッシュボードに戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="container mx-auto px-6 py-8 max-w-[1400px]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">評価結果</h1>
            <p className="text-slate-400 mt-1">
              {data.recording.scenario.title} • {format(new Date(data.recording.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ダッシュボードへ
              </Button>
            </Link>
            <Link href="/record">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                もう一度録音
              </Button>
            </Link>
          </div>
        </div>

        {/* 総合スコアとダウンロードボタン */}
        <Card className="bg-[#1E293B] border-[#334155] text-slate-50 mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <div>
                  <span className="text-6xl font-bold text-[#7C4DFF]">
                    {data.evaluation.total_score}
                  </span>
                  <span className="text-2xl text-slate-400 ml-2">/ 100点</span>
                </div>
                <div className="w-32 bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-[#7C4DFF] h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${data.evaluation.total_score}%` }}
                  />
                </div>
              </div>
              <ReportDownload data={data} />
            </div>
            <div className="mt-4 bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-slate-200">総評</h3>
              <p className="text-slate-100 whitespace-pre-wrap">{data.evaluation.summary_comment}</p>
            </div>
          </CardContent>
        </Card>

        {/* 上部3分割：理念・基本・シーン特有評価 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" style={{ height: '600px' }}>
          {/* 理念評価（左上） */}
          <Card className="bg-[#1E293B] border-[#334155] text-slate-50 overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 inline-flex items-center justify-center text-slate-300">🏳️‍🌈</span>
                <div>
                  <CardTitle className="text-slate-50 text-lg">理念評価（V/M/P）</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    企業理念の実践度（5点満点×3項目）
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <div className="overflow-y-auto h-[calc(100%-120px)] p-6 space-y-4">
                {(() => {
                  const vmps = ['vision','mission','purpose'] as const
                  const existing = new Map((data.philosophyFeedbackNotes||[]).map(n => [n.philosophy_criterion.code, n]))
                  const rows = vmps.map(code => existing.get(code) || ({
                    id: `placeholder-${code}`,
                    score: 1,
                    comment: '評価を待機中です…',
                    philosophy_criterion: {
                      code,
                      label: code === 'vision' ? 'ビジョン' : code === 'mission' ? 'ミッション' : 'パーパス',
                      description: '',
                      max_score: 5,
                    }
                  } as any))
                  return rows
                })().map((note, index) => (
                  <div
                    key={note.id}
                    className="group p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all duration-300 border border-slate-600/50 hover:border-[#7C4DFF]/30 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-wide text-slate-300 bg-slate-600/50 px-2 py-0.5 rounded">
                          {note.philosophy_criterion.code}
                        </span>
                        <h4 className="font-semibold text-slate-50">{note.philosophy_criterion.label}</h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                        note.score >= 4 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        note.score >= 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {note.score} / {note.philosophy_criterion.max_score}
                      </div>
                    </div>
                    {note.philosophy_criterion.description && (
                      <p className="text-xs text-slate-400 mb-3">{note.philosophy_criterion.description}</p>
                    )}
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                      <p className="text-sm text-slate-300">{note.comment}</p>
                    </div>
                  </div>
                ))}
                {(!data.philosophyFeedbackNotes || data.philosophyFeedbackNotes.length === 0) && (
                  <div className="text-slate-400 text-sm">理念評価データがありません</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 基本評価（中央上） */}
          <Card className="bg-[#1E293B] border-[#334155] text-slate-50 overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-slate-300" />
                <div>
                  <CardTitle className="text-slate-50 text-lg">基本評価</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    接客における基本的なスキル評価
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <div className="overflow-y-auto h-[calc(100%-120px)] p-6 space-y-4">
                {basicEvaluations.map((note, index) => {
                  const icons = ['🗣️', '🤝', '💡', '🛠️', '🎯'];
                  return (
                    <div 
                      key={note.id} 
                      className="group p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all duration-300 border border-slate-600/50 hover:border-[#7C4DFF]/30 animate-fade-in-up"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{icons[index] || '⭐'}</span>
                          <h4 className="font-semibold text-slate-50">{note.criterion.label}</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                          note.score >= 4 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          note.score >= 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {note.score} / {note.criterion.max_score}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{note.criterion.description}</p>
                      <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-300">{note.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* シーン特有評価（右上） */}
          <Card className="bg-[#1E293B] border-[#334155] text-slate-50 overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-slate-300" />
                <div>
                  <CardTitle className="text-slate-50 text-lg">
                    {data.scene?.title || 'シーン'}特有評価
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    {data.scene?.description || 'このシーン独自の評価観点'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full">
              {sceneEvaluations.length > 0 ? (
                <div className="overflow-y-auto h-[calc(100%-120px)] p-6 space-y-4">
                  {sceneEvaluations.map((note, index) => (
                    <div 
                      key={note.id} 
                      className="group p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all duration-300 border border-slate-600/50 hover:border-[#F59E0B]/30 animate-fade-in-up"
                      style={{ 
                        animationDelay: `${(index + basicEvaluations.length) * 100}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">⭐</span>
                          <h4 className="font-semibold text-slate-50">{note.scene_criterion.criterion_name}</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                          note.score >= 4 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          note.score >= 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {note.score} / {note.scene_criterion.max_score}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{note.scene_criterion.criterion_description}</p>
                      <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-300">{note.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[calc(100%-120px)] text-slate-400">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📝</span>
                    <p>シーン特有の評価項目がありません</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 下部3分割：振り返りチャット、基本スキル分析、シーン特有スキル分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" style={{ height: '460px' }}>
          {/* 振り返りチャット（左下） */}
          <div className="h-full">
            <ReflectionChat 
              evaluationId={data.evaluation.id}
              evaluationContext={{
                totalScore: data.evaluation.total_score,
                summaryComment: data.evaluation.summary_comment,
                criteriaScores: data.feedbackNotes.map(note => ({
                  label: note.criterion.label,
                  score: note.score,
                  maxScore: note.criterion.max_score,
                  comment: note.comment
                }))
              }}
            />
          </div>

          {/* 基本スキル分析チャート（中央下） */}
          <div className="h-full">
            <CoreSkillsChart data={basicChartData} />
          </div>

          {/* シーン特有スキル分析チャート（右下） */}
          <div className="h-full">
            <SceneSkillsChart data={sceneChartData} sceneTitle={data.scene?.title} />
          </div>
        </div>

        {/* モバイル用：振り返りチャットが最上段、その下に2分割 */}
        <div className="lg:hidden space-y-4 mb-6">
          {/* 振り返りチャット（最上段） */}
          <div className="h-80">
            <ReflectionChat 
              evaluationId={data.evaluation.id}
              evaluationContext={{
                totalScore: data.evaluation.total_score,
                summaryComment: data.evaluation.summary_comment,
                criteriaScores: data.feedbackNotes.map(note => ({
                  label: note.criterion.label,
                  score: note.score,
                  maxScore: note.criterion.max_score,
                  comment: note.comment
                }))
              }}
            />
          </div>

          {/* スキル分析チャート（2分割） */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-80">
              <CoreSkillsChart data={basicChartData} />
            </div>
            <div className="h-80">
              <SceneSkillsChart data={sceneChartData} sceneTitle={data.scene?.title} />
            </div>
          </div>
        </div>

        {/* 文字起こし（折りたたみ可能） */}
        <Card className="bg-slate-800 border-slate-700 text-slate-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-50">録音内容（文字起こし）</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-slate-400 hover:text-slate-200"
              >
                {showTranscript ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    隠す
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    表示
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              <div className="bg-slate-700 p-4 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-slate-100 whitespace-pre-wrap text-sm leading-relaxed">
                  {data.recording.transcript}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}