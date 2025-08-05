# 接客ロープレ SaaSアプリ

接客スタッフ向けの社員研修用ロールプレイアプリケーションです。

## 機能

- 🎙️ **音声録音**: ブラウザから直接音声を録音
- 🤖 **AI評価**: OpenAI GPT-4oによる自動評価とフィードバック
- 📊 **スコア管理**: 評価履歴とスコア推移の可視化
- 📚 **柔軟な管理**: マニュアル・評価項目・シナリオの管理

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルはすでに作成済みです。

### 3. Supabaseのセットアップ

1. Supabaseプロジェクトでデータベーステーブルを作成:
```bash
# supabase/schema.sql をSupabaseのSQL Editorで実行
```

2. ストレージバケットを作成:
```bash
# supabase/storage.sql をSupabaseのSQL Editorで実行
```

3. サンプルデータを挿入（任意）:
```bash
# supabase/seed.sql をSupabaseのSQL Editorで実行
```

4. Edge Functionsをデプロイ:
```bash
supabase functions deploy whisper
supabase functions deploy evaluate
```

### 4. OpenAI APIキーの設定

SupabaseプロジェクトのSecretsに`OPENAI_API_KEY`を設定してください。

## 開発

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## ビルド

```bash
npm run build
```

## デプロイ

VercelまたはRailwayにデプロイできます。環境変数を忘れずに設定してください。

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # ダッシュボード
│   ├── record/            # 録音画面
│   ├── result/[id]/       # 結果表示
│   ├── history/           # 履歴一覧
│   └── admin/             # 管理画面
├── components/            # UIコンポーネント
├── lib/                   # ユーティリティ
└── types/                 # TypeScript型定義
```

## 注意事項

- 本プロトタイプは認証なしで実装されています
- 本番環境では適切な認証機能の実装が必要です
- OpenAI APIの利用料金にご注意ください