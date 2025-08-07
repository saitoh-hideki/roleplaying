-- Create feedback_reflections table for reflective chat functionality
CREATE TABLE feedback_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    user_comment TEXT NOT NULL,
    ai_reply TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for better performance
CREATE INDEX idx_feedback_reflections_evaluation_id ON feedback_reflections(evaluation_id);

-- Enable RLS
ALTER TABLE feedback_reflections ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Public Access" ON feedback_reflections FOR ALL USING (true); 