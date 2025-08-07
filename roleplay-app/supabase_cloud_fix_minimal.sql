-- クラウド版Supabase用の最小限修正SQL
-- Supabase DashboardのSQL Editorで実行してください

-- 1. evaluation_criteriaテーブルにtypeカラムを追加
ALTER TABLE evaluation_criteria 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'basic' CHECK (type IN ('basic', 'scene'));

-- 2. 既存のデータをbasicタイプに設定
UPDATE evaluation_criteria 
SET type = 'basic' 
WHERE type IS NULL OR type = '';

-- 3. feedback_reflectionsテーブルを作成（振り返りチャット用）
CREATE TABLE IF NOT EXISTS feedback_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    user_comment TEXT NOT NULL,
    ai_reply TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_feedback_reflections_evaluation_id ON feedback_reflections(evaluation_id);

-- 5. RLSを有効化
ALTER TABLE feedback_reflections ENABLE ROW LEVEL SECURITY;

-- 6. ポリシーを作成
CREATE POLICY IF NOT EXISTS "Public Access" ON feedback_reflections FOR ALL USING (true);

-- 7. 確認クエリ
SELECT 'evaluation_criteria table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'evaluation_criteria' 
ORDER BY ordinal_position;

SELECT 'feedback_reflections table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'feedback_reflections' 
ORDER BY ordinal_position;

SELECT 'Sample data from evaluation_criteria:' as info;
SELECT id, label, type FROM evaluation_criteria LIMIT 5; 