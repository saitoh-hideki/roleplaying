// Supabase設定
export const SUPABASE_CONFIG = {
  // 環境変数から取得（実際のアプリでは適切な環境変数管理が必要）
  url: 'https://navqkresgxxutahyljyx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdnFrcmVzZ3h4dXRhaHlsanl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjU0MjIsImV4cCI6MjA2OTk0MTQyMn0.FipT5gb0k239ujfPIDkp-O8YqeBOI6i0ge8ukz443ZA',
  
  // その他の設定
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  
  // ストレージ設定
  storage: {
    bucket: 'recordings',
  },
};

// エッジファンクション設定
export const EDGE_FUNCTIONS = {
  // 音声処理
  whisper: '/functions/v1/whisper',
  
  // シーン評価（各シーン専用）
  sceneEvaluation: {
    scene_001: '/functions/v1/evaluate_scene_001',
    scene_002: '/functions/v1/evaluate_scene_002',
    scene_003: '/functions/v1/evaluate_scene_003',
    scene_004: '/functions/v1/evaluate_scene_004',
    scene_005: '/functions/v1/evaluate_scene_005',
    scene_006: '/functions/v1/evaluate_scene_006',
    scene_007: '/functions/v1/evaluate_scene_007',
    scene_008: '/functions/v1/evaluate_scene_008',
    scene_009: '/functions/v1/evaluate_scene_009',
  },
  
  // 理念評価
  philosophyEvaluation: '/functions/v1/evaluate_philosophy',
  
  // リフレクションチャット
  reflectionChat: '/functions/v1/reflection-chat',
  
  // 汎用評価
  generalEvaluation: '/functions/v1/evaluate',
};

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  AUTH_ERROR: '認証エラーが発生しました。再度ログインしてください。',
  PERMISSION_ERROR: '権限がありません。管理者に連絡してください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
  AUDIO_PERMISSION_ERROR: 'マイクへのアクセス権限が必要です。設定から権限を許可してください。',
  RECORDING_ERROR: '録音中にエラーが発生しました。再度お試しください。',
  PROCESSING_ERROR: '録音の処理中にエラーが発生しました。',
  TRANSCRIPTION_ERROR: '文字起こしの処理中にエラーが発生しました。',
  EVALUATION_ERROR: '評価の処理中にエラーが発生しました。',
  SCENE_ERROR: 'シーンデータの取得中にエラーが発生しました。',
};

// API設定
export const API_CONFIG = {
  // Whisper API
  whisper: {
    endpoint: '/functions/v1/whisper',
    timeout: 30000, // 30秒
    maxAudioSize: 25 * 1024 * 1024, // 25MB
  },
  
  // 評価API
  evaluation: {
    timeout: 60000, // 60秒
    retryCount: 2,
  },
  
  // ファイルアップロード
  upload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a'],
    compression: {
      enabled: true,
      quality: 0.8,
    },
  },
  
  // 録音設定
  recording: {
    quality: 'high',
    format: 'webm',
    sampleRate: 44100,
    channels: 1,
    maxDuration: 300, // 5分
  },
};

// データベース設定
export const DATABASE_CONFIG = {
  // テーブル名（Webアプリと同じ）
  tables: {
    scenes: 'scenes',                    // scenarios ではなく scenes
    recordings: 'recordings',
    evaluations: 'evaluations',
    feedbackNotes: 'feedback_notes',
    sceneFeedbackNotes: 'scene_feedback_notes',
    philosophyFeedbackNotes: 'philosophy_feedback_notes',
    evaluationCriteria: 'evaluation_criteria',
    sceneEvaluationCriteria: 'scene_evaluation_criteria',
    philosophyEvaluationCriteria: 'philosophy_evaluation_criteria',
  },
  
  // ページネーション
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};
