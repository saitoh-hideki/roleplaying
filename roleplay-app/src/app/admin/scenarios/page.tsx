'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Scenario, Manual } from '@/types/database'

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [manuals, setManuals] = useState<Manual[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    related_manual_id: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [scenariosResult, manualsResult] = await Promise.all([
        supabase.from('scenarios').select('*').order('created_at', { ascending: false }),
        supabase.from('manuals').select('*').order('title')
      ])

      if (!scenariosResult.error && scenariosResult.data) {
        setScenarios(scenariosResult.data)
      }
      if (!manualsResult.error && manualsResult.data) {
        setManuals(manualsResult.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('scenarios')
          .update({
            title: formData.title,
            description: formData.description,
            related_manual_id: formData.related_manual_id || null
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('scenarios')
          .insert({
            title: formData.title,
            description: formData.description,
            related_manual_id: formData.related_manual_id || null
          })

        if (error) throw error
      }

      setFormData({ title: '', description: '', related_manual_id: '' })
      setEditingId(null)
      fetchData()
    } catch (error) {
      console.error('Error saving scenario:', error)
      alert('保存中にエラーが発生しました')
    }
  }

  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id)
    setFormData({
      title: scenario.title,
      description: scenario.description,
      related_manual_id: scenario.related_manual_id || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting scenario:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ title: '', description: '', related_manual_id: '' })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">シナリオ管理</h1>

      {/* フォーム */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? 'シナリオ編集' : '新規シナリオ'}</CardTitle>
          <CardDescription>
            ロールプレイで使用するシナリオを管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">タイトル</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">関連マニュアル（任意）</label>
              <select
                value={formData.related_manual_id}
                onChange={(e) => setFormData({ ...formData, related_manual_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                {manuals.map(manual => (
                  <option key={manual.id} value={manual.id}>
                    {manual.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? '更新' : '追加'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  キャンセル
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* シナリオ一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>シナリオ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : scenarios.length > 0 ? (
            <div className="space-y-4">
              {scenarios.map(scenario => (
                <div key={scenario.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{scenario.title}</h3>
                      <p className="text-gray-600 mt-1">{scenario.description}</p>
                      {scenario.related_manual_id && (
                        <p className="text-sm text-gray-500 mt-2">
                          関連マニュアル: {manuals.find(m => m.id === scenario.related_manual_id)?.title}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(scenario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              まだシナリオがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}