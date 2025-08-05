'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart } from '@/components/ui/radar-chart'
import { ReflectionChat } from '@/components/ui/reflection-chat'
import { ReportDownload } from '@/components/ui/report-download'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface ResultData {
  recording: {
    id: string
    created_at: string
    transcript: string
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
    }
  }[]
}

export default function ResultPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (id) {
      fetchResultData()
    }
  }, [id])

  const fetchResultData = async () => {
    try {
      // Fetch recording with scenario
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          transcript,
          scenarios (title, description)
        `)
        .eq('id', id)
        .single()

      if (recordingError) throw recordingError

      // Fetch evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .select('id, total_score, summary_comment')
        .eq('recording_id', id)
        .single()

      if (evalError) throw evalError

      // Fetch feedback notes with criteria
      const { data: feedbackNotes, error: feedbackError } = await supabase
        .from('feedback_notes')
        .select(`
          id,
          score,
          comment,
          evaluation_criteria (label, description, max_score)
        `)
        .eq('evaluation_id', evaluation.id)

      if (feedbackError) throw feedbackError

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
            max_score: (fn.evaluation_criteria as any)?.max_score || 0 
          }
        }))
      })
    } catch (error) {
      console.error('Error fetching result data:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto p-6 max-w-7xl">
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
      <div className="min-h-screen bg-black">
        <div className="container mx-auto p-6 max-w-7xl">
          <p className="text-center text-slate-400">データが見つかりませんでした</p>
        </div>
      </div>
    )
  }

  // チャート用データの準備
  const chartData = data.feedbackNotes.map(note => ({
    label: note.criterion.label,
    score: note.score,
    maxScore: note.criterion.max_score
  }))

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
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
        <Card className="bg-slate-800 border-slate-700 text-slate-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-end gap-4">
                <div>
                  <span className="text-6xl font-bold text-indigo-400">
                    {data.evaluation.total_score}
                  </span>
                  <span className="text-2xl text-slate-400 ml-2">/ 100点</span>
                </div>
                <div className="w-32 bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-1000"
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

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 左カラム: 項目別評価 */}
          <Card className="bg-slate-800 border-slate-700 text-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-50">項目別評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.feedbackNotes.map((note) => (
                <div key={note.id} className={`p-4 rounded-lg border ${getScoreBackgroundColor(note.score, note.criterion.max_score)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-800">{note.criterion.label}</h4>
                    <span className={`text-lg font-bold ${getScoreColor(note.score, note.criterion.max_score)}`}>
                      {note.score} / {note.criterion.max_score}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{note.criterion.description}</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-slate-700">{note.comment}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 右カラム: レーダーチャート */}
          <Card className="bg-slate-800 border-slate-700 text-slate-50">
            <CardHeader>
              <CardTitle className="text-slate-50">評価チャート</CardTitle>
              <CardDescription className="text-slate-400">
                5つの評価項目を視覚化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* 振り返りチャット */}
        <div className="mb-6">
          <ReflectionChat 
            evaluationId={data.evaluation.id}
            initialComment="今回のロールプレイを振り返って、良かった点や改善したい点があれば教えてください。"
          />
        </div>

        {/* 文字起こし（折りたたみ可能） */}
        <Card className="bg-slate-800 border-slate-700 text-slate-50">
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