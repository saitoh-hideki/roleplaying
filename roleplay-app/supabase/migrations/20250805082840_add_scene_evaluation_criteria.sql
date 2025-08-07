-- Add scene evaluation criteria table for scene management
CREATE TABLE scene_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    criterion_description TEXT,
    max_score INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add type column to evaluation_criteria table to distinguish between basic and scene-specific criteria
ALTER TABLE evaluation_criteria ADD COLUMN type TEXT NOT NULL DEFAULT 'basic' CHECK (type IN ('basic', 'scene'));

-- Create index for better performance
CREATE INDEX idx_scene_evaluation_criteria_scene_id ON scene_evaluation_criteria(scene_id);

-- Create updated_at trigger
CREATE TRIGGER update_scene_evaluation_criteria_updated_at BEFORE UPDATE ON scene_evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE scene_evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY IF NOT EXISTS "Public Access" ON scene_evaluation_criteria FOR ALL USING (true);

-- Insert sample evaluation criteria for existing scenes
INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    ('scene_001', '挨拶', '適切な挨拶とお出迎えができているか', 5, 1),
    ('scene_001', '状況把握', 'お客様の困りごとを正確に理解できているか', 5, 2),
    ('scene_001', '説明の分かりやすさ', '技術的な内容を分かりやすく説明できているか', 5, 3),
    ('scene_001', '信頼感', '専門家として信頼できる対応ができているか', 5, 4),
    ('scene_001', '解決策の提示', '具体的で実現可能な解決策を提示できているか', 5, 5),
    
    ('scene_002', '予約確認', '事前予約の内容を正確に確認できているか', 5, 1),
    ('scene_002', 'スムーズな案内', '予約に基づいた効率的な案内ができているか', 5, 2),
    ('scene_002', '追加提案', '予約内容以外の追加サービスを適切に提案できているか', 5, 3),
    ('scene_002', '時間配分', '予約時間内で適切な対応ができているか', 5, 4),
    
    ('scene_003', '関係性の維持', '久しぶりの来店でも関係性を保った対応ができているか', 5, 1),
    ('scene_003', '変化の把握', '前回からの変化や状況を適切に把握できているか', 5, 2),
    ('scene_003', '継続サポート', '継続的なサポートの提案ができているか', 5, 3),
    ('scene_003', '親近感', '親しみやすく、距離感の良い対応ができているか', 5, 4),
    
    ('scene_004', '第一印象', '訪問時の第一印象が良く、信頼感を与えられているか', 5, 1),
    ('scene_004', 'マナー', '訪問時の適切なマナーと礼儀正しさができているか', 5, 2),
    ('scene_004', '目的の明確化', '訪問の目的を明確に伝えられているか', 5, 3),
    ('scene_004', '環境適応', 'お客様の環境に適応した対応ができているか', 5, 4),
    
    ('scene_005', 'バランス配慮', '会員と非会員の両方にバランスの良い対応ができているか', 5, 1),
    ('scene_005', 'イベント盛り上げ', 'イベントを盛り上げるような対応ができているか', 5, 2),
    ('scene_005', '新規顧客獲得', '非会員の会員化を意識した対応ができているか', 5, 3),
    ('scene_005', '会員満足', '既存会員の満足度を維持できているか', 5, 4),
    
    ('scene_006', '声かけの自然さ', '自然で押しつけがましくない声かけができているか', 5, 1),
    ('scene_006', '価値提供', 'お客様にとって価値のある情報を提供できているか', 5, 2),
    ('scene_006', '反応への対応', 'お客様の反応に適切に対応できているか', 5, 3),
    ('scene_006', '次のステップ', '次のアクションを明確に提示できているか', 5, 4),
    
    ('scene_007', '感情への配慮', '辞めたいという感情に適切に配慮できているか', 5, 1),
    ('scene_007', '理由の把握', '辞めたい理由を深く理解できているか', 5, 2),
    ('scene_007', '解決策の提示', '辞めずに済む解決策を提示できているか', 5, 3),
    ('scene_007', '関係性の修復', '関係性を修復するような対応ができているか', 5, 4),
    
    ('scene_008', '興味の維持', 'お客様の興味を維持・高める対応ができているか', 5, 1),
    ('scene_008', '不安の解消', 'お客様の不安を適切に解消できているか', 5, 2),
    ('scene_008', '具体的説明', 'SmartLife AO校について具体的で分かりやすく説明できているか', 5, 3),
    ('scene_008', '次のアクション', '具体的な次のステップを提示できているか', 5, 4),
    
    ('scene_009', '期待値管理', '紹介で来店されたお客様の期待値に適切に対応できているか', 5, 1),
    ('scene_009', '紹介者への配慮', '紹介者への配慮と感謝の気持ちが表現できているか', 5, 2),
    ('scene_009', '信頼関係の構築', '初回でも信頼関係を構築できる対応ができているか', 5, 3),
    ('scene_009', '具体的提案', 'お客様の状況に応じた具体的な提案ができているか', 5, 4); 