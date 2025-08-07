import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReflectionRequest {
  evaluationId: string
  userComment: string
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Reflection chat function called')
    
    const { evaluationId, userComment, evaluationContext }: ReflectionRequest = await req.json()
    
    console.log('Request data:', { evaluationId, userComment: userComment?.substring(0, 100) + '...' })
    
    if (!evaluationId || !userComment) {
      console.error('Missing required fields:', { evaluationId: !!evaluationId, userComment: !!userComment })
      return new Response(
        JSON.stringify({ error: 'evaluationId and userComment are required' }),
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

    // Fetch evaluation context if not provided
    let context = evaluationContext
    if (!context) {
      console.log('Fetching evaluation context...')
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          total_score,
          summary_comment,
          feedback_notes (
            score,
            comment,
            evaluation_criteria (label, max_score)
          )
        `)
        .eq('id', evaluationId)
        .single()

      if (evalError) {
        console.error('Evaluation fetch error:', evalError)
        throw new Error(`Failed to fetch evaluation: ${evalError.message}`)
      }

      context = {
        totalScore: evaluation.total_score,
        summaryComment: evaluation.summary_comment,
        criteriaScores: evaluation.feedback_notes.map((fn: any) => ({
          label: fn.evaluation_criteria.label,
          score: fn.score,
          maxScore: fn.evaluation_criteria.max_score,
          comment: fn.comment
        }))
      }
    }

    // Prepare GPT-4o prompt for reflection response
    const systemPrompt = `あなたは接客研修の専門コーチです。ユーザーの振り返りコメントに対して、励ましと具体的な改善アドバイスを提供してください。

以下の原則に従って応答してください：
1. ユーザーの気づきや改善意欲を肯定する
2. 具体的で実践的なアドバイスを提供する
3. 次回の練習につながる提案をする
4. 簡潔で親しみやすい口調で話す
5. 1-2文程度の短い応答にする

評価結果の概要：
- 総合評価: ${context.totalScore}/100点
- 総評: ${context.summaryComment}

項目別評価:
${context.criteriaScores.map(cs => `- ${cs.label}: ${cs.score}/${cs.maxScore}点 - ${cs.comment}`).join('\n')}

ユーザーの振り返りコメントに対して、上記の評価結果を踏まえた適切な応答を返してください。`

    const userPrompt = `ユーザーの振り返りコメント:
"${userComment}"

この振り返りに対して、励ましと具体的なアドバイスを提供してください。`

    console.log('Calling GPT-4o API for reflection response...')
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
        temperature: 0.8,
        max_tokens: 200
      }),
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.text()
      console.error('GPT API error:', error)
      throw new Error(`GPT API error: ${error}`)
    }

    const gptResult = await gptResponse.json()
    console.log('GPT response received')
    
    const aiReply = gptResult.choices[0].message.content.trim()

    // Save reflection to database
    console.log('Saving reflection to database...')
    let reflectionData = null
    let reflectionError = null
    
    try {
      const { data, error } = await supabase
        .from('feedback_reflections')
        .insert({
          evaluation_id: evaluationId,
          user_comment: userComment,
          ai_reply: aiReply
        })
        .select()
        .single()
      
      reflectionData = data
      reflectionError = error
    } catch (error) {
      console.error('Failed to save reflection to database:', error)
      // データベース保存に失敗しても、AIの応答は返す
      reflectionError = error
    }

    if (reflectionError) {
      console.error('Failed to save reflection:', reflectionError)
      // データベース保存に失敗しても、AIの応答は返す
      console.log('Returning AI response without saving to database')
      return new Response(
        JSON.stringify({ 
          id: null,
          userComment: userComment,
          aiReply: aiReply,
          createdAt: new Date().toISOString(),
          note: 'Response saved locally only'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Reflection chat completed successfully')
    return new Response(
      JSON.stringify({ 
        id: reflectionData.id,
        userComment: reflectionData.user_comment,
        aiReply: reflectionData.ai_reply,
        createdAt: reflectionData.created_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Reflection chat function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 