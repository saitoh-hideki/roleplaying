-- Supabase Dashboard SQL Editor で実行してください
-- Learning Planner 機能用のテーブル作成（修正版）

-- Create reflection_notes table for free-form notes
CREATE TABLE IF NOT EXISTS reflection_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create practice_plans table for scheduled practice sessions
-- scene_idをTEXTに変更してscenesテーブルと正しく関連付け
CREATE TABLE IF NOT EXISTS practice_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    date DATE NOT NULL,
    scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE, -- scenesテーブルとの外部キー関係
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reflection_notes_user_id ON reflection_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_notes_created_at ON reflection_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_plans_user_id ON practice_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_date ON practice_plans(date);
CREATE INDEX IF NOT EXISTS idx_practice_plans_scene_id ON practice_plans(scene_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_reflection_notes_updated_at ON reflection_notes;
CREATE TRIGGER update_reflection_notes_updated_at 
    BEFORE UPDATE ON reflection_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_plans_updated_at ON practice_plans;
CREATE TRIGGER update_practice_plans_updated_at 
    BEFORE UPDATE ON practice_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE reflection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (prototype only)
DROP POLICY IF EXISTS "Public Access" ON reflection_notes;
CREATE POLICY "Public Access" ON reflection_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access" ON practice_plans;
CREATE POLICY "Public Access" ON practice_plans FOR ALL USING (true);

-- Insert sample reflection notes
INSERT INTO reflection_notes (user_id, content) VALUES
('00000000-0000-0000-0000-000000000000', 'scene_001の初回接客練習で、お客様の困りごとを丁寧に聞き取ることの大切さを学びました。次回はもっと具体的な解決策を提示できるよう準備したい。'),
('00000000-0000-0000-0000-000000000000', 'scene_003の久しぶりの会員様対応で、関係性を活かした自然な接客ができるようになりました。継続して練習を続けます。'),
('00000000-0000-0000-0000-000000000000', 'scene_006の電話対応練習で、声のトーンや話し方の改善を実感できました。アウトバウンド型の対応も上達しています。'),
('00000000-0000-0000-0000-000000000000', 'scene_007のネガティブケース対応で、お客様の気持ちに寄り添うことの重要性を再認識しました。冷静な対応を心がけます。'),
('00000000-0000-0000-0000-000000000000', 'scene_009の紹介客対応で、期待値の高いお客様への接客スキルが向上しました。紹介元への配慮も忘れずに。')
ON CONFLICT DO NOTHING;

-- Insert sample practice plans using the 9 scenes
INSERT INTO practice_plans (user_id, date, scene_id, note) VALUES
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '1 day', 'scene_001', '初回接客の基本練習 - パソコン調子不良のお客様対応'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '2 days', 'scene_002', '予約済み会員様のスムーズな接客練習'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '3 days', 'scene_003', '久しぶりの会員様との関係構築練習'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '5 days', 'scene_004', '訪問対応の第一印象作り練習'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '7 days', 'scene_005', 'イベント時の複数客対応練習'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '10 days', 'scene_006', 'アウトバウンド電話対応のスキル向上'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '12 days', 'scene_007', 'ネガティブケースの対応練習 - 退会希望者対応'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '14 days', 'scene_008', '前向きな提案の練習 - SmartLife AO校紹介'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '16 days', 'scene_009', '紹介客への期待値管理練習')
ON CONFLICT DO NOTHING;

-- 確認用クエリ
SELECT 'reflection_notes' as table_name, COUNT(*) as count FROM reflection_notes
UNION ALL
SELECT 'practice_plans' as table_name, COUNT(*) as count FROM practice_plans
UNION ALL
SELECT 'scenes' as table_name, COUNT(*) as count FROM scenes; 