import { createClient } from '@supabase/supabase-js';

// 環境変数から取得（実際のアプリでは適切な環境変数管理が必要）
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義のエクスポート
export type { Database } from '../types/database';
