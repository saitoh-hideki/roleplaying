'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, User, MessageSquare } from 'lucide-react'

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
    <Card className="bg-[#1E293B] border-[#334155] text-slate-50 h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-slate-300" />
          <div>
            <CardTitle className="text-slate-50 text-base font-semibold">Reflection Chat</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Review and get AI feedback on your performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* メッセージ表示エリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-slate-400 py-6">
              <Bot className="h-6 w-6 mx-auto mb-2 text-slate-500" />
              <p className="text-sm">Start your reflection journey</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {/* ユーザーメッセージ */}
              <div className="flex items-start gap-2">
                <div className="bg-purple-600 p-1.5 rounded-full">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="bg-slate-700 p-2.5 rounded-lg flex-1">
                  <p className="text-slate-100 text-xs leading-relaxed">{message.user_comment}</p>
                </div>
              </div>
              
              {/* AIメッセージ */}
              <div className="flex items-start gap-2">
                <div className="bg-slate-600 p-1.5 rounded-full">
                  <Bot className="h-3 w-3 text-slate-300" />
                </div>
                <div className="bg-slate-700 p-2.5 rounded-lg flex-1">
                  <p className="text-slate-100 text-xs leading-relaxed">{message.ai_reply}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-slate-600 p-1.5 rounded-full">
                <Bot className="h-3 w-3 text-slate-300" />
              </div>
              <div className="bg-slate-700 p-2.5 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 入力フォーム - カード内下部に固定 */}
        <div className="p-4 border-t border-slate-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Share your thoughts or ask for improvement tips..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
              maxLength={300}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              <Send className="h-3 w-3" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 