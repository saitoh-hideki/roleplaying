'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, User } from 'lucide-react'

interface ReflectionMessage {
  id: string
  user_comment: string
  ai_reply: string
  created_at: string
}

interface ReflectionChatProps {
  evaluationId: string
  evaluationContext?: {
    totalScore: number
    summaryComment: string
    criteriaScores: Array<{
      label: string
      score: number
      maxScore: number
      comment: string
    }>
  }
}

export function ReflectionChat({ evaluationId, evaluationContext }: ReflectionChatProps) {
  const [messages, setMessages] = useState<ReflectionMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [evaluationId])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_reflections')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const callReflectionChatAPI = async (userComment: string): Promise<string> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reflection-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        evaluationId,
        userComment,
        evaluationContext
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'API呼び出しに失敗しました')
    }

    const result = await response.json()
    return result.aiReply
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    setIsLoading(true)
    try {
      const aiReply = await callReflectionChatAPI(inputValue)
      
      const { data, error } = await supabase
        .from('feedback_reflections')
        .insert({
          evaluation_id: evaluationId,
          user_comment: inputValue,
          ai_reply: aiReply
        })
        .select()
        .single()

      if (error) throw error
      
      setMessages(prev => [...prev, data])
      setInputValue('')
    } catch (error) {
      console.error('Error sending message:', error)
      // エラーが発生した場合のフォールバック応答
      const fallbackResponse = "申し訳ございません。現在システムに問題が発生しています。しばらく時間をおいてから再度お試しください。"
      
      const { data, error: insertError } = await supabase
        .from('feedback_reflections')
        .insert({
          evaluation_id: evaluationId,
          user_comment: inputValue,
          ai_reply: fallbackResponse
        })
        .select()
        .single()

      if (!insertError) {
        setMessages(prev => [...prev, data])
        setInputValue('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700 text-slate-50">
      <CardHeader>
        <CardTitle className="text-slate-50 flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-400" />
          振り返りチャット
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* メッセージ表示エリア */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-slate-400 py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                <p>振り返りを始めてみましょう</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* ユーザーメッセージ */}
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-600 p-2 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-slate-700 p-3 rounded-lg flex-1">
                    <p className="text-slate-100 text-sm">{message.user_comment}</p>
                  </div>
                </div>
                
                {/* AIメッセージ */}
                <div className="flex items-start gap-2">
                  <div className="bg-slate-600 p-2 rounded-full">
                    <Bot className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="bg-slate-700 p-3 rounded-lg flex-1">
                    <p className="text-slate-100 text-sm">{message.ai_reply}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-600 p-2 rounded-full">
                  <Bot className="h-4 w-4 text-slate-300" />
                </div>
                <div className="bg-slate-700 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 入力フォーム */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="感想や改善点を入力してください..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={300}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 