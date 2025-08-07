-- Add learning planner tables for dashboard enhancement

-- Create reflection_notes table for free-form notes
CREATE TABLE reflection_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- For future user authentication
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create practice_plans table for scheduled practice sessions
CREATE TABLE practice_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- For future user authentication
    date DATE NOT NULL,
    scene_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_reflection_notes_user_id ON reflection_notes(user_id);
CREATE INDEX idx_reflection_notes_created_at ON reflection_notes(created_at);
CREATE INDEX idx_practice_plans_user_id ON practice_plans(user_id);
CREATE INDEX idx_practice_plans_date ON practice_plans(date);
CREATE INDEX idx_practice_plans_scene_id ON practice_plans(scene_id);

-- Create updated_at triggers
CREATE TRIGGER update_reflection_notes_updated_at BEFORE UPDATE ON reflection_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_plans_updated_at BEFORE UPDATE ON practice_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE reflection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (prototype only)
CREATE POLICY IF NOT EXISTS "Public Access" ON reflection_notes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Public Access" ON practice_plans FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO reflection_notes (user_id, content, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'scene_009の紹介客対応で、期待値の高いお客様への接客スキルが向上しました。紹介元への配慮も忘れずに。', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000000', 'scene_007のネガティブケース対応で、お客様の気持ちに寄り添うことの重要性を再認識しました。冷静な対応を心がけます。', NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000000', 'scene_005の電話対応練習で、声のトーンと話し方の改善を実感できました。次回はより自然な会話を心がけたい。', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000000', 'scene_003の商品説明で、お客様のニーズを詳しく聞き取ることの大切さを学びました。より具体的な提案ができるようになりました。', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'scene_001の初回接客で、挨拶と笑顔の重要性を再確認しました。お客様の第一印象を大切にしたい。', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', 'scene_008のクレーム対応で、お客様の気持ちに寄り添いながら解決策を提示することの難しさを実感しました。', NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000000', 'scene_006の在庫確認で、正確な情報提供と迅速な対応のバランスの大切さを学びました。', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000000', 'scene_004の商品提案で、お客様の予算に合わせた提案の重要性を再認識しました。', NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000000', 'scene_002の接客で、お客様の話を最後まで聞くことの大切さを学びました。急いで結論を出さないようにしたい。', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000000', '今日のクレーム対応で、お客様の気持ちに寄り添うことの大切さを学びました。次回はもっと具体的な解決策を提示できるよう準備したい。', NOW() - INTERVAL '8 days');

INSERT INTO practice_plans (user_id, date, scene_id, note) VALUES
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '1 day', 
 (SELECT id FROM scenarios WHERE title = '商品の不具合に関するクレーム' LIMIT 1), 
 'クレーム対応の練習を重点的に行いたい'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '3 days', 
 (SELECT id FROM scenarios WHERE title = '電話での在庫確認' LIMIT 1), 
 '電話対応のスキル向上のため'),
('00000000-0000-0000-0000-000000000000', CURRENT_DATE + INTERVAL '7 days', 
 (SELECT id FROM scenarios WHERE title = '初めてのお客様への商品説明' LIMIT 1), 
 '初回接客の基本を再確認'); 