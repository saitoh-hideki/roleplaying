'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WaveformVisualizer } from '@/components/ui/waveform-visualizer'
import { RecentRecordings } from '@/components/ui/recent-recordings'
import { Mic, MicOff, Settings, FileText, Star, Play, Clock, TrendingUp } from 'lucide-react'

interface Scene {
  id: string
  title: string
  description: string
  edge_function: string
  icon: string
}

export default function RecordPage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [realtimeTranscript, setRealtimeTranscript] = useState<string>('')
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([])
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchScenes()
  }, [])

  // シーンが読み込まれた後にURLパラメータからシーンIDを取得して選択
  useEffect(() => {
    if (scenes.length > 0) {
      const situationId = searchParams.get('situation_id')
      if (situationId) {
        handleSceneSelection(situationId)
      }
    }
  }, [scenes, searchParams])

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
    }
  }

  const handleSceneSelection = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (scene) {
      setSelectedScene(scene)
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
      alert(`マイクへのアクセスに失敗しました: ${errorMessage}`)
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
    if (!audioBlob || !selectedScene) return

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
          situation_id: selectedScene.id,
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

      // シーン別の評価関数を呼び出す
      const evaluateFunction = selectedScene.edge_function
      const evaluateResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${evaluateFunction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          recordingId: recording.id,
          transcript,
          situationId: selectedScene.id
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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* ページタイトルと設定 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-50">🎙️ 接客ロープレ録音</h1>
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-400">リアルタイム文字起こし</span>
            <Switch
              checked={realtimeEnabled}
              onCheckedChange={setRealtimeEnabled}
              className="data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-600"
            />
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 左側: 録音コントロール */}
          <div className="space-y-6">
            {/* シーン選択カード */}
            <div className="bg-slate-800 text-slate-50 rounded-xl p-6 shadow-lg border border-slate-700">
              <div className="flex items-center space-x-2 mb-4">
                <Play className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">🎭 シーン選択</h2>
              </div>
              
              {/* 選択されたシーンの表示 */}
              {selectedScene && (
                <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{selectedScene.icon}</span>
                    <h3 className="font-semibold text-indigo-400">{selectedScene.title}</h3>
                  </div>
                  <p className="text-sm text-slate-300">{selectedScene.description}</p>
                </div>
              )}
              
              <p className="text-sm text-slate-400 mb-4">
                {selectedScene ? 'シーンが選択されています。録音を開始してください。' : '練習したいシーンを選択してください'}
              </p>
              
              <Select value={selectedScene?.id || ''} onValueChange={handleSceneSelection}>
                <SelectTrigger className="w-full border-2 border-slate-600 hover:border-indigo-400 focus:border-indigo-500 rounded-lg bg-slate-700 text-slate-50">
                  <SelectValue placeholder="シーンを選択してください" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {scenes.map(scene => (
                    <SelectItem key={scene.id} value={scene.id} className="text-slate-50 hover:bg-slate-600">
                      <div className="flex items-center space-x-2">
                        <span>{scene.icon}</span>
                        <span>{scene.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 録音コントロールカード */}
            <div className="bg-slate-800 text-slate-50 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col items-center space-y-6">
              
              {/* タイトル */}
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">🎙️ 録音コントロール</h2>
                <p className="text-sm text-slate-400">
                  {selectedScene ? '準備ができたら録音を開始してください' : 'まずシーンを選択してください'}
                </p>
              </div>
              
              {/* 録音タイマー */}
              <div className="text-4xl font-mono text-indigo-400 text-center bg-slate-700 px-6 py-4 rounded-xl border border-slate-600">
                {formatTime(recordingTime)}
              </div>

              {/* 録音ボタン */}
              <div className="flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!selectedScene || isProcessing}
                    className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-indigo-500 hover:bg-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Mic className="w-8 h-8 text-indigo-400" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-red-500 bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 animate-pulse"
                  >
                    <MicOff className="w-8 h-8 text-red-400" />
                  </button>
                )}
              </div>

              {/* 波形表示 */}
              <WaveformVisualizer isRecording={isRecording} className="w-full" />

              {/* ステータステキスト */}
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  {isRecording ? '録音中...' : audioBlob ? '録音完了' : '録音を開始するにはボタンを押してください'}
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col w-full space-y-3 pt-4">
                {/* 文字起こしボタン（非リアルタイム時のみ表示） */}
                {audioBlob && !isRecording && !transcript && !realtimeEnabled && (
                  <button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="w-full py-3 bg-slate-700 border-2 border-slate-600 hover:border-indigo-400 text-slate-300 hover:text-indigo-400 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranscribing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                        文字起こし中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FileText className="w-4 h-4 mr-2" />
                        文字起こし
                      </div>
                    )}
                  </button>
                )}

                {/* 評価開始ボタン */}
                {audioBlob && !isRecording && (
                  <button
                    onClick={processRecording}
                    disabled={isProcessing || !selectedScene}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        評価中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Star className="w-4 h-4 mr-2" />
                        評価開始
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 右側: リアルタイム文字起こし */}
          <div>
            <div className="bg-slate-800 text-slate-50 rounded-xl p-6 shadow-lg border border-slate-700 h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold">
                    {realtimeEnabled ? '📝 リアルタイム文字起こし' : '📝 文字起こし結果'}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {realtimeEnabled ? 'ON' : 'OFF'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${realtimeEnabled ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {realtimeEnabled 
                  ? (isRecording ? '録音中にリアルタイムで文字起こしが表示されます' : '録音を開始すると文字起こしが開始されます')
                  : (transcript ? '文字起こし結果が表示されています' : '録音完了後に文字起こし結果が表示されます')
                }
              </p>
              <div className="h-80 overflow-y-auto border border-slate-600 rounded-lg p-4 bg-slate-700">
                {realtimeEnabled ? (
                  realtimeTranscript ? (
                    <div className="space-y-4">
                      {/* リアルタイム文字起こしの表示 */}
                      <div className="bg-slate-600 rounded-xl p-4 shadow-sm border border-indigo-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">最新の文字起こし結果</span>
                          {isRecording && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-slate-400">録音中</span>
                            </div>
                          )}
                        </div>
                        <div className="text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-500 p-3 rounded-lg border-l-4 border-indigo-400">
                          {realtimeTranscript}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          更新時刻: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {/* 文字起こし履歴（折りたたみ可能） */}
                      {transcriptionHistory.length > 1 && (
                        <details className="bg-slate-600 rounded-xl shadow-sm border border-slate-500">
                          <summary className="p-3 cursor-pointer hover:bg-slate-500 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-200">
                              文字起こし履歴 ({transcriptionHistory.length}回)
                            </span>
                          </summary>
                          <div className="p-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                            {transcriptionHistory.map((text, index) => (
                              <div key={index} className="text-sm p-2 bg-slate-500 rounded-lg border-l-2 border-indigo-400">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-300 font-medium">
                                    {Math.floor(index * 3)}秒目
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {text.length}文字
                                  </span>
                                </div>
                                <p className="text-slate-100">{text}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      {isRecording ? (
                        <>
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <div className="text-center">
                            <p className="font-medium">文字起こし中...</p>
                            <p className="text-sm">音声を認識しています</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                            <Mic className="w-6 h-6 text-slate-400" />
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
                      <div className="bg-slate-600 rounded-xl p-4 shadow-sm border border-indigo-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">文字起こし結果</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-slate-400">完了</span>
                          </div>
                        </div>
                        <div className="text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-500 p-3 rounded-lg border-l-4 border-indigo-400">
                          {transcript}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          文字起こし完了時刻: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">録音完了後に文字起こし</p>
                        <p className="text-sm">非リアルタイムモードです</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 下部: 最新録音 */}
        <div className="grid grid-cols-1 gap-6">
          <RecentRecordings />
        </div>
      </div>
    </div>
  )
}