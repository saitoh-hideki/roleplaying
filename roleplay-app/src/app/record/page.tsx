'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Mic, MicOff, Play, Square, Settings, FileText, ChevronUp, ChevronDown } from 'lucide-react'

interface Scenario {
  id: string
  title: string
  description: string
}

export default function RecordPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [realtimeTranscript, setRealtimeTranscript] = useState<string>('')
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([])
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [showDrawer, setShowDrawer] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScenarios()
  }, [])

  const performRealtimeTranscription = useCallback(async () => {
    if (!isRecording || !realtimeEnabled) {
      return
    }

    if (chunksRef.current.length === 0) {
      return
    }

    try {
      const currentBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      
      if (currentBlob.size < 1024) {
        return
      }
      
      const fileName = `realtime_${Date.now()}.webm`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, currentBlob)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      const whisperResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/whisper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ audioUrl: publicUrl })
      })

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text()
        console.error('Realtime Whisper API error:', errorText)
        return
      }

      const { transcript: newTranscript } = await whisperResponse.json()
      
      if (newTranscript && newTranscript.trim()) {
        setTranscriptionHistory(prev => [...prev, newTranscript])
        setRealtimeTranscript(newTranscript)
      }

      await supabase.storage.from('recordings').remove([fileName])

    } catch (error) {
      console.error('Error in realtime transcription:', error)
    }
  }, [isRecording, realtimeEnabled, supabase])

  useEffect(() => {
    if (isRecording && realtimeEnabled) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      transcriptionIntervalRef.current = setInterval(() => {
        performRealtimeTranscription()
      }, 3000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current)
        transcriptionIntervalRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current)
      }
    }
  }, [isRecording, realtimeEnabled, performRealtimeTranscription])

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setScenarios(data || [])
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript('')
      setRealtimeTranscript('')
      setTranscriptionHistory([])
    } catch (error) {
      console.error('Error accessing microphone:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`マイクへのアクセスが拒否されました: ${errorMessage}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      const fileName = `temp_recording_${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      const whisperResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/whisper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ audioUrl: publicUrl })
      })

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text()
        console.error('Whisper API error:', errorText)
        throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorText}`)
      }

      const { transcript: whisperTranscript } = await whisperResponse.json()
      setTranscript(whisperTranscript)

      await supabase.storage.from('recordings').remove([fileName])

    } catch (error) {
      console.error('Error transcribing audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`文字起こし中にエラーが発生しました: ${errorMessage}`)
    } finally {
      setIsTranscribing(false)
    }
  }

  const processRecording = async () => {
    if (!audioBlob || !selectedScenario) return

    setIsProcessing(true)
    
    try {
      const fileName = `recording_${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          scenario_id: selectedScenario,
          audio_url: publicUrl
        })
        .select()
        .single()

      if (recordingError) throw recordingError

      const whisperResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/whisper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ audioUrl: publicUrl })
      })

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text()
        console.error('Whisper API error:', errorText)
        throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorText}`)
      }

      const { transcript } = await whisperResponse.json()

      await supabase
        .from('recordings')
        .update({ transcript })
        .eq('id', recording.id)

      const evaluateResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          recordingId: recording.id,
          transcript,
          scenarioId: selectedScenario
        })
      })

      if (!evaluateResponse.ok) {
        const errorText = await evaluateResponse.text()
        console.error('Evaluate API error:', errorText)
        throw new Error(`Evaluate API error: ${evaluateResponse.status} - ${errorText}`)
      }

      const { evaluationId } = await evaluateResponse.json()

      router.push(`/result/${recording.id}`)
    } catch (error) {
      console.error('Error processing recording:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`録音の処理中にエラーが発生しました: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">ロールプレイ録音</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">リアルタイム文字起こし</span>
                <Switch
                  checked={realtimeEnabled}
                  onCheckedChange={setRealtimeEnabled}
                  className="switch-saas"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 録音コントロール */}
          <div className="space-y-6">
            {/* シナリオ選択カード */}
            <Card className="card-saas">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span>シナリオ選択</span>
                </CardTitle>
                <CardDescription>練習したいシナリオを選択してください</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="シナリオを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map(scenario => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 録音コントロールカード */}
            <Card className="card-saas">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-slate-600" />
                  <span>録音コントロール</span>
                </CardTitle>
                <CardDescription>
                  {selectedScenario ? '準備ができたら録音を開始してください' : 'まずシナリオを選択してください'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                {/* 録音タイマー */}
                <div className="text-5xl font-mono font-bold text-slate-700 bg-gray-50 px-8 py-4 rounded-xl">
                  {formatTime(recordingTime)}
                </div>

                {/* 録音ボタン */}
                {!isRecording ? (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={!selectedScenario || isProcessing}
                    className="w-32 h-32 rounded-full bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Mic className="h-12 w-12" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    variant="destructive"
                    className="w-32 h-32 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
                  >
                    <MicOff className="h-12 w-12" />
                  </Button>
                )}

                {/* ステータステキスト */}
                <p className="text-lg text-gray-600 font-medium">
                  {isRecording ? '録音中...' : audioBlob ? '録音完了' : '録音を開始するにはボタンを押してください'}
                </p>

                {/* 文字起こしボタン（非リアルタイム時のみ表示） */}
                {audioBlob && !isRecording && !transcript && !realtimeEnabled && (
                  <Button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="w-full max-w-xs btn-saas-primary"
                  >
                    {isTranscribing ? '文字起こし中...' : '文字起こし'}
                  </Button>
                )}

                {/* 評価開始ボタン */}
                {audioBlob && !isRecording && (
                  <Button
                    onClick={processRecording}
                    disabled={isProcessing || !selectedScenario}
                    className="w-full max-w-xs btn-saas-primary"
                  >
                    {isProcessing ? '評価中...' : '評価開始'}
                  </Button>
                )}

                {/* 非リアルタイム時の文字起こし結果表示 */}
                {transcript && !realtimeEnabled && (
                  <div className="w-full">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">文字起こし完了</span>
                      </div>
                      <p className="text-sm text-green-700">
                        右側のエリアに文字起こし結果が表示されています
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右側: リアルタイム文字起こし */}
          <div>
            <Card className="card-saas h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span>
                    {realtimeEnabled ? 'リアルタイム文字起こし' : (transcript ? '文字起こし結果' : '文字起こし結果')}
                  </span>
                </CardTitle>
                <CardDescription>
                  {realtimeEnabled 
                    ? (isRecording ? '録音中にリアルタイムで文字起こしが表示されます' : '録音を開始すると文字起こしが開始されます')
                    : (transcript ? '文字起こし結果が表示されています' : '録音完了後に文字起こし結果が表示されます')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {realtimeEnabled ? (
                    realtimeTranscript ? (
                      <div className="space-y-4">
                        {/* リアルタイム文字起こしの表示 */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">最新の文字起こし結果</span>
                            {isRecording && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-500">録音中</span>
                              </div>
                            )}
                          </div>
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            {realtimeTranscript}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            更新時刻: {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {/* 文字起こし履歴（折りたたみ可能） */}
                        {transcriptionHistory.length > 1 && (
                          <details className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <summary className="p-3 cursor-pointer hover:bg-gray-50 rounded-xl flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                文字起こし履歴 ({transcriptionHistory.length}回)
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            </summary>
                            <div className="p-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                              {transcriptionHistory.map((text, index) => (
                                <div key={index} className="text-sm p-2 bg-gray-50 rounded-lg border-l-2 border-blue-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                      {Math.floor(index * 3)}秒目
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {text.length}文字
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{text}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        {isRecording ? (
                          <>
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-center">
                              <p className="font-medium">文字起こし中...</p>
                              <p className="text-sm">音声を認識しています</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <Mic className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium">録音を開始してください</p>
                              <p className="text-sm">リアルタイムで文字起こしが表示されます</p>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    transcript ? (
                      <div className="space-y-4">
                        {/* 非リアルタイム文字起こし結果の表示 */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">文字起こし結果</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">完了</span>
                            </div>
                          </div>
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                            {transcript}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            文字起こし完了時刻: {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">録音完了後に文字起こし</p>
                          <p className="text-sm">非リアルタイムモードです</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}