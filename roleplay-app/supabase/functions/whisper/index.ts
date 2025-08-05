import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioUrl } = await req.json()
    
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'audioUrl is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Download audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl)
    const audioBlob = await audioResponse.blob()
    
    console.log('Downloaded audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    })
    
    // Create form data for Whisper API
    const formData = new FormData()
    
    // WebMファイルを適切に処理
    const fileName = 'audio.wav' // WAV形式で統一
    const mimeType = 'audio/wav'
    
    // 新しいBlobを作成してMIMEタイプを明示的に設定
    const audioFile = new Blob([audioBlob], { type: mimeType })
    formData.append('file', audioFile, fileName)
    formData.append('model', 'whisper-1')
    formData.append('language', 'ja')
    formData.append('response_format', 'json')

    console.log('Sending to Whisper API with file:', fileName, 'mimeType:', mimeType)
    
    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    })
    
    console.log('Whisper API response status:', whisperResponse.status)

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('Whisper API error response:', errorText)
      throw new Error(`Whisper API error: ${errorText}`)
    }

    const responseData = await whisperResponse.json()
    console.log('OpenAI Whisper API response:', responseData)
    
    const text = responseData.text || responseData.transcript || ''
    console.log('Extracted text:', text)

    return new Response(
      JSON.stringify({ transcript: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})