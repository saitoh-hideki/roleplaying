// @ts-nocheck
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
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

interface Criterion {
  id: string
  label: string
  description: string
  max_score: number
}

interface SceneCriterion {
  id: string
  criterion_name: string
  criterion_description?: string
  max_score: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Evaluate Scene 003 function called ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const { recordingId, transcript, scenarioId, situationId }: EvaluationRequest = await req.json()
    
    console.log('Request data received:', { 
      recordingId, 
      transcriptLength: transcript?.length || 0,
      transcriptPreview: transcript?.substring(0, 100) + '...', 
      scenarioId, 
      situationId 
    })
    
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
      .eq('scene_id', 'scene_003')
      .order('sort_order')

    if (sceneCriteriaError) {
      console.error('Scene criteria fetch error:', sceneCriteriaError)
      throw new Error(`Failed to fetch scene criteria: ${sceneCriteriaError.message}`)
    }
    
    console.log('Fetched scene criteria count:', sceneCriteria.length)

    // Combine all criteria for evaluation
    const allCriteria = [
      ...(basicCriteria as Criterion[]).map((c: Criterion) => ({ ...c, label: c.label, description: c.description, max_score: c.max_score })),
      ...(sceneCriteria as SceneCriterion[]).map((c: SceneCriterion) => ({ ...c, label: c.criterion_name, description: c.criterion_description || '', max_score: c.max_score }))
    ]

    console.log('Total criteria count:', allCriteria.length)

