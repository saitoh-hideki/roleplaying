# OrgShift RolePlay Mobile App

接客スタッフ向けの社員研修用ロールプレイモバイルアプリ

## 機能

- 🎭 **シーン選択**: 練習したいシーンを選択
- 🎙️ **音声録音**: 高品質な音声録音機能
- 🤖 **AI評価**: GPT + Whisperを使用した自動評価
- 📊 **結果表示**: 詳細な評価結果とフィードバック
- 📱 **モバイル最適化**: タッチ操作に最適化されたUI

## 技術スタック

- **フレームワーク**: Expo (React Native)
- **言語**: TypeScript
- **バックエンド**: Supabase
- **音声処理**: Expo AV
- **AI**: OpenAI GPT + Whisper

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase設定

1. `.env`ファイルを作成（`env.example`をコピー）
2. SupabaseプロジェクトのURLとアノンキーを設定

```bash
cp env.example .env
```

`.env`ファイルを編集：

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. アプリの実行

```bash
# iOSシミュレーター
npm run ios

# Androidエミュレーター
npm run android

# Web版
npm run web
```

## プロジェクト構造

```
src/
├── components/          # 再利用可能なコンポーネント
├── screens/            # 画面コンポーネント
│   ├── HomeScreen.tsx      # ホーム画面
│   ├── ScenesScreen.tsx    # シーン選択画面
│   ├── RecordScreen.tsx    # 録音画面
│   ├── HistoryScreen.tsx   # 履歴画面
│   └── ResultsScreen.tsx   # 結果画面
├── lib/                # ライブラリ設定
│   └── supabase.ts        # Supabaseクライアント
├── types/              # 型定義
│   ├── index.ts            # 基本型定義
│   └── database.ts         # データベース型定義
├── utils/               # ユーティリティ
│   └── mockData.ts         # モックデータ
└── config/              # 設定ファイル
    └── supabase.ts         # Supabase設定
```

## 主要な画面

### ホーム画面
- クイックアクション（録音開始、シーン選択）
- 統計情報の表示
- 最近の練習シーン
- 最近の録音と評価結果

### シーン選択画面
- カテゴリ別フィルタリング
- シーンの詳細情報
- 難易度と所要時間の表示

### 録音画面
- シーン情報の表示
- 録音コントロール
- リアルタイムタイマー
- 録音のヒント

### 履歴画面
- 録音履歴の一覧
- フィルタリング機能
- 統計情報

### 結果画面
- 総合スコアの表示
- 評価項目別の詳細
- 文字起こし結果
- アクションボタン

## データベース構造

主要なテーブル：

- `scenes`: 練習シーン
- `recordings`: 録音データ
- `evaluations`: 評価結果
- `feedback_notes`: フィードバック
- `philosophy_feedback_notes`: 理念評価

## 開発時の注意点

### 音声録音
- iOS/Androidでの権限設定が必要
- ファイルサイズの制限に注意
- ネットワーク接続が必要

### Supabase連携
- 環境変数の設定が必須
- エラーハンドリングの実装
- オフライン対応の検討

### パフォーマンス
- 画像・音声ファイルの最適化
- メモリ使用量の監視
- バッテリー消費の最適化

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数の設定を確認
   - ネットワーク接続を確認
   - Supabaseプロジェクトの状態を確認

2. **音声録音が動作しない**
   - マイク権限の確認
   - デバイスの互換性確認
   - Expo AVの設定確認

3. **ビルドエラー**
   - 依存関係の確認
   - TypeScriptの型エラー確認
   - Expo CLIのバージョン確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、以下を確認してください：

1. ログファイルの確認
2. 環境設定の確認
3. 依存関係のバージョン確認
4. 公式ドキュメントの参照
