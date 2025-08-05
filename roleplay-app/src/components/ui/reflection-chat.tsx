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
  initialComment?: string
}

export function ReflectionChat({ evaluationId, initialComment }: ReflectionChatProps) {
  const [messages, setMessages] = useState<ReflectionMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [evaluationId])

  useEffect(() => {
    if (!isInitialized && initialComment) {
      handleInitialComment()
    }
  }, [initialComment, isInitialized])

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

  const handleInitialComment = async () => {
    if (!initialComment) return
    
    setIsLoading(true)
    try {
      const aiReply = await generateAIResponse(initialComment)
      
      const { data, error } = await supabase
        .from('feedback_reflections')
        .insert({
          evaluation_id: evaluationId,
          user_comment: initialComment,
          ai_reply: aiReply
        })
        .select()
        .single()

      if (error) throw error
      
      setMessages([data])
      setIsInitialized(true)
    } catch (error) {
      console.error('Error saving initial comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIResponse = async (userComment: string): Promise<string> => {
    // 実際の実装では、Supabase Edge FunctionやOpenAI APIを呼び出す
    // ここでは簡易的な応答を返す
    const responses = [
      "素晴らしい振り返りですね！その意識で次回も頑張ってください。",
      "とても良い気づきです。継続的に改善していきましょう。",
      "その視点は重要です。実践を通じてさらに磨いていってください。",
      "具体的な改善点を意識されているのは素晴らしいです。",
      "その姿勢で接客スキルが向上していきますよ。"
    ]
    
    // 簡易的な応答生成（実際はGPT APIを使用）
    const randomIndex = Math.floor(Math.random() * responses.length)
    return responses[randomIndex]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    setIsLoading(true)
    try {
      const aiReply = await generateAIResponse(inputValue)
      
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