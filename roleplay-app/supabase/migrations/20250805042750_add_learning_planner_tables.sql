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
CREATE POLICY "Public Access" ON reflection_notes FOR ALL USING (true);
CREATE POLICY "Public Access" ON practice_plans FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO reflection_notes (user_id, content) VALUES
('00000000-0000-0000-0000-000000000000', '今日のクレーム対応で、お客様の気持ちに寄り添うことの大切さを学びました。次回はもっと具体的な解決策を提示できるよう準備したい。'),
('00000000-0000-0000-0000-000000000000', '電話対応の練習を重ねることで、声のトーンや話し方の改善を実感できました。継続して練習を続けます。'),
('00000000-0000-0000-0000-000000000000', '商品説明の際に、お客様のニーズをより詳しく聞き取ることで、より適切な提案ができることに気づきました。');

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