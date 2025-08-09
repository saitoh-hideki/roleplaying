// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global declarations
declare const Deno: {
  env: { get(key: string): string | undefined }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  evaluationId: string
  transcript: string
  situationId?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { evaluationId, transcript, situationId }: RequestBody = await req.json()

    if (!evaluationId || !transcript) {
      return new Response(
        JSON.stringify({ error: 'evaluationId and transcript are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openaiApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch V/M/P criteria
    let { data: criteria, error: critErr } = await supabase
      .from('philosophy_evaluation_criteria')
      .select('*')
      .order('sort_order')

    if (critErr) throw critErr

    // Auto-seed default V/M/P criteria if missing
    if (!criteria || criteria.length === 0) {
      const { error: seedErr } = await supabase
        .from('philosophy_evaluation_criteria')
        .insert([
          { code: 'vision', label: 'ビジョン', description: '', max_score: 5, sort_order: 1 },
          { code: 'mission', label: 'ミッション', description: '', max_score: 5, sort_order: 2 },
          { code: 'purpose', label: 'パーパス', description: '', max_score: 5, sort_order: 3 },
        ])
      if (seedErr) throw seedErr

      const reseed = await supabase
        .from('philosophy_evaluation_criteria')
        .select('*')
        .order('sort_order')
      if (reseed.error) throw reseed.error
      criteria = reseed.data || []
    }

    const systemPrompt = `あなたは企業理念浸透の評価専門家です。ビジョン・ミッション・パーパスの実践度を5点満点で評価し、根拠コメントを付けてください。

評価観点:
${criteria.map((c: any) => `- ${c.label} (${c.code}): ${c.description || ''} (最大${c.max_score}点)`).join('\n')}

出力は必ず次のJSONのみ:
{
  "items": [
    { "code": "vision|mission|purpose", "score": 1-5, "comment": "..." }
  ]
}`

    const userPrompt = `接客の文字起こし:
${transcript}

上記の内容から、各理念観点の実践度を評価してください。`

    const gptResp = await fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })
    })

    if (!gptResp.ok) {
      const t = await gptResp.text()
      throw new Error(`OpenAI error: ${t}`)
    }

    const gptJson = await gptResp.json()
    let parsed
    try {
      parsed = JSON.parse(gptJson.choices[0].message.content)
    } catch (e) {
      throw new Error('Failed to parse GPT JSON')
    }

    const items: Array<{ code: string; score: number; comment: string }> = parsed.items || []

    // Map code -> criterion id
    const codeToId = new Map<string, string>(criteria.map((c: any) => [c.code, c.id]))

    // Replace existing notes (idempotent)
    await supabase.from('philosophy_feedback_notes').delete().eq('evaluation_id', evaluationId)

    const rows = items
      .filter((it) => codeToId.has(it.code))
      .map((it) => ({
        evaluation_id: evaluationId,
        philosophy_criterion_id: codeToId.get(it.code)!,
        score: Math.max(1, Math.min(5, Math.round(it.score))),
        comment: it.comment?.toString().slice(0, 2000) || ''
      }))

    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from('philosophy_feedback_notes')
        .insert(rows)
      if (insErr) throw insErr
    }

    return new Response(
      JSON.stringify({ inserted: rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})


