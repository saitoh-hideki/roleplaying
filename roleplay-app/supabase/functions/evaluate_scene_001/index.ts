import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvaluationRequest {
  recordingId: string
  transcript: string
  scenarioId?: string
  situationId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Evaluate Scene 001 function called')
    
    const { recordingId, transcript, scenarioId, situationId }: EvaluationRequest = await req.json()
    
    console.log('Request data:', { recordingId, transcript: transcript?.substring(0, 100) + '...', scenarioId, situationId })
    
    if (!recordingId || !transcript) {
      console.error('Missing required fields:', { recordingId: !!recordingId, transcript: !!transcript })
      return new Response(
        JSON.stringify({ error: 'recordingId and transcript are required' }),
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

    // Fetch basic evaluation criteria (共通評価項目)
    console.log('Fetching basic criteria...')
    const { data: basicCriteria, error: basicCriteriaError } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('type', 'basic')
      .order('created_at')

    if (basicCriteriaError) {
      console.error('Basic criteria fetch error:', basicCriteriaError)
      throw new Error(`Failed to fetch basic criteria: ${basicCriteriaError.message}`)
    }
    
    console.log('Fetched basic criteria count:', basicCriteria.length)

    // Fetch scene-specific evaluation criteria
    console.log('Fetching scene-specific criteria...')
    const { data: sceneCriteria, error: sceneCriteriaError } = await supabase
      .from('scene_evaluation_criteria')
      .select('*')
      .eq('scene_id', 'scene_001')
      .order('sort_order')

    if (sceneCriteriaError) {
      console.error('Scene criteria fetch error:', sceneCriteriaError)
      throw new Error(`Failed to fetch scene criteria: ${sceneCriteriaError.message}`)
    }
    
    console.log('Fetched scene criteria count:', sceneCriteria.length)

    // Combine all criteria for evaluation
    const allCriteria = [
      ...basicCriteria.map(c => ({ ...c, label: c.label, description: c.description, max_score: c.max_score })),
      ...sceneCriteria.map(c => ({ ...c, label: c.criterion_name, description: c.criterion_description || '', max_score: c.max_score }))
    ]

    console.log('Total criteria count:', allCriteria.length)

    // Create evaluation prompt
    const systemPrompt = `あなたは接客ロールプレイの評価専門家です。以下の評価基準に基づいて、接客対応を客観的かつ詳細に評価してください。

評価の際は以下の点に注意してください：
- 各項目を1-5点で評価（1: 改善が必要、2: やや不十分、3: 普通、4: 良好、5: 優秀）
- 具体的な改善点を含めた建設的なフィードバックを提供
- 総合評価は100点満点で算出（各項目の平均点 × 20）
- 評価結果は必ずJSON形式で返す

評価項目：
${allCriteria.map((criterion, index) => `${index + 1}. ${criterion.label}: ${criterion.description}`).join('\n')}

評価結果は以下のJSON形式で返してください：
{
  "totalScore": 総合点（1-100）,
  "summaryComment": "総合的な評価コメント",
  "criteriaScores": [
    {
      "criterionId": "評価項目名",
      "score": 点数（1-5）,
      "comment": "具体的なフィードバック"
    }
  ]
}`

    const userPrompt = `以下の接客ロールプレイ内容を評価してください：

【ロールプレイ内容】
${transcript}

【シーン情報】
シーン001: パソコンが調子悪くて初めてお客様が来店
- 非会員の初回来店、困りごとベースの接客練習
- 技術的な問題解決と信頼関係構築が重要

上記の評価基準に基づいて、詳細な評価を行ってください。`

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
    const criteriaMap = new Map(allCriteria.map(c => [c.label, c.id]))
    
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

    console.log('Scene 001 evaluation completed successfully')
    return new Response(
      JSON.stringify({ 
        evaluationId: evalData.id,
        totalScore: evaluation.totalScore,
        summaryComment: evaluation.summaryComment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Evaluate Scene 001 function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 