import { supabase } from '../lib/supabase';
import { SUPABASE_CONFIG, API_CONFIG, ERROR_MESSAGES } from '../config/supabase';

// API呼び出しの基本設定
const API_BASE_URL = SUPABASE_CONFIG.url;

// 共通のヘッダー
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
});

// エラーハンドリング
const handleApiError = (error: any, context: string) => {
  console.error(`${context} error:`, error);
  
  if (error.status === 401) {
    throw new Error(ERROR_MESSAGES.AUTH_ERROR);
  } else if (error.status === 403) {
    throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
  } else if (error.status >= 500) {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  } else {
    throw new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

// Whisper API呼び出し
export const callWhisperAPI = async (audioUrl: string): Promise<string> => {
  try {
    console.log('Calling Whisper API with audio URL:', audioUrl);
    
    const response = await fetch(`${API_BASE_URL}/functions/v1/whisper`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Whisper API response:', result);
    
    return result.transcript || '';
  } catch (error) {
    handleApiError(error, 'Whisper API');
    throw error;
  }
};

// シーン評価API呼び出し
export const callSceneEvaluationAPI = async (
  sceneId: string,
  recordingId: string,
  transcript: string
): Promise<{ evaluationId: string; totalScore: number; summaryComment: string }> => {
  try {
    console.log('Calling scene evaluation API:', { sceneId, recordingId, transcriptLength: transcript.length });
    
    // シーンIDからエッジファンクション名を決定
    const edgeFunctionName = `evaluate_${sceneId}`;
    
    const response = await fetch(`${API_BASE_URL}/functions/v1/${edgeFunctionName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        recordingId,
        transcript,
        situationId: sceneId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Scene evaluation API error:', errorText);
      throw new Error(`Scene evaluation API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Scene evaluation API response:', result);
    
    return {
      evaluationId: result.evaluationId,
      totalScore: result.totalScore,
      summaryComment: result.summaryComment,
    };
  } catch (error) {
    handleApiError(error, 'Scene evaluation API');
    throw error;
  }
};

// 理念評価API呼び出し
export const callPhilosophyEvaluationAPI = async (
  evaluationId: string,
  transcript: string,
  situationId: string
): Promise<void> => {
  try {
    console.log('Calling philosophy evaluation API:', { evaluationId, situationId });
    
    const response = await fetch(`${API_BASE_URL}/functions/v1/evaluate_philosophy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        evaluationId,
        transcript,
        situationId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Philosophy evaluation API error:', errorText);
      // 理念評価は失敗しても本フローは継続
      console.warn('Philosophy evaluation failed, but continuing main flow');
      return;
    }

    const result = await response.json();
    console.log('Philosophy evaluation API response:', result);
  } catch (error) {
    // 理念評価は失敗しても本フローは継続
    console.warn('Philosophy evaluation failed, but continuing main flow:', error);
  }
};

// 録音データの保存
export const saveRecording = async (
  situationId: string,
  audioUrl: string,
  transcript?: string
): Promise<string> => {
  try {
    console.log('Saving recording:', { situationId, audioUrl, hasTranscript: !!transcript });
    
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        situation_id: situationId,
        audio_url: audioUrl,
        transcript: transcript || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save recording:', error);
      throw new Error(`Failed to save recording: ${error.message}`);
    }

    console.log('Recording saved successfully:', data);
    return data.id;
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

// 録音データの更新（文字起こし結果を追加）
export const updateRecordingTranscript = async (
  recordingId: string,
  transcript: string
): Promise<void> => {
  try {
    console.log('Updating recording transcript:', { recordingId, transcriptLength: transcript.length });
    
    const { error } = await supabase
      .from('recordings')
      .update({ transcript })
      .eq('id', recordingId);

    if (error) {
      console.error('Failed to update recording transcript:', error);
      throw new Error(`Failed to update recording transcript: ${error.message}`);
    }

    console.log('Recording transcript updated successfully');
  } catch (error) {
    console.error('Error updating recording transcript:', error);
    throw error;
  }
};

// 評価結果の取得
export const getEvaluation = async (evaluationId: string) => {
  try {
    console.log('Getting evaluation:', evaluationId);
    
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        feedback_notes (
          *,
          evaluation_criteria (*)
        ),
        scene_feedback_notes (
          *,
          scene_evaluation_criteria (*)
        ),
        philosophy_feedback_notes (
          *,
          philosophy_evaluation_criteria (*)
        )
      `)
      .eq('id', evaluationId)
      .single();

    if (error) {
      console.error('Failed to get evaluation:', error);
      throw new Error(`Failed to get evaluation: ${error.message}`);
    }

    console.log('Evaluation retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error getting evaluation:', error);
    throw error;
  }
};

// 録音履歴の取得
export const getRecordings = async (limit = 50) => {
  try {
    console.log('Getting recordings, limit:', limit);
    
    const { data, error } = await supabase
      .from('recordings')
      .select(`
        *,
        scenes (*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get recordings:', error);
      throw new Error(`Failed to get recordings: ${error.message}`);
    }

    console.log('Recordings retrieved successfully, count:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error getting recordings:', error);
    throw error;
  }
};

// シーンの取得
export const getScenes = async () => {
  try {
    console.log('Getting scenes');
    
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Failed to get scenes:', error);
      throw new Error(`Failed to get scenes: ${error.message}`);
    }

    console.log('Scenes retrieved successfully, count:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error getting scenes:', error);
    throw error;
  }
};
