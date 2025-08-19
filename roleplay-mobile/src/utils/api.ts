import { supabase } from '../lib/supabase';
import { SUPABASE_CONFIG, API_CONFIG, ERROR_MESSAGES } from '../config/supabase';

// API呼び出しの基本設定
const API_BASE_URL = 'https://navqkresgxxutahyljyx.supabase.co';

// 共通のヘッダー
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdnFrcmVzZ3h4dXRhaHlsanl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjU0MjIsImV4cCI6MjA2OTk0MTQyMn0.FipT5gb0k239ujfPIDkp-O8YqeBOI6i0ge8ukz443ZA`,
});

// エラーハンドリング
const handleApiError = (error: any, context: string) => {
  console.error(`${context} error:`, error);
  
  // より詳細なエラー情報を提供
  let errorMessage = 'Unknown error';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    if (error.status === 401) {
      errorMessage = ERROR_MESSAGES.AUTH_ERROR;
    } else if (error.status === 403) {
      errorMessage = ERROR_MESSAGES.PERMISSION_ERROR;
    } else if (error.status >= 500) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = error.error;
    }
  }
  
  throw new Error(`${context}: ${errorMessage}`);
};

// 音声ファイルをSupabase Storageにアップロード
export const uploadAudioToStorage = async (audioUri: string): Promise<string> => {
  try {
    console.log('=== 音声ファイルアップロード開始 ===');
    console.log('Audio URI:', audioUri);
    
    // ファイル名を生成（拡張子をURIから取得）
    const uriParts = audioUri.split('.');
    const extension = uriParts.length > 1 ? uriParts[uriParts.length - 1] : 'webm';
    const fileName = `mobile_recording_${Date.now()}.${extension}`;
    console.log('Generated filename:', fileName);
    
    // React Nativeでのローカルファイル処理を改善
    let audioBlob: Blob;
    
    try {
      console.log('方法1: fetchでローカルファイルを読み込みを試行...');
      // 方法1: fetchでローカルファイルを読み込み
      const response = await fetch(audioUri);
      if (!response.ok) {
        throw new Error(`Fetch response not ok: ${response.status} ${response.statusText}`);
      }
      audioBlob = await response.blob();
      console.log('✅ 方法1成功: Audio blob created via fetch, size:', audioBlob.size, 'bytes');
    } catch (fetchError) {
      console.log('❌ 方法1失敗:', fetchError);
      
      try {
        console.log('方法2: XMLHttpRequestを使用を試行...');
        // 方法2: XMLHttpRequestを使用（React Nativeでより確実）
        audioBlob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', audioUri, true);
          xhr.responseType = 'blob';
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              console.log('XHR成功, status:', xhr.status);
              resolve(xhr.response);
            } else {
              reject(new Error(`XHR failed with status: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('XHR request failed'));
          };
          
          xhr.send();
        });
        
        console.log('✅ 方法2成功: Audio blob created via XHR, size:', audioBlob.size, 'bytes');
      } catch (xhrError) {
        console.log('❌ 方法2失敗:', xhrError);
        
        try {
          console.log('方法3: base64として読み込みを試行...');
          // 方法3: ファイルをbase64として読み込み
          const base64Data = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', audioUri, true);
            xhr.responseType = 'text';
            
            xhr.onload = () => {
              if (xhr.status === 200) {
                console.log('Base64読み込み成功, length:', xhr.responseText.length);
                resolve(xhr.responseText);
              } else {
                reject(new Error(`XHR failed with status: ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => {
              reject(new Error('XHR request failed'));
            };
            
            xhr.send();
          });
          
          console.log('Base64データ取得完了, 長さ:', base64Data.length);
          
          // base64からBlobを作成
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          // ファイル形式に応じてMIMEタイプを設定
          let mimeType = 'audio/webm';
          if (extension === 'm4a') {
            mimeType = 'audio/mp4';
          } else if (extension === 'wav') {
            mimeType = 'audio/wav';
          } else if (extension === 'mp3') {
            mimeType = 'audio/mpeg';
          }
          
          audioBlob = new Blob([byteArray], { type: mimeType });
          
          console.log('✅ 方法3成功: Audio blob created via base64, size:', audioBlob.size, 'bytes, type:', mimeType);
        } catch (base64Error) {
          console.log('❌ 方法3失敗:', base64Error);
          
          // 方法4: ファイルサイズが小さい場合の直接処理
          try {
            console.log('方法4: 直接ファイル処理を試行...');
            const response = await fetch(audioUri);
            const arrayBuffer = await response.arrayBuffer();
            audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
            console.log('✅ 方法4成功: Audio blob created via arrayBuffer, size:', audioBlob.size, 'bytes');
          } catch (directError) {
            console.log('❌ 方法4失敗:', directError);
            throw new Error(`All blob creation methods failed. Last error: ${directError}`);
          }
        }
      }
    }
    
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Failed to create audio blob or blob is empty');
    }
    
    console.log('Blob作成完了, size:', audioBlob.size, 'bytes, type:', audioBlob.type);
    
    // ファイルサイズの検証（最小サイズと最大サイズ）
    const minSize = 1024; // 1KB
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (audioBlob.size < minSize) {
      throw new Error(`Audio file too small: ${audioBlob.size} bytes (minimum: ${minSize} bytes)`);
    }
    
    if (audioBlob.size > maxSize) {
      throw new Error(`Audio file too large: ${audioBlob.size} bytes (maximum: ${maxSize} bytes)`);
    }
    
    console.log('ファイルサイズ検証完了:', audioBlob.size, 'bytes');
    
    // Supabase Storageにアップロード
    console.log('Supabase Storageへのアップロード開始...');

    // ファイル形式に応じてMIMEタイプを正規化（storageが受け付けない別名を統一）
    const normalizeContentType = (rawType: string | undefined, ext: string) => {
      const t = (rawType || '').toLowerCase();
      // iOSでよく付く 'audio/x-m4a' は 'audio/mp4' に正規化
      if (t === 'audio/x-m4a' || t === 'audio/m4a' || t === 'audio/aac') return 'audio/mp4';
      if (t === 'audio/mp4') return 'audio/mp4';
      if (t === 'audio/webm') return 'audio/webm';
      if (t === 'audio/mpeg' || t === 'audio/mp3') return 'audio/mpeg';
      if (t === 'audio/wav' || t === 'audio/x-wav') return 'audio/wav';
      // rawTypeが空または未知の場合は拡張子から推定
      const e = ext.toLowerCase();
      if (e === 'm4a' || e === 'aac') return 'audio/mp4';
      if (e === 'mp3') return 'audio/mpeg';
      if (e === 'wav') return 'audio/wav';
      if (e === 'webm') return 'audio/webm';
      // デフォルト
      return 'audio/mp4';
    };

    const contentType = normalizeContentType(audioBlob.type, extension);
    console.log('Content-Type設定(正規化後):', contentType);
    
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioBlob, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      
      // より詳細なエラー情報を提供
      if (error.message.includes('bucket')) {
        throw new Error(`Storage bucket error: ${error.message}. Please check if the 'recordings' bucket exists and has proper permissions.`);
      } else if (error.message.includes('permission')) {
        throw new Error(`Permission denied: ${error.message}. Please check your Supabase storage policies.`);
      } else if (error.message.includes('size')) {
        throw new Error(`File size error: ${error.message}. The file may be too large.`);
      } else {
        throw new Error(`Storage upload failed: ${error.message}`);
      }
    }

    console.log('Storage upload successful:', data);
    
    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL generated:', publicUrl);
    
    console.log('=== 音声ファイルアップロード完了 ===');
    return publicUrl;
    
  } catch (error) {
    console.error('=== 音声ファイルアップロードエラー ===');
    console.error('Error in uploadAudioToStorage:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error object:', error);
    }
    
    // より具体的なエラーメッセージを提供
    let userMessage = '音声ファイルのアップロードに失敗しました。';
    
    if (error instanceof Error) {
      if (error.message.includes('bucket')) {
        userMessage = 'ストレージバケットの設定に問題があります。管理者に連絡してください。';
      } else if (error.message.includes('permission')) {
        userMessage = 'ファイルのアップロード権限がありません。';
      } else if (error.message.includes('size')) {
        userMessage = 'ファイルサイズが大きすぎます。';
      } else if (error.message.includes('blob')) {
        userMessage = '音声ファイルの処理に失敗しました。録音をやり直してください。';
      }
    }
    
    const enhancedError = new Error(`${userMessage}\n\n技術的詳細: ${error instanceof Error ? error.message : 'Unknown error'}`);
    enhancedError.name = 'AudioUploadError';
    
    throw enhancedError;
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
    
    // Webアプリの仕様に合わせて、scenesテーブルのedge_functionフィールドを使用
    const { data: sceneData, error: sceneError } = await supabase
      .from('scenes')
      .select('edge_function')
      .eq('id', sceneId)
      .single();

    if (sceneError) {
      console.error('Failed to fetch scene edge function:', sceneError);
      throw new Error(`Failed to fetch scene edge function: ${sceneError.message}`);
    }

    if (!sceneData?.edge_function) {
      console.error('Scene edge function not found for scene:', sceneId);
      throw new Error('Scene edge function not configured');
    }

    const edgeFunctionName = sceneData.edge_function;
    console.log('Using edge function:', edgeFunctionName);
    
    const response = await fetch(`${API_BASE_URL}/functions/v1/${edgeFunctionName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        recordingId,
        transcript,
        situationId: sceneId, // Webアプリと同じパラメータ名
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

// 録音データの保存（Webアプリの仕様に合わせて修正）
export const saveRecording = async (
  sceneId: string,
  audioUrl: string,
  transcript?: string
): Promise<string> => {
  try {
    console.log('Saving recording:', { sceneId, audioUrl, hasTranscript: !!transcript });
    
    // Webアプリと同じテーブル構造を使用
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        situation_id: sceneId, // scene_id ではなく situation_id
        audio_url: audioUrl,      // Supabase Storageの公開URL
        transcript: transcript || null, // 最初はnull、後で更新
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

// 評価結果の取得（Webアプリの仕様に合わせて修正）
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

// 録音履歴の取得（Webアプリの仕様に合わせて修正）
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

// 音声ファイルのアップロードと録音保存を統合した関数
export const processAudioRecording = async (
  sceneId: string,
  audioUri: string
): Promise<{ recordingId: string; audioUrl: string }> => {
  try {
    console.log('=== 録音処理開始 ===');
    console.log('Scene ID:', sceneId);
    console.log('Audio URI:', audioUri);
    
    // 1. 音声ファイルをSupabase Storageにアップロード
    console.log('1. 音声ファイルアップロード開始...');
    const audioUrl = await uploadAudioToStorage(audioUri);
    console.log('✅ 1. 音声ファイルアップロード完了:', audioUrl);
    
    // 2. 録音データをデータベースに保存（Webアプリと同じ構造）
    // 最初はtranscriptなしで保存し、後でWhisper APIの結果で更新
    console.log('2. 録音データ保存開始...');
    const recordingId = await saveRecording(sceneId, audioUrl);
    console.log('✅ 2. 録音データ保存完了:', recordingId);
    
    console.log('=== 録音処理完了 ===');
    console.log('最終結果:', { recordingId, audioUrl });
    
    return { recordingId, audioUrl };
  } catch (error) {
    console.error('=== 録音処理エラー ===');
    console.error('Error in processAudioRecording:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error object:', error);
    }
    
    throw error;
  }
};
