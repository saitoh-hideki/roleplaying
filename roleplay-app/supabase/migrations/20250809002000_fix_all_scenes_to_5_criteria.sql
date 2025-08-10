-- Fix all scenes to have 5 evaluation criteria instead of 4
-- This migration ensures all scenes have exactly 5 evaluation criteria

-- First, clear existing scene evaluation criteria for scenes 002-009
DELETE FROM scene_evaluation_criteria WHERE scene_id IN ('scene_002', 'scene_003', 'scene_004', 'scene_005', 'scene_006', 'scene_007', 'scene_008', 'scene_009');

-- Insert 5 evaluation criteria for scene_002 (予約会員対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_002', '予約確認', '事前予約の内容を正確に確認できているか', 5, 1),
    ('scene_002', 'スムーズな案内', '予約に基づいた効率的な案内ができているか', 5, 2),
    ('scene_002', '追加提案', '予約内容以外の追加サービスを適切に提案できているか', 5, 3),
    ('scene_002', '時間配分', '予約時間内で適切な対応ができているか', 5, 4),
    ('scene_002', '満足度向上', '予約会員の満足度をさらに向上させる対応ができているか', 5, 5);

-- Insert 5 evaluation criteria for scene_003 (久しぶりの会員対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_003', '関係性の維持', '久しぶりの来店でも関係性を保った対応ができているか', 5, 1),
    ('scene_003', '変化の把握', '前回からの変化や状況を適切に把握できているか', 5, 2),
    ('scene_003', '継続サポート', '継続的なサポートの提案ができているか', 5, 3),
    ('scene_003', '親近感', '親しみやすく、距離感の良い対応ができているか', 5, 4),
    ('scene_003', '新たな価値提供', '前回とは異なる新たな価値を提供できているか', 5, 5);

-- Insert 5 evaluation criteria for scene_004 (訪問対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_004', '第一印象', '訪問時の第一印象が良く、信頼感を与えられているか', 5, 1),
    ('scene_004', 'マナー', '訪問時の適切なマナーと礼儀正しさができているか', 5, 2),
    ('scene_004', '目的の明確化', '訪問の目的を明確に伝えられているか', 5, 3),
    ('scene_004', '環境適応', 'お客様の環境に適応した対応ができているか', 5, 4),
    ('scene_004', '継続関係の構築', '今後の継続的な関係構築につながる対応ができているか', 5, 5);

-- Insert 5 evaluation criteria for scene_005 (イベント対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_005', 'バランス配慮', '会員と非会員の両方にバランスの良い対応ができているか', 5, 1),
    ('scene_005', 'イベント盛り上げ', 'イベントを盛り上げるような対応ができているか', 5, 2),
    ('scene_005', '新規顧客獲得', '非会員の会員化を意識した対応ができているか', 5, 3),
    ('scene_005', '会員満足', '既存会員の満足度を維持できているか', 5, 4),
    ('scene_005', 'グループ全体の満足', 'グループ全体として満足できる体験を提供できているか', 5, 5);

-- Insert 5 evaluation criteria for scene_006 (アウトバウンド電話)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_006', '声かけの自然さ', '自然で押しつけがましくない声かけができているか', 5, 1),
    ('scene_006', '価値提供', 'お客様にとって価値のある情報を提供できているか', 5, 2),
    ('scene_006', '反応への対応', 'お客様の反応に適切に対応できているか', 5, 3),
    ('scene_006', '次のステップ', '次のアクションを明確に提示できているか', 5, 4),
    ('scene_006', '関係性の強化', '既存の関係性をさらに強化する対応ができているか', 5, 5);

-- Insert 5 evaluation criteria for scene_007 (退会対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_007', '感情への配慮', '辞めたいという感情に適切に配慮できているか', 5, 1),
    ('scene_007', '理由の把握', '辞めたい理由を深く理解できているか', 5, 2),
    ('scene_007', '解決策の提示', '辞めずに済む解決策を提示できているか', 5, 3),
    ('scene_007', '関係性の修復', '関係性を修復するような対応ができているか', 5, 4),
    ('scene_007', '継続の価値', '継続することの価値を適切に伝えられているか', 5, 5);

-- Insert 5 evaluation criteria for scene_008 (SmartLife AO校対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_008', '興味の維持', 'お客様の興味を維持・高める対応ができているか', 5, 1),
    ('scene_008', '不安の解消', 'お客様の不安を適切に解消できているか', 5, 2),
    ('scene_008', '具体的説明', 'SmartLife AO校について具体的で分かりやすく説明できているか', 5, 3),
    ('scene_008', '次のアクション', '具体的な次のステップを提示できているか', 5, 4),
    ('scene_008', '将来の可能性', 'SmartLife AO校での学習がもたらす将来の可能性を伝えられているか', 5, 5);

-- Insert 5 evaluation criteria for scene_009 (紹介客対応)
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_009', '期待値管理', '紹介で来店されたお客様の期待値に適切に対応できているか', 5, 1),
    ('scene_009', '紹介者への配慮', '紹介者への配慮と感謝の気持ちが表現できているか', 5, 2),
    ('scene_009', '信頼関係の構築', '初回でも信頼関係を構築できる対応ができているか', 5, 3),
    ('scene_009', '具体的提案', 'お客様の状況に応じた具体的な提案ができているか', 5, 4),
    ('scene_009', '紹介者の満足', '紹介者も満足できるような対応ができているか', 5, 5);

-- Verify that all scenes now have 5 criteria
SELECT 
    scene_id,
    COUNT(*) as criteria_count
FROM scene_evaluation_criteria 
GROUP BY scene_id 
ORDER BY scene_id;
