'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Users, Target, TrendingUp, Star, Clock, MessageSquare, ShoppingBag, UserCheck } from 'lucide-react'

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

  // シーンをカテゴリ別に分類
  const categorizeScenes = () => {
    const categories = {
      basic: scenes.filter(scene => scene.id.includes('001') || scene.id.includes('002') || scene.id.includes('003')),
      advanced: scenes.filter(scene => scene.id.includes('004') || scene.id.includes('005') || scene.id.includes('006')),
      special: scenes.filter(scene => scene.id.includes('007') || scene.id.includes('008') || scene.id.includes('009'))
    }
    return categories
  }

  // カラーバリエーション戦略: 列ごとに異なるアクセント色
  const getCardAccentColor = (index: number) => {
    const column = index % 3
    switch (column) {
      case 0: return 'indigo' // 1列目: Indigo基調（接客の基本対応）
      case 1: return 'cyan'   // 2列目: Cyanアクセント（柔らかい場面）
      case 2: return 'amber'  // 3列目: Amber系（ネガティブ/重要なシーン）
      default: return 'indigo'
    }
  }

  const getAccentClasses = (accentColor: string) => {
    const classes = {
      indigo: {
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-500',
        hoverText: 'group-hover:text-indigo-400'
      },
      cyan: {
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
        buttonBg: 'bg-cyan-600 hover:bg-cyan-500',
        hoverText: 'group-hover:text-cyan-400'
      },
      amber: {
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        buttonBg: 'bg-amber-600 hover:bg-amber-500',
        hoverText: 'group-hover:text-amber-400'
      }
    }
    return classes[accentColor as keyof typeof classes] || classes.indigo
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">シーンを読み込み中...</p>
        </div>
      </div>
    )
  }

  const categories = categorizeScenes()

  return (
    <div className="min-h-screen bg-[#0E1117]">
      <div className="w-full px-8 py-12">
        {/* ページタイトル */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎯 Training Scenes Dashboard
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            Practice realistic customer interaction scenarios and receive feedback tailored to each situation.
          </p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Available Scenes</p>
                <p className="text-3xl font-bold text-white">{scenes.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Scene Categories</p>
                <p className="text-3xl font-bold text-white">3 Types</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 p-8 rounded-3xl shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">AI Evaluation</p>
                <p className="text-3xl font-bold text-white">GPT + Whisper</p>
              </div>
            </div>
          </Card>
        </div>

        {/* セクション1: Basic Customer Service Scenes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center">
            <UserCheck className="w-6 h-6 mr-3 text-[#6366F1]" />
            📂 Basic Customer Service Scenes
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Essential scenarios for everyday customer interactions and first-time visitors.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.basic.map((scene, index) => {
              const accentColor = getCardAccentColor(index)
              const accentClasses = getAccentClasses(accentColor)
              
              return (
                <Card 
                  key={scene.id} 
                  className="min-h-[200px] p-6 bg-gradient-to-br from-[#1A1B26] to-[#1F2937] border-0 rounded-2xl shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-[#6366F1]/20 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${accentClasses.iconBg} rounded-2xl flex items-center justify-center`}>
                        <span className="text-xl">{scene.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold text-white ${accentClasses.hoverText} transition-colors duration-200`}>
                          {scene.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {scene.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStartRoleplay(scene.id)}
                    className={`mt-6 w-full text-sm ${accentClasses.buttonBg} text-white border-0 transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl py-3`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Roleplay
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>

        {/* セクション2: Advanced Interaction Scenes */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-slate-300 mt-10 mb-4 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-cyan-400" />
            📂 Advanced Interaction Scenes
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Complex scenarios requiring advanced communication skills and problem-solving.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {categories.advanced.map((scene, index) => {
              const accentColor = getCardAccentColor(index + 3)
              const accentClasses = getAccentClasses(accentColor)
              
              return (
                <Card 
                  key={scene.id} 
                  className="min-h-[180px] p-5 bg-slate-800 rounded-lg shadow hover:shadow-md flex flex-col justify-between transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${accentClasses.iconBg} rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{scene.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-base font-semibold text-white ${accentClasses.hoverText} transition-colors duration-200`}>
                          {scene.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-snug">
                      {scene.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStartRoleplay(scene.id)}
                    className={`mt-4 w-full text-sm ${accentClasses.buttonBg} text-white border-0 transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Roleplay
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>

        {/* セクション3: Special Situation Scenes */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-slate-300 mt-10 mb-4 flex items-center">
            <ShoppingBag className="w-4 h-4 mr-2 text-amber-400" />
            📂 Special Situation Scenes
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Challenging scenarios for handling difficult customers and special requests.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {categories.special.map((scene, index) => {
              const accentColor = getCardAccentColor(index + 6)
              const accentClasses = getAccentClasses(accentColor)
              
              return (
                <Card 
                  key={scene.id} 
                  className="min-h-[180px] p-5 bg-slate-800 rounded-lg shadow hover:shadow-md flex flex-col justify-between transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${accentClasses.iconBg} rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{scene.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-base font-semibold text-white ${accentClasses.hoverText} transition-colors duration-200`}>
                          {scene.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-snug">
                      {scene.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStartRoleplay(scene.id)}
                    className={`mt-4 w-full text-sm ${accentClasses.buttonBg} text-white border-0 transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Roleplay
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer説明 */}
        <div className="mt-12 text-center">
          <div className="bg-slate-800/50 border-0 shadow-lg rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-slate-50 mb-2 flex items-center justify-center">
              <Star className="w-5 h-5 mr-2 text-amber-400" />
              Scene-Specific AI Evaluation
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Each scene is evaluated based on context-specific AI criteria and tailored feedback.
              Practice scenarios that match your learning goals and receive personalized guidance.
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            ⚠️ Each scene is evaluated based on context-specific AI criteria and tailored feedback.
          </p>
        </div>
      </div>
    </div>
  )
} 