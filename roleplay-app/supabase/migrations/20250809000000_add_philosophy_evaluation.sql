-- Create philosophy evaluation criteria (vision/mission/purpose)
CREATE TABLE philosophy_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL CHECK (code IN ('vision','mission','purpose')),
    label TEXT NOT NULL,
    description TEXT,
    max_score INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Link evaluation with philosophy feedback notes
CREATE TABLE philosophy_feedback_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    philosophy_criterion_id UUID REFERENCES philosophy_evaluation_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_philosophy_feedback_notes_evaluation_id ON philosophy_feedback_notes(evaluation_id);
CREATE INDEX idx_philosophy_feedback_notes_criterion_id ON philosophy_feedback_notes(philosophy_criterion_id);

-- Triggers
CREATE TRIGGER update_philosophy_evaluation_criteria_updated_at BEFORE UPDATE ON philosophy_evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS and policies (prototype: public)
ALTER TABLE philosophy_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE philosophy_feedback_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON philosophy_evaluation_criteria FOR ALL USING (true);
CREATE POLICY "Public Access" ON philosophy_feedback_notes FOR ALL USING (true);

-- Seed default criteria
INSERT INTO philosophy_evaluation_criteria (code, label, description, max_score, sort_order) VALUES
  ('vision', 'ビジョン', '組織の未来像を顧客に伝えられているか', 5, 1),
  ('mission', 'ミッション', '行動や提案が組織の使命に沿っているか', 5, 2),
  ('purpose', 'パーパス', '企業の存在意義を感じさせる接客ができているか', 5, 3);


