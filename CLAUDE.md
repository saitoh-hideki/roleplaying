# 接客ロープレイ SaaSアプリ

## プロジェクト概要

接客スタッフ向けの社員研修用ロールプレイアプリケーションです。

### 主な機能
- **音声録音**: PCマイクで録音し、Whisperで音声をテキスト化
- **AI評価**: OpenAI GPT-4oによる社内ルールに基づく自動評価（コーチスタイル）
- **フィードバック**: スコアとコメント形式での詳細なフィードバック
- **柔軟な管理**: 企業ごとにマニュアル・評価項目・例題を管理可能

## 技術スタック

- **バックエンド**: Supabase (PostgreSQL, Storage, Edge Functions)
- **フロントエンド**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **AI連携**: OpenAI Whisper (音声認識), GPT-4o (評価・コメント生成)
- **デプロイ**: Vercel または Railway

## Supabase接続情報

- **URL**: `https://navqkresgxxutahyljyx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdnFrcmVzZ3h4dXRhaHlsanl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjU0MjIsImV4cCI6MjA2OTk0MTQyMn0.FipT5gb0k239ujfPIDkp-O8YqeBOI6i0ge8ukz443ZA`

## OpenAI APIキー管理

1. Supabaseプロジェクトの「Secrets」に`OPENAI_API_KEY`として登録
2. Edge FunctionsでDeno.env.get('OPENAI_API_KEY')で取得
3. GPT-4oとWhisperの呼び出しはSupabase Edge Functions側で処理

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リンターとタイプチェック
npm run lint
npm run type-check
```

## データベース構成

### テーブル一覧
1. **manuals**: 接客マニュアル管理
2. **scenarios**: ロールプレイ用の例題
3. **evaluation_criteria**: 評価基準
4. **recordings**: 録音記録
5. **evaluations**: GPTによる総合評価
6. **feedback_notes**: 項目別フィードバック

## 画面構成

### ユーザー向け画面
- `/dashboard` - ダッシュボード（最近のロープレ、スコア推移）
- `/record` - 録音画面（シナリオ選択、録音）
- `/result/[id]` - 結果表示（スコア、フィードバック）
- `/history` - 履歴一覧

### 管理画面
- `/admin/manuals` - マニュアル管理
- `/admin/criteria` - 評価基準管理
- `/admin/scenarios` - シナリオ管理

## Edge Functions

### /whisper
音声ファイルをWhisper APIでテキスト化

### /evaluate
録音内容をGPT-4oで評価し、スコアとフィードバックを生成

## 開発フロー

1. Supabaseでテーブル作成
2. Edge Functionsの実装
3. フロントエンド画面の実装
4. 録音→評価→結果表示の流れを構築
5. 管理画面の実装

## 注意事項

- 本プロトタイプは認証なしで実装（全ユーザー共通利用）
- 本番環境では適切な認証機能の実装が必要
- OpenAI APIキーは必ずSupabase Secretsで管理すること