'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, Star, Play, FileText, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScenarioRecording {
  id: string
  created_at: string
  score?: number
  evaluated: boolean
}

interface ScenarioHistoryProps {
  scenarioId: string | null
  className?: string
}

export function ScenarioHistory({ scenarioId, className }: ScenarioHistoryProps) {
  const [recordings, setRecordings] = useState<ScenarioRecording[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (scenarioId) {
      fetchScenarioHistory(scenarioId)
    } else {
      setRecordings([])
    }
  }, [scenarioId])

  const fetchScenarioHistory = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          id, 
          created_at,
          evaluations(total_score)
        `)
        .eq('scenario_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      const formattedRecordings = data?.map(recording => ({
        id: recording.id,
        created_at: recording.created_at,
        score: (recording.evaluations as any)?.[0]?.total_score,
        evaluated: !!(recording.evaluations as any)?.[0]
      })) || []
      
      setRecordings(formattedRecordings)
    } catch (error) {
      console.error('Error fetching scenario history:', error)
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

  if (!scenarioId) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 text-white ${className || ''}`}>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">🧾 シナリオ履歴</h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">シナリオを選択してください</p>
          <p className="text-xs">過去の録音履歴が表示されます</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 text-white ${className || ''}`}>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">🧾 シナリオ履歴</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-6 text-white ${className || ''}`}>
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold">🧾 シナリオ履歴</h3>
        <span className="text-sm text-slate-400">({recordings.length}件)</span>
      </div>
      
      {recordings.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">このシナリオの録音履歴がありません</p>
          <p className="text-xs">録音を開始するとここに表示されます</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordings.map((recording, index) => (
            <Card key={recording.id} className="bg-slate-700 border-slate-600 p-3 text-white hover:bg-slate-600 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-slate-400 w-6">#{index + 1}</div>
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(recording.created_at)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {recording.evaluated ? (
                    <div className="text-sm font-semibold text-indigo-400">
                      {recording.score}点
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">
                      未評価
                    </div>
                  )}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(recording.id)}
                      className="text-xs h-6 px-2 text-slate-300 hover:text-indigo-400"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    {!recording.evaluated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEvaluate(recording.id)}
                        className="text-xs h-6 px-2 text-slate-300 hover:text-indigo-400"
                      >
                        <Star className="w-3 h-3" />
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