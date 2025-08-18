import { Scene, Recording, Evaluation } from '../types/database';

export const mockScenes: Scene[] = [
  {
    id: 'scene_001',
    title: '初回来店のお客様対応',
    description: '初めて来店されたお客様への丁寧な案内と商品説明',
    icon: '👋',
    edge_function: 'evaluate_scene_001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scene_002',
    title: '商品の在庫確認',
    description: 'お客様からの在庫確認依頼への迅速な対応',
    icon: '📦',
    edge_function: 'evaluate_scene_002',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scene_003',
    title: 'クレーム対応',
    description: '商品の不具合についてのクレームへの適切な対応',
    icon: '⚠️',
    edge_function: 'evaluate_scene_003',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scene_004',
    title: '特別な要望への対応',
    description: 'お客様からの特別な要望やリクエストへの柔軟な対応',
    icon: '✨',
    edge_function: 'evaluate_scene_004',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scene_005',
    title: '複数商品の比較説明',
    description: '複数の商品の特徴を比較して、お客様に最適な商品を提案',
    icon: '⚖️',
    edge_function: 'evaluate_scene_005',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockRecordings: Recording[] = [
  {
    id: 'rec_001',
    situation_id: 'scene_001',
    audio_url: 'https://example.com/audio1.mp3',
    transcript: 'いらっしゃいませ。初めてご来店いただき、ありがとうございます。',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'rec_002',
    situation_id: 'scene_003',
    audio_url: 'https://example.com/audio2.mp3',
    transcript: '申し訳ございません。商品の不具合について詳しくお聞かせください。',
    created_at: '2024-01-14T15:45:00Z',
  },
];

export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval_001',
    recording_id: 'rec_001',
    total_score: 85,
    summary_comment: '初回来店のお客様への対応が非常に丁寧で、接客の基本が身についています。',
    created_at: '2024-01-15T10:35:00Z',
  },
];
