import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvaluationRequest {
  recordingId: string
  transcript: string
  scenarioId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Evaluate function called')
    
    const { recordingId, transcript, scenarioId }: EvaluationRequest = await req.json()
    
    console.log('Request data:', { recordingId, transcript: transcript?.substring(0, 100) + '...', scenarioId })
    
    if (!recordingId || !transcript || !scenarioId) {
      console.error('Missing required fields:', { recordingId: !!recordingId, transcript: !!transcript, scenarioId: !!scenarioId })
      return new Response(
        JSON.stringify({ error: 'recordingId, transcript, and scenarioId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      throw new Error('OpenAI API key not configured')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not configured')
      throw new Error('Supabase environment variables not configured')
    }
    
    console.log('Creating Supabase client with URL:', supabaseUrl)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch scenario and evaluation criteria
    console.log('Fetching scenario and criteria...')
    const [scenarioResult, criteriaResult] = await Promise.all([
      supabase.from('scenarios').select('*').eq('id', scenarioId).single(),
      supabase.from('evaluation_criteria').select('*')
    ])

    if (scenarioResult.error) {
      console.error('Scenario fetch error:', scenarioResult.error)
      throw new Error(`Failed to fetch scenario: ${scenarioResult.error.message}`)
    }
    
    if (criteriaResult.error) {
      console.error('Criteria fetch error:', criteriaResult.error)
      throw new Error(`Failed to fetch criteria: ${criteriaResult.error.message}`)
    }

    const scenario = scenarioResult.data
    const criteria = criteriaResult.data
    
    console.log('Fetched scenario:', scenario.title)
    console.log('Fetched criteria count:', criteria.length)

    // Prepare GPT-4o prompt
    const systemPrompt = `あなたは接客研修の専門コーチです。以下の観点から接客ロールプレイを評価し、具体的な改善アドバイスを提供してください。

評価項目:
${criteria.map(c => `- ${c.label}: ${c.description} (最大${c.max_score}点)`).join('\n')}

評価は以下のJSON形式で返してください:
{
  "totalScore": 総合点数(100点満点),
  "summaryComment": "総括コメント（改善点と良かった点を含む）",
  "criteriaScores": [
    {
      "criterionId": "評価項目ID",
      "score": 点数,
      "comment": "具体的なアドバイス"
    }
  ]
}

必ず有効なJSON形式で返してください。`

    const userPrompt = `シナリオ: ${scenario.title}
${scenario.description}

接客内容:
${transcript}

上記の接客内容を評価してください。`

    console.log('Calling GPT-4o API...')
    // Call GPT-4o API
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.text()
      console.error('GPT API error:', error)
      throw new Error(`GPT API error: ${error}`)
    }

    const gptResult = await gptResponse.json()
    console.log('GPT response received')
    
    let evaluation
    try {
      evaluation = JSON.parse(gptResult.choices[0].message.content)
      console.log('Parsed evaluation:', { totalScore: evaluation.totalScore })
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError)
      throw new Error('Failed to parse GPT response')
    }

    // Save evaluation to database
    console.log('Saving evaluation to database...')
    const { data: evalData, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        recording_id: recordingId,
        total_score: evaluation.totalScore,
        summary_comment: evaluation.summaryComment
      })
      .select()
      .single()

    if (evalError) {
      console.error('Failed to save evaluation:', evalError)
      throw new Error(`Failed to save evaluation: ${evalError.message}`)
    }

    // Save feedback notes
    console.log('Saving feedback notes...')
    
    // Map criteria labels to IDs for feedback notes
    const criteriaMap = new Map(criteria.map(c => [c.label, c.id]))
    
    const feedbackNotes = evaluation.criteriaScores.map((cs: any) => {
      const criterionId = criteriaMap.get(cs.criterionId)
      if (!criterionId) {
        console.error('Unknown criterion label:', cs.criterionId)
        throw new Error(`Unknown criterion label: ${cs.criterionId}`)
      }
      
      return {
        evaluation_id: evalData.id,
        criterion_id: criterionId,
        score: cs.score,
        comment: cs.comment
      }
    })

    const { error: feedbackError } = await supabase
      .from('feedback_notes')
      .insert(feedbackNotes)

    if (feedbackError) {
      console.error('Failed to save feedback notes:', feedbackError)
      throw new Error(`Failed to save feedback notes: ${feedbackError.message}`)
    }

    console.log('Evaluation completed successfully')
    return new Response(
      JSON.stringify({ 
        evaluationId: evalData.id,
        totalScore: evaluation.totalScore,
        summaryComment: evaluation.summaryComment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Evaluate function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})