'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, Star, Play, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Recording {
  id: string
  scenario_title: string
  created_at: string
  score?: number
  evaluated: boolean
}

interface RecentRecordingsProps {
  className?: string
}

export function RecentRecordings({ className }: RecentRecordingsProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchRecentRecordings()
  }, [])

  const fetchRecentRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          id,
          created_at,
          scenario_id,
          scenarios(title),
          evaluations(total_score)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const formattedRecordings = data?.map(recording => ({
        id: recording.id,
        scenario_title: (recording.scenarios as any)?.title || 'Unknown',
        created_at: recording.created_at,
        score: (recording.evaluations as any)?.[0]?.total_score,
        evaluated: !!(recording.evaluations as any)?.[0]
      })) || []

      setRecordings(formattedRecordings)
    } catch (error) {
      console.error('Error fetching recent recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetails = (recordingId: string) => {
    router.push(`/result/${recordingId}`)
  }

  const handleEvaluate = (recordingId: string) => {
    router.push(`/result/${recordingId}`)
  }

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 text-white ${className || ''}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">📂 最新の録音</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-slate-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-6 text-white ${className || ''}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold">📂 最新の録音</h3>
      </div>
      
      {recordings.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">まだ録音がありません</p>
          <p className="text-xs">録音を開始するとここに表示されます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((recording) => (
            <Card key={recording.id} className="bg-slate-700 border-slate-600 p-4 text-white hover:bg-slate-600 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">
                    📝 {recording.scenario_title}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(recording.created_at)}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  {recording.evaluated ? (
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border-indigo-400">
                      {recording.score}点
                    </div>
                  ) : (
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-400 border-slate-400">
                      未評価
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(recording.id)}
                      className="text-xs h-7 px-2 text-slate-300 hover:text-indigo-400"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      詳細
                    </Button>
                    {!recording.evaluated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEvaluate(recording.id)}
                        className="text-xs h-7 px-2 text-slate-300 hover:text-indigo-400"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        評価
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 