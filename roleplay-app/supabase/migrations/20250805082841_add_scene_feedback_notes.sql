-- Create scene_feedback_notes table for scene-specific evaluation data
CREATE TABLE scene_feedback_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    scene_criterion_id UUID REFERENCES scene_evaluation_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for better performance
CREATE INDEX idx_scene_feedback_notes_evaluation_id ON scene_feedback_notes(evaluation_id);
CREATE INDEX idx_scene_feedback_notes_criterion_id ON scene_feedback_notes(scene_criterion_id);

-- Create updated_at trigger
CREATE TRIGGER update_scene_feedback_notes_updated_at BEFORE UPDATE ON scene_feedback_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE scene_feedback_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Public Access" ON scene_feedback_notes FOR ALL USING (true); 