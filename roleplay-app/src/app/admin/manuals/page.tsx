'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Manual } from '@/types/database'

export default function AdminManualsPage() {
  const [manuals, setManuals] = useState<Manual[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchManuals()
  }, [])

  const fetchManuals = async () => {
    try {
      const { data, error } = await supabase
        .from('manuals')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setManuals(data)
      }
    } catch (error) {
      console.error('Error fetching manuals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('manuals')
          .update({
            title: formData.title,
            category: formData.category,
            content: formData.content
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('manuals')
          .insert({
            title: formData.title,
            category: formData.category,
            content: formData.content
          })

        if (error) throw error
      }

      setFormData({ title: '', category: '', content: '' })
      setEditingId(null)
      fetchManuals()
    } catch (error) {
      console.error('Error saving manual:', error)
      alert('保存中にエラーが発生しました')
    }
  }

  const handleEdit = (manual: Manual) => {
    setEditingId(manual.id)
    setFormData({
      title: manual.title,
      category: manual.category,
      content: manual.content
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('manuals')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchManuals()
    } catch (error) {
      console.error('Error deleting manual:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ title: '', category: '', content: '' })
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-50">マニュアル管理</h1>

        {/* フォーム */}
        <Card className="bg-slate-800 border-slate-700 text-slate-50 mb-8">
          <CardHeader>
            <CardTitle className="text-slate-50">{editingId ? 'マニュアル編集' : '新規マニュアル'}</CardTitle>
            <CardDescription className="text-slate-400">
              接客マニュアルを管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">タイトル</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">カテゴリ</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  placeholder="例: 初回対応、クレーム対応など"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-50 focus:border-indigo-500 focus:outline-none"
                  rows={6}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {editingId ? '更新' : '追加'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-50">
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* マニュアル一覧 */}
        <Card className="bg-slate-800 border-slate-700 text-slate-50">
          <CardHeader>
            <CardTitle className="text-slate-50">マニュアル一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 mt-4">読み込み中...</p>
              </div>
            ) : manuals.length > 0 ? (
              <div className="space-y-4">
                {manuals.map(manual => (
                  <div key={manual.id} className="border border-slate-600 p-4 rounded-lg bg-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-50">{manual.title}</h3>
                        <p className="text-sm text-slate-400">カテゴリ: {manual.category}</p>
                        <p className="text-slate-300 mt-2 whitespace-pre-wrap">
                          {manual.content.length > 200 
                            ? manual.content.substring(0, 200) + '...' 
                            : manual.content}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(manual)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(manual.id)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                まだマニュアルがありません
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}