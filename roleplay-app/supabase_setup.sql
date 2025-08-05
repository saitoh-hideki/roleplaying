-- Supabase Dashboard SQL Editor で実行してください
-- Learning Planner 機能用のテーブル作成

-- Create reflection_notes table for free-form notes
CREATE TABLE IF NOT EXISTS reflection_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create practice_plans table for scheduled practice sessions
CREATE TABLE IF NOT EXISTS practice_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    date DATE NOT NULL,
    scene_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
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

-- Insert sample data for testing
INSERT INTO reflection_notes (user_id, content) VALUES
('00000000-0000-0000-0000-000000000000', '今日のクレーム対応で、お客様の気持ちに寄り添うことの大切さを学びました。次回はもっと具体的な解決策を提示できるよう準備したい。'),
('00000000-0000-0000-0000-000000000000', '電話対応の練習を重ねることで、声のトーンや話し方の改善を実感できました。継続して練習を続けます。'),
('00000000-0000-0000-0000-000000000000', '商品説明の際に、お客様のニーズをより詳しく聞き取ることで、より適切な提案ができることに気づきました。')
ON CONFLICT DO NOTHING;

-- Insert sample practice plans using scenes table
INSERT INTO practice_plans (user_id, date, scene_id, note) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE + INTERVAL '1 day',
    id,
    '初回接客の基本練習'
FROM scenes 
WHERE id = 'scene_001'
ON CONFLICT DO NOTHING;

INSERT INTO practice_plans (user_id, date, scene_id, note) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE + INTERVAL '3 days',
    id,
    '会員様との関係構築練習'
FROM scenes 
WHERE id = 'scene_003'
ON CONFLICT DO NOTHING;

INSERT INTO practice_plans (user_id, date, scene_id, note) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE + INTERVAL '7 days',
    id,
    '電話対応のスキル向上'
FROM scenes 
WHERE id = 'scene_006'
ON CONFLICT DO NOTHING;

INSERT INTO practice_plans (user_id, date, scene_id, note) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE + INTERVAL '10 days',
    id,
    'ネガティブケースの対応練習'
FROM scenes 
WHERE id = 'scene_007'
ON CONFLICT DO NOTHING;

INSERT INTO practice_plans (user_id, date, scene_id, note) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE + INTERVAL '14 days',
    id,
    '紹介客への対応練習'
FROM scenes 
WHERE id = 'scene_009'
ON CONFLICT DO NOTHING;

-- 確認用クエリ
SELECT 'reflection_notes' as table_name, COUNT(*) as count FROM reflection_notes
UNION ALL
SELECT 'practice_plans' as table_name, COUNT(*) as count FROM practice_plans; 