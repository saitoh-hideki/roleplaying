import { createClient } from '@supabase/supabase-js';

// 環境変数から取得
const supabaseUrl = 'https://navqkresgxxutahyljyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdnFrcmVzZ3h4dXRhaHlsanl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjU0MjIsImV4cCI6MjA2OTk0MTQyMn0.FipT5gb0k239ujfPIDkp-O8YqeBOI6i0ge8ukz443ZA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義のエクスポート
export type { Database } from '../types/database';
