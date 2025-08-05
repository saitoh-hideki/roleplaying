'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

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
        .select('total_score, summary_comment')
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
          scenario: recording.scenarios
        },
        evaluation,
        feedbackNotes: feedbackNotes.map(fn => ({
          ...fn,
          criterion: fn.evaluation_criteria
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
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGaugeWidth = (score: number) => {
    return `${score}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <p className="text-center text-gray-500">データが見つかりませんでした</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">評価結果</h1>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ダッシュボードへ
            </Button>
          </Link>
          <Link href="/record">
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              もう一度録音
            </Button>
          </Link>
        </div>
      </div>

      {/* シナリオ情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{data.recording.scenario.title}</CardTitle>
          <CardDescription>
            {format(new Date(data.recording.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{data.recording.scenario.description}</p>
        </CardContent>
      </Card>

      {/* 総合スコア */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>総合評価</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bold text-blue-600">
                {data.evaluation.total_score}
              </span>
              <span className="text-2xl text-gray-500">/ 100点</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: getGaugeWidth(data.evaluation.total_score) }}
              />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">総評</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.evaluation.summary_comment}</p>
          </div>
        </CardContent>
      </Card>

      {/* 項目別評価 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>項目別評価</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.feedbackNotes.map((note) => (
            <div key={note.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{note.criterion.label}</h4>
                <span className={`text-lg font-bold ${getScoreColor(note.score, note.criterion.max_score)}`}>
                  {note.score} / {note.criterion.max_score}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{note.criterion.description}</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-700">{note.comment}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 文字起こし */}
      <Card>
        <CardHeader>
          <CardTitle>録音内容（文字起こし）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{data.recording.transcript}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}