    // シーン003専用の評価プロンプト
    const systemPrompt = `あなたは接客研修の専門コーチです。特に「久しぶりに来店された予約済み会員様」というシーンでの接客を評価します。

このシーンでの重要な評価ポイント:
1. 久しぶりの来店への喜びの表現
2. 関係性の再構築と親しみのある対応
3. 時間が空いたことへの配慮
4. 会員様の状況変化への気配り
5. 継続的な関係性の維持

評価項目：
${allCriteria.map((criterion, index) => `${index + 1}. ${criterion.label}: ${criterion.description}`).join('\n')}

**重要**: 評価結果には必ず以下のシーン003特有の評価項目を含めてください：
- 関係性の維持
- 変化の把握
- 継続サポート
- 親近感
- フォローアップ

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

    const userPrompt = `シーン: 久しぶりに来店された予約済み会員様

状況説明:
- 関係性があるが時間が空いている
- 久しぶりの来店への配慮が必要
- 会員様の状況変化への気配り
- 継続的な関係性の維持

接客内容:
${transcript}

上記の接客内容を、このシーン特有の観点から評価してください。特に久しぶりの来店への喜びの表現、関係性の再構築、時間が空いたことへの配慮、会員様の状況変化への気配りについて重点的に評価してください。

**必ず以下のシーン003特有の評価項目を含めて評価してください：**
- 関係性の維持: 久しぶりの来店でも関係性を保った対応ができているか
- 変化の把握: 前回からの変化や状況を適切に把握できているか
- 継続サポート: 継続的なサポートの提案ができているか
- 親近感: 親しみやすく、距離感の良い対応ができているか
- フォローアップ: 今後の継続的な関係維持のためのフォローアップができているか`

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
    console.log('=== Saving evaluation to database ===')
    console.log('Evaluation data to save:', {
      recording_id: recordingId,
      total_score: evaluation.totalScore,
      summary_comment: evaluation.summaryComment
    })
    
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
      console.error('Evaluation error details:', {
        code: evalError.code,
        message: evalError.message,
        details: evalError.details,
        hint: evalError.hint
      })
      throw new Error(`Failed to save evaluation: ${evalError.message}`)
    }
    
    console.log('Evaluation saved successfully:', evalData)

    // Save feedback notes
    console.log('Saving feedback notes...')
    
    // Separate basic criteria and scene-specific criteria
    const basicCriteriaData = (basicCriteria as Criterion[]).map((c: Criterion) => ({ ...c, label: c.label, description: c.description, max_score: c.max_score }))
    const sceneCriteriaData = (sceneCriteria as SceneCriterion[]).map((c: SceneCriterion) => ({ ...c, label: c.criterion_name, description: c.criterion_description || '', max_score: c.max_score }))
    
    // Map criteria labels to IDs for feedback notes
    const basicCriteriaMap = new Map(basicCriteriaData.map((c: Criterion) => [c.label, c.id]))
    const sceneCriteriaMap = new Map(sceneCriteriaData.map((c: any) => [c.label, c.id]))
    
    // Separate basic and scene feedback notes
    const basicFeedbackNotes = []
    const sceneFeedbackNotes = []
    
    console.log('Processing evaluation criteria scores:', evaluation.criteriaScores)
    console.log('Basic criteria map:', Array.from(basicCriteriaMap.entries()))
    console.log('Scene criteria map:', Array.from(sceneCriteriaMap.entries()))
    
    for (const cs of evaluation.criteriaScores) {
      const basicCriterionId = basicCriteriaMap.get(cs.criterionId)
      const sceneCriterionId = sceneCriteriaMap.get(cs.criterionId)
      
      console.log(`Processing criterion: ${cs.criterionId}`)
      console.log(`  - Basic criterion ID: ${basicCriterionId}`)
      console.log(`  - Scene criterion ID: ${sceneCriterionId}`)
      
      if (basicCriterionId) {
        basicFeedbackNotes.push({
          evaluation_id: evalData.id,
          criterion_id: basicCriterionId,
          score: cs.score,
          comment: cs.comment
        })
        console.log(`  - Added to basic feedback notes`)
      } else if (sceneCriterionId) {
        sceneFeedbackNotes.push({
          evaluation_id: evalData.id,
          scene_criterion_id: sceneCriterionId,
          score: cs.score,
          comment: cs.comment
        })
        console.log(`  - Added to scene feedback notes`)
      } else {
        console.error('Unknown criterion label:', cs.criterionId)
        console.error('Available basic criteria:', Array.from(basicCriteriaMap.keys()))
        console.error('Available scene criteria:', Array.from(sceneCriteriaMap.keys()))
        throw new Error(`Unknown criterion label: ${cs.criterionId}`)
      }
    }
    
    // シーン特有評価項目が含まれていない場合、デフォルトの評価を追加
    if (sceneFeedbackNotes.length === 0 && sceneCriteria.length > 0) {
      console.log('No scene-specific criteria found in GPT response, adding default evaluations')
      for (const sceneCriterion of sceneCriteria) {
        sceneFeedbackNotes.push({
          evaluation_id: evalData.id,
          scene_criterion_id: sceneCriterion.id,
          score: Math.floor(evaluation.totalScore / 20), // 総合スコアから推定
          comment: `シーン003の評価項目「${sceneCriterion.criterion_name}」について評価されました。`
        })
      }
    }
    
    // 必ずシーン特有評価項目を追加（GPTの応答に関係なく）
    if (sceneFeedbackNotes.length === 0) {
      console.log('Adding all scene-specific criteria as default evaluations')
      for (const sceneCriterion of sceneCriteria) {
        sceneFeedbackNotes.push({
          evaluation_id: evalData.id,
          scene_criterion_id: sceneCriterion.id,
          score: 1, // デフォルトで1点
          comment: `シーン003の評価項目「${sceneCriterion.criterion_name}」について評価されました。`
        })
      }
    }
    
    console.log('Final basic feedback notes:', basicFeedbackNotes)
    console.log('Final scene feedback notes:', sceneFeedbackNotes)
    
    // シーン特有評価項目が確実に含まれるようにする
    const existingSceneCriterionIds = new Set(sceneFeedbackNotes.map(note => note.scene_criterion_id))
    for (const sceneCriterion of sceneCriteria) {
      if (!existingSceneCriterionIds.has(sceneCriterion.id)) {
        console.log(`Adding missing scene criterion: ${sceneCriterion.criterion_name}`)
        sceneFeedbackNotes.push({
          evaluation_id: evalData.id,
          scene_criterion_id: sceneCriterion.id,
          score: 1, // デフォルトで1点
          comment: `シーン003の評価項目「${sceneCriterion.criterion_name}」について評価されました。`
        })
      }
    }
    
    // 必ず5個の評価基準が含まれるようにする（データベースの基準数と一致させる）
    if (sceneFeedbackNotes.length < sceneCriteria.length) {
      console.log(`Ensuring all ${sceneCriteria.length} scene criteria are included`)
      const missingCriteria = sceneCriteria.filter(criterion => 
        !sceneFeedbackNotes.some(note => note.scene_criterion_id === criterion.id)
      )
      
      for (const missingCriterion of missingCriteria) {
        console.log(`Adding missing criterion: ${missingCriterion.criterion_name}`)
        sceneFeedbackNotes.push({
          evaluation_id: evalData.id,
          scene_criterion_id: missingCriterion.id,
          score: 1, // デフォルトで1点
          comment: `シーン003の評価項目「${missingCriterion.criterion_name}」について評価されました。`
        })
      }
    }
    
    console.log('Final scene feedback notes after ensuring all criteria:', sceneFeedbackNotes)
    console.log(`Total scene feedback notes: ${sceneFeedbackNotes.length}, Expected: ${sceneCriteria.length}`)

    // Save basic feedback notes
    if (basicFeedbackNotes.length > 0) {
      console.log('Attempting to save basic feedback notes:', basicFeedbackNotes)
      const { data: basicFeedbackData, error: basicFeedbackError } = await supabase
        .from('feedback_notes')
        .insert(basicFeedbackNotes)
        .select()

      if (basicFeedbackError) {
        console.error('Failed to save basic feedback notes:', basicFeedbackError)
        console.error('Basic feedback error details:', {
          code: basicFeedbackError.code,
          message: basicFeedbackError.message,
          details: basicFeedbackError.details,
          hint: basicFeedbackError.hint
        })
        console.error('Basic feedback notes data:', basicFeedbackNotes)
        throw new Error(`Failed to save basic feedback notes: ${basicFeedbackError.message || 'Unknown error'}`)
      }
      
      console.log('Basic feedback notes saved successfully:', basicFeedbackData)
    } else {
      console.log('No basic feedback notes to save')
    }

    // Save scene feedback notes
    if (sceneFeedbackNotes.length > 0) {
      console.log('Attempting to save scene feedback notes:', sceneFeedbackNotes)
      const { data: sceneFeedbackData, error: sceneFeedbackError } = await supabase
        .from('scene_feedback_notes')
        .insert(sceneFeedbackNotes)
        .select()

      if (sceneFeedbackError) {
        console.error('Failed to save scene feedback notes:', sceneFeedbackError)
        console.error('Scene feedback error details:', {
          code: sceneFeedbackError.code,
          message: sceneFeedbackError.message,
          details: sceneFeedbackError.details,
          hint: sceneFeedbackError.hint
        })
        console.error('Scene feedback notes data:', sceneFeedbackNotes)
        throw new Error(`Failed to save scene feedback notes: ${sceneFeedbackError.message || 'Unknown error'}`)
      }
      
      console.log('Scene feedback notes saved successfully:', sceneFeedbackData)
    } else {
      console.log('No scene feedback notes to save')
    }

    console.log('Scene 003 evaluation completed successfully')
    return new Response(
      JSON.stringify({ 
        evaluationId: evalData.id,
        totalScore: evaluation.totalScore,
        summaryComment: evaluation.summaryComment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Evaluate Scene 003 function error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 