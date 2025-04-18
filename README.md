# AIコール管理システム

## 概要
このシステムは顧客管理とAIコールの予約・管理を行うためのアプリケーションです。

主な機能：
- 顧客情報の登録・編集・削除
- 顧客ごとのカスタム変数管理
- AIコールの予約と状態管理
- コール履歴の参照

## 技術スタック
- **フレームワーク**: Next.js (App Router)
- **ランタイム**: Bun
- **バリデーション**: Zod
- **API**: Hono RPC
- **データベース**: SQLite + Drizzle
- **UI**: Tailwind CSS + shadcn/ui
- **テスト**: Vitest
- **リンター/フォーマッター**: Biome.js

## プロジェクト詳細
プロジェクトの詳細な要件定義と設計情報は以下のドキュメントを参照してください：

- [要件定義・詳細設計](docs/requirements.md)

## 開発環境のセットアップ
```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun dev
```

## ライセンス
MIT