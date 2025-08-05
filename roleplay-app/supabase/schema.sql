-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create manuals table (接客マニュアル)
CREATE TABLE manuals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create scenarios table (ロールプレイ用の例題)
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    related_manual_id UUID REFERENCES manuals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create evaluation_criteria table (評価基準)
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create recordings table (録音記録)
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create evaluations table (GPTによる総合評価)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    summary_comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create feedback_notes table (項目別フィードバック)
CREATE TABLE feedback_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_recordings_scenario_id ON recordings(scenario_id);
CREATE INDEX idx_evaluations_recording_id ON evaluations(recording_id);
CREATE INDEX idx_feedback_notes_evaluation_id ON feedback_notes(evaluation_id);
CREATE INDEX idx_feedback_notes_criterion_id ON feedback_notes(criterion_id);
CREATE INDEX idx_scenarios_related_manual_id ON scenarios(related_manual_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON manuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_criteria_updated_at BEFORE UPDATE ON evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default evaluation criteria
INSERT INTO evaluation_criteria (label, description, max_score) VALUES
    ('敬語・言葉遣い', '適切な敬語と丁寧な言葉遣いができているか', 5),
    ('共感・傾聴', 'お客様の気持ちに寄り添い、しっかりと話を聞けているか', 5),
    ('説明の分かりやすさ', '商品やサービスの説明が明確で理解しやすいか', 5),
    ('問題解決力', 'お客様の問題や要望に対して適切な解決策を提示できているか', 5),
    ('プロフェッショナリズム', '専門知識を活かし、信頼感のある対応ができているか', 5);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (prototype only)
CREATE POLICY "Public Access" ON manuals FOR ALL USING (true);
CREATE POLICY "Public Access" ON scenarios FOR ALL USING (true);
CREATE POLICY "Public Access" ON evaluation_criteria FOR ALL USING (true);
CREATE POLICY "Public Access" ON recordings FOR ALL USING (true);
CREATE POLICY "Public Access" ON evaluations FOR ALL USING (true);
CREATE POLICY "Public Access" ON feedback_notes FOR ALL USING (true);