-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recordings',
  'recordings',
  true,
  52428800, -- 50MB
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for recordings bucket
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
  FOR ALL USING (bucket_id = 'recordings');
