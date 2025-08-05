-- Supabase Dashboard SQL Editor で実行してください
-- Learning Planner 機能用のテーブル作成（9個のシーン対応版）

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
    scene_id TEXT NOT NULL, -- Changed to TEXT to match scene IDs like 'scene_001'
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

-- Insert sample recordings for dashboard
INSERT INTO recordings (scenario_id, audio_url, transcript) VALUES
('scene_001', 
 'https://example.com/audio1.mp3', 
 'いらっしゃいませ。パソコンの調子が悪いとのことですね。お困りの状況を詳しくお聞かせください。どのような症状が出ていますか？'),

('scene_003', 
 'https://example.com/audio2.mp3', 
 '田中様、お久しぶりです。お元気でしたか？今日はどのようなご用件でしょうか？'),

('scene_006', 
 'https://example.com/audio3.mp3', 
 'お電話ありがとうございます。先日お送りしたDMについて、ご質問やご相談がございましたらお聞かせください。'),

('scene_007', 
 'https://example.com/audio4.mp3', 
 '会員を辞めたいとのことですね。まずはどのようなお考えでいらっしゃるか、お聞かせいただけますでしょうか？'),

('scene_009', 
 'https://example.com/audio5.mp3', 
 '山田様からご紹介いただいたとのことですね。ありがとうございます。どのようなサービスにご興味がございますか？')
ON CONFLICT DO NOTHING;

-- Insert sample evaluations for dashboard
INSERT INTO evaluations (recording_id, total_score, summary_comment) VALUES
((SELECT id FROM recordings WHERE scenario_id = 'scene_001' LIMIT 1), 4, '初回接客として適切な対応でした。お客様の困りごとを丁寧に聞き取ることができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_003' LIMIT 1), 5, '久しぶりの会員様への対応が非常に自然で、関係性を活かした接客ができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_006' LIMIT 1), 3, '電話対応の基本はできていますが、もう少し丁寧な言葉遣いを心がけましょう。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_007' LIMIT 1), 4, 'ネガティブな状況でも冷静に対応できています。お客様の気持ちに寄り添った対応ができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_009' LIMIT 1), 5, '紹介客への対応が非常に適切でした。期待値の高いお客様への接客ができています。')
ON CONFLICT DO NOTHING;

-- 確認用クエリ
SELECT 'reflection_notes' as table_name, COUNT(*) as count FROM reflection_notes
UNION ALL
SELECT 'practice_plans' as table_name, COUNT(*) as count FROM practice_plans
UNION ALL
SELECT 'recordings' as table_name, COUNT(*) as count FROM recordings
UNION ALL
SELECT 'evaluations' as table_name, COUNT(*) as count FROM evaluations; 