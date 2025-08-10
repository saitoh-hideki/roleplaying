'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react'
import type { Scene, SceneEvaluationCriterion } from '@/types/database'
import { Switch } from '@/components/ui/switch'
import type { EvaluationCriterion } from '@/types/database'

interface FormData {
  id: string
  title: string
  description: string
  edge_function: string
  icon: string
  evaluation_criteria: {
    criterion_name: string
    criterion_description: string
    max_score: number
  }[]
  basic_criteria_enabled: boolean
}

export default function AdminScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [evaluationCriteria, setEvaluationCriteria] = useState<SceneEvaluationCriterion[]>([])
  const [basicCriteria, setBasicCriteria] = useState<EvaluationCriterion[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    id: '',
    title: '',
    description: '',
    edge_function: '',
    icon: '📋',
    evaluation_criteria: [{ criterion_name: '', criterion_description: '', max_score: 5 }],
    basic_criteria_enabled: true
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [scenesResult, criteriaResult, basicCriteriaResult] = await Promise.all([
        supabase.from('scenes').select('*').order('created_at', { ascending: false }),
        supabase.from('scene_evaluation_criteria').select('*').order('sort_order'),
        supabase.from('evaluation_criteria').select('*').eq('type', 'basic').order('created_at')
      ])

      if (!scenesResult.error && scenesResult.data) {
        setScenes(scenesResult.data)
      }
      if (!criteriaResult.error && criteriaResult.data) {
        setEvaluationCriteria(criteriaResult.data)
      }
      if (!basicCriteriaResult.error && basicCriteriaResult.data) {
        setBasicCriteria(basicCriteriaResult.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSceneId = () => {
    const existingIds = scenes.map(scene => scene.id)
    let counter = 1
    let newId = `scene_${counter.toString().padStart(3, '0')}`
    
    while (existingIds.includes(newId)) {
      counter++
      newId = `scene_${counter.toString().padStart(3, '0')}`
    }
    
    return newId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Update existing scene
        const { error: sceneError } = await supabase
          .from('scenes')
          .update({
            title: formData.title,
            description: formData.description,
            edge_function: formData.edge_function,
            icon: formData.icon
          })
          .eq('id', editingId)

        if (sceneError) throw sceneError

        // Delete existing criteria and insert new ones
        await supabase
          .from('scene_evaluation_criteria')
          .delete()
          .eq('scene_id', editingId)

        if (formData.evaluation_criteria.length > 0) {
          const criteriaToInsert = formData.evaluation_criteria
            .filter(c => c.criterion_name.trim() !== '')
            .map((criterion, index) => ({
              scene_id: editingId,
              criterion_name: criterion.criterion_name,
              criterion_description: criterion.criterion_description,
              max_score: criterion.max_score,
              sort_order: index + 1
            }))

          if (criteriaToInsert.length > 0) {
            const { error: criteriaError } = await supabase
              .from('scene_evaluation_criteria')
              .insert(criteriaToInsert)

            if (criteriaError) throw criteriaError
          }
        }
      } else {
        // Create new scene
        const newSceneId = formData.id || generateSceneId()
        
        const { error: sceneError } = await supabase
          .from('scenes')
          .insert({
            id: newSceneId,
            title: formData.title,
            description: formData.description,
            edge_function: formData.edge_function,
            icon: formData.icon
          })

        if (sceneError) throw sceneError

        // Insert evaluation criteria
        if (formData.evaluation_criteria.length > 0) {
          const criteriaToInsert = formData.evaluation_criteria
            .filter(c => c.criterion_name.trim() !== '')
            .map((criterion, index) => ({
              scene_id: newSceneId,
              criterion_name: criterion.criterion_name,
              criterion_description: criterion.criterion_description,
              max_score: criterion.max_score,
              sort_order: index + 1
            }))

          if (criteriaToInsert.length > 0) {
            const { error: criteriaError } = await supabase
              .from('scene_evaluation_criteria')
              .insert(criteriaToInsert)

            if (criteriaError) throw criteriaError
          }
        }
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving scene:', error)
      alert('保存中にエラーが発生しました')
    }
  }

  const handleEdit = (scene: Scene) => {
    const sceneCriteria = evaluationCriteria.filter(c => c.scene_id === scene.id)
    
    setEditingId(scene.id)
    setFormData({
      id: scene.id,
      title: scene.title,
      description: scene.description,
      edge_function: scene.edge_function,
      icon: scene.icon || '📋',
      evaluation_criteria: sceneCriteria.length > 0 
        ? sceneCriteria.map(c => ({
            criterion_name: c.criterion_name,
            criterion_description: c.criterion_description || '',
            max_score: c.max_score
          }))
        : [{ criterion_name: '', criterion_description: '', max_score: 5 }],
      basic_criteria_enabled: true
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting scene:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  const handleCancel = () => {
    resetForm()
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      id: '',
      title: '',
      description: '',
      edge_function: '',
      icon: '📋',
      evaluation_criteria: [{ criterion_name: '', criterion_description: '', max_score: 5 }],
      basic_criteria_enabled: true
    })
  }

  const addEvaluationCriterion = () => {
    // 上限を10項目に拡張
    if (formData.evaluation_criteria.length < 10) {
      setFormData({
        ...formData,
        evaluation_criteria: [
          ...formData.evaluation_criteria,
          { criterion_name: '', criterion_description: '', max_score: 5 }
        ]
      })
    }
  }

  const removeEvaluationCriterion = (index: number) => {
    if (formData.evaluation_criteria.length > 1) {
      setFormData({
        ...formData,
        evaluation_criteria: formData.evaluation_criteria.filter((_, i) => i !== index)
      })
    }
  }

  const updateEvaluationCriterion = (index: number, field: string, value: string | number) => {
    const updatedCriteria = [...formData.evaluation_criteria]
    updatedCriteria[index] = { ...updatedCriteria[index], [field]: value }
    setFormData({ ...formData, evaluation_criteria: updatedCriteria })
  }

  const getSceneCriteria = (sceneId: string) => {
    return evaluationCriteria.filter(c => c.scene_id === sceneId)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">シーン管理</h1>
            <p className="text-slate-400 mt-1">ロールプレイシーンの設定と評価基準の管理</p>
          </div>
        </div>

        {/* フォーム */}
        <Card className="bg-slate-800 border-slate-700 text-slate-50 mb-8">
          <CardHeader>
            <CardTitle className="text-slate-50">
              {editingId ? 'シーン編集' : '新規シーン作成'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-200">シーンID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="例: scene_010"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                    required
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-200">アイコン</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="例: 💻"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">シーンタイトル</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 初めての電話対応"
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">説明文</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="シーン状況詳細を入力してください"
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">GPT評価関数</label>
                <input
                  type="text"
                  value={formData.edge_function}
                  onChange={(e) => setFormData({ ...formData, edge_function: e.target.value })}
                  placeholder="例: evaluate_scene_010"
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* 基本評価項目の有効化設定 */}
              <div className="border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-200">基本評価項目</h3>
                    <p className="text-sm text-slate-400">すべてのシーン共通の評価観点</p>
                  </div>
                  <Switch
                    checked={formData.basic_criteria_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, basic_criteria_enabled: checked })}
                  />
                </div>
                {formData.basic_criteria_enabled && (
                  <div className="space-y-2">
                    {basicCriteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                        <span className="text-slate-200">{criterion.label}</span>
                        <span className="text-xs text-slate-400">基本項目</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* シーン特有評価項目 */}
              <div className="border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-200">シーン特有評価項目</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {formData.evaluation_criteria.length}/10 項目
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addEvaluationCriterion}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={formData.evaluation_criteria.length >= 10}
                  >
                    項目追加
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.evaluation_criteria.map((criterion, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-700 rounded">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-200">項目名</label>
                        <input
                          type="text"
                          value={criterion.criterion_name}
                          onChange={(e) => {
                            const newCriteria = [...formData.evaluation_criteria]
                            newCriteria[index].criterion_name = e.target.value
                            setFormData({ ...formData, evaluation_criteria: newCriteria })
                          }}
                          placeholder="例: 挨拶"
                          className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-600 text-slate-50 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-200">説明</label>
                        <input
                          type="text"
                          value={criterion.criterion_description}
                          onChange={(e) => {
                            const newCriteria = [...formData.evaluation_criteria]
                            newCriteria[index].criterion_description = e.target.value
                            setFormData({ ...formData, evaluation_criteria: newCriteria })
                          }}
                          placeholder="例: 適切な挨拶ができているか"
                          className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-600 text-slate-50 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1 text-slate-200">最大点</label>
                          <input
                            type="number"
                            value={criterion.max_score}
                            onChange={(e) => {
                              const newCriteria = [...formData.evaluation_criteria]
                              newCriteria[index].max_score = parseInt(e.target.value) || 5
                              setFormData({ ...formData, evaluation_criteria: newCriteria })
                            }}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-600 text-slate-50 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        {formData.evaluation_criteria.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeEvaluationCriterion(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {editingId ? '更新' : '作成'}
                </Button>
                {editingId && (
                  <Button type="button" onClick={handleCancel} className="bg-slate-600 hover:bg-slate-700 text-white">
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* シーン一覧 */}
        <div className="space-y-4">
          {scenes.map(scene => {
            const sceneCriteria = evaluationCriteria.filter(c => c.scene_id === scene.id)
            
            return (
              <Card key={scene.id} className="bg-slate-800 border-slate-700 text-slate-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{scene.icon}</span>
                      <h3 className="font-semibold text-lg text-slate-50">{scene.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(scene)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(scene.id)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3">{scene.description}</p>
                  
                  <div className="text-xs text-slate-400 mb-3">
                    <span className="font-medium">評価関数:</span> {scene.edge_function}
                  </div>

                  {/* 評価項目の表示 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">基本評価項目:</span>
                      <span className="text-xs text-slate-500">5項目</span>
                    </div>
                    {sceneCriteria.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">シーン特有項目:</span>
                        <span className="text-xs text-slate-500">{sceneCriteria.length}項目</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}