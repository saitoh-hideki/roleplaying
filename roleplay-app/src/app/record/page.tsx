'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, MicOff, Play, Square } from 'lucide-react'

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
    console.log('performRealtimeTranscription called')
    console.log('isRecording:', isRecording)
    console.log('chunks length:', chunksRef.current.length)
    
    if (!isRecording) {
      console.log('Skipping realtime transcription: not recording')
      return
    }

    if (chunksRef.current.length === 0) {
      console.log('Skipping realtime transcription: no chunks available yet')
      return
    }

    try {
      console.log('Starting realtime transcription...')
      const currentBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      console.log('Current blob size:', currentBlob.size, 'bytes')
      
      // 最小サイズチェック（1KB未満はスキップ）
      if (currentBlob.size < 1024) {
        console.log('Blob too small, skipping transcription')
        return
      }
      
      // 一時的なファイル名
      const fileName = `realtime_${Date.now()}.webm`
      
      // Supabase Storageにアップロード
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, currentBlob)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Audio uploaded successfully')

      // 公開URLを取得
      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      // Whisper Edge Functionを呼び出し
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
      console.log('Whisper response:', newTranscript)
      
      if (newTranscript && newTranscript.trim()) {
        console.log('Adding new transcript to history')
        
        // 履歴に追加
        setTranscriptionHistory(prev => [...prev, newTranscript])
        
        // リアルタイム表示を最新の結果のみに更新
        setRealtimeTranscript(newTranscript)
      } else {
        console.log('No transcript received or empty transcript')
      }

      // 一時ファイルを削除
      await supabase.storage.from('recordings').remove([fileName])
      console.log('Temporary file removed')

    } catch (error) {
      console.error('Error in realtime transcription:', error)
    }
  }, [isRecording, supabase])

  useEffect(() => {
    console.log('useEffect triggered, isRecording:', isRecording)
    if (isRecording) {
      console.log('Starting timers...')
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // リアルタイム文字起こしを開始（3秒ごと）
      transcriptionIntervalRef.current = setInterval(() => {
        console.log('Transcription interval triggered')
        performRealtimeTranscription()
      }, 3000)
      
      console.log('Timers started')
    } else {
      console.log('Stopping timers...')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current)
        transcriptionIntervalRef.current = null
      }
      console.log('Timers stopped')
    }

    return () => {
      console.log('Cleanup function called')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current)
      }
    }
  }, [isRecording, performRealtimeTranscription])

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
    console.log('startRecording called')
    try {
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone access granted')
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log('Chunks count:', chunksRef.current.length)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob...')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        console.log('Blob created:', blob.size, 'bytes')
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      console.log('Starting recording...')
      // 1秒ごとにデータを取得するように設定
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript('')
      setRealtimeTranscript('')
      setTranscriptionHistory([])
      console.log('Recording started successfully')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`マイクへのアクセスが拒否されました: ${errorMessage}`)
    }
  }

  const stopRecording = () => {
    console.log('stopRecording called, isRecording:', isRecording)
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping media recorder...')
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('Recording stopped')
    } else {
      console.log('Cannot stop recording: mediaRecorder not available or not recording')
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      // Upload audio to Supabase Storage
      const fileName = `temp_recording_${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      // Call Whisper Edge Function
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
      console.log('Transcription completed:', whisperTranscript)

      // Clean up temporary file
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
      // Upload audio to Supabase Storage
      const fileName = `recording_${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('recordings')
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(fileName)

      // Create recording record
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          scenario_id: selectedScenario,
          audio_url: publicUrl
        })
        .select()
        .single()

      if (recordingError) throw recordingError

      // Call Whisper Edge Function
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

      // Update recording with transcript
      await supabase
        .from('recordings')
        .update({ transcript })
        .eq('id', recording.id)

      // Call Evaluate Edge Function
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

      // Navigate to result page
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
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">ロールプレイ録音</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 録音コントロール */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>シナリオ選択</CardTitle>
              <CardDescription>練習したいシナリオを選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
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

          <Card>
            <CardHeader>
              <CardTitle>録音コントロール</CardTitle>
              <CardDescription>
                {selectedScenario ? '準備ができたら録音を開始してください' : 'まずシナリオを選択してください'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Recording Timer */}
              <div className="text-4xl font-mono font-bold text-gray-700">
                {formatTime(recordingTime)}
              </div>

              {/* Recording Button */}
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  disabled={!selectedScenario || isProcessing}
                  className="w-32 h-32 rounded-full"
                >
                  <Mic className="h-12 w-12" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={stopRecording}
                  variant="destructive"
                  className="w-32 h-32 rounded-full animate-pulse"
                >
                  <MicOff className="h-12 w-12" />
                </Button>
              )}

              {/* Status Text */}
              <p className="text-lg text-gray-600">
                {isRecording ? '録音中...' : audioBlob ? '録音完了' : '録音を開始するにはボタンを押してください'}
              </p>

              {/* Transcribe Button */}
              {audioBlob && !isRecording && !transcript && (
                <Button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="w-full max-w-xs"
                >
                  {isTranscribing ? '文字起こし中...' : '文字起こし'}
                </Button>
              )}

              {/* Process Button */}
              {audioBlob && !isRecording && (
                <Button
                  onClick={processRecording}
                  disabled={isProcessing || !selectedScenario}
                  className="w-full max-w-xs"
                >
                  {isProcessing ? '評価中...' : '評価開始'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Final Transcript Display */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle>最終文字起こし結果</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側: リアルタイム文字起こし */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>リアルタイム文字起こし</CardTitle>
              <CardDescription>
                {isRecording ? '録音中にリアルタイムで文字起こしが表示されます' : '録音を開始すると文字起こしが開始されます'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                {realtimeTranscript ? (
                  <div className="space-y-4">
                    {/* リアルタイム文字起こしの表示 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">最新の文字起こし結果</span>
                        {isRecording && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500">録音中</span>
                          </div>
                        )}
                      </div>
                      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        {realtimeTranscript}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        更新時刻: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {/* 文字起こし履歴（折りたたみ可能） */}
                    {transcriptionHistory.length > 1 && (
                      <details className="bg-white rounded-lg shadow-sm">
                        <summary className="p-3 cursor-pointer hover:bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            文字起こし履歴 ({transcriptionHistory.length}回)
                          </span>
                        </summary>
                        <div className="p-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                          {transcriptionHistory.map((text, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-2 border-blue-200">
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}