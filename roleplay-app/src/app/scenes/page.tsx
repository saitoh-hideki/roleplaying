'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Users, Target, TrendingUp } from 'lucide-react'

interface Scene {
  id: string
  title: string
  description: string
  edge_function: string
  icon: string
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScenes()
  }, [])

  const fetchScenes = async () => {
    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setScenes(data || [])
    } catch (error) {
      console.error('Error fetching scenes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartRoleplay = (sceneId: string) => {
    router.push(`/record?situation_id=${sceneId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">シーンを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">🎭 シーンカテゴリーダッシュボード</h1>
          <p className="text-slate-400">接客の場面別にロールプレイを練習できます。各シーンに応じた評価で、より実践的なトレーニングが可能です。</p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">利用可能シーン</p>
                <p className="text-2xl font-bold text-slate-50">{scenes.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">場面別評価</p>
                <p className="text-2xl font-bold text-slate-50">9種類</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">AI評価</p>
                <p className="text-2xl font-bold text-slate-50">GPT + Whisper</p>
              </div>
            </div>
          </Card>
        </div>

        {/* シーングリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <Card key={scene.id} className="bg-slate-800 border-slate-700 hover:border-indigo-500/50 transition-all duration-300 group">
              <div className="p-6">
                {/* アイコンとタイトル */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="text-3xl">{scene.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-50 group-hover:text-indigo-400 transition-colors duration-200">
                      {scene.title}
                    </h3>
                  </div>
                </div>

                {/* 説明 */}
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {scene.description}
                </p>

                {/* CTAボタン */}
                <Button
                  onClick={() => handleStartRoleplay(scene.id)}
                  variant="secondary"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 group-hover:bg-indigo-700 transition-all duration-200"
                >
                  <Play className="w-4 h-4 mr-2" />
                  ロープレを始める
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* フッター情報 */}
        <div className="mt-12 text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-slate-50 mb-2">💡 シーン別評価の特徴</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              各シーンに応じて評価基準とAIプロンプトが最適化されています。
              より実践的で状況に適したフィードバックを受けることができます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 