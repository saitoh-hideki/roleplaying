'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
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
  scene_icon?: string
  summary_comment?: string
}

interface RecentRecordingsProps {
  className?: string
}

export const RecentRecordings = forwardRef<{ refresh: () => void }, RecentRecordingsProps>(
  ({ className }, ref) => {
    const [recordings, setRecordings] = useState<Recording[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const fetchRecentRecordings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('recordings')
          .select(`
            id,
            created_at,
            situation_id,
            scenes(title, icon),
            evaluations(total_score, summary_comment)
          `)
          .order('created_at', { ascending: false })
          .limit(7)

        if (error) throw error

        const formattedRecordings = data?.map(recording => ({
          id: recording.id,
          scenario_title: (recording.scenes as any)?.title || 'Unknown',
          created_at: recording.created_at,
          score: (recording.evaluations as any)?.[0]?.total_score,
          evaluated: !!(recording.evaluations as any)?.[0],
          scene_icon: (recording.scenes as any)?.icon,
          summary_comment: (recording.evaluations as any)?.[0]?.summary_comment,
        })) || []

        setRecordings(formattedRecordings)
      } catch (error) {
        console.error('Error fetching recent recordings:', error)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchRecentRecordings()
    }, [])

    useImperativeHandle(ref, () => ({
      refresh: fetchRecentRecordings
    }))

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
      <div className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 text-white ${className || ''}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-slate-300" />
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
            {recordings.map((recording) => {
              const score = recording.score ?? 0
              const scoreClass = score >= 80
                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                : score >= 60
                ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
              return (
                <Card
                  key={recording.id}
                  onClick={() => handleViewDetails(recording.id)}
                  className="group relative cursor-pointer bg-[#0f172a] border-[#334155] hover:bg-[#0f172a]/80 p-4 text-white transition-colors"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-[#1E293B] border border-[#334155] flex items-center justify-center text-base">
                        <span className="leading-none">{recording.scene_icon || '🎭'}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200 mb-1">
                          {recording.scenario_title}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(recording.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${recording.evaluated ? scoreClass : 'text-slate-400 border-slate-500 bg-transparent'}`}>
                        {recording.evaluated ? `${recording.score}点` : '未評価'}
                      </div>
                      <button
                        aria-label="Play"
                        className="p-2 rounded-md border border-[#334155] text-slate-300 hover:text-white hover:border-slate-400"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hover preview */}
                  {recording.summary_comment && (
                    <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="max-w-xs bg-[#1E293B] border border-[#334155] text-slate-200 text-xs p-3 rounded-lg shadow-xl">
                        <div className="font-semibold mb-1">評価サマリー</div>
                        <p className="line-clamp-3">
                          {recording.summary_comment}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

RecentRecordings.displayName = 'RecentRecordings' 