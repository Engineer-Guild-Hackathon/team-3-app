# team3 devNeko

---

## チーム情報

- チーム番号: 3
- チーム名: devNeko
- プロダクト名: SPAR
- メンバー: 横内佑哉，渡瀬友裕

---

## デモ　/ プレゼン資料

- デモURL: <https://webappforhackathon-b6guerb9bcgee4h2.centralus-01.azurewebsites.net/>
- プレゼンURL: <https://www.canva.com/design/DAGyrv42Baw/a7s9EgAQwW1ddD_AUlHuyg/view?utm_content=DAGyrv42Baw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h4fcf06890b>
- プロダクトURL: <https://webappforhackathon-b6guerb9bcgee4h2.centralus-01.azurewebsites.net/>

---

## 開発（フロントエンド）

- 技術構成: Next.js (App Router) + React + Tailwind CSS
- チャットUI: ChatGPT風のメイン画面を `src/app/page.tsx` で提供しています。

### 認証（即席: Google + Auth.js/NextAuth）

- 目的: 未ログインユーザーのアクセスを遮断し、ユーザー識別を可能にするための暫定措置。
- 方式: next-auth v4 + Google プロバイダ。`/login` でログイン、ミドルウェアで保護。
- 主なファイル:
  - `src/auth.ts`: 認証設定（ドメイン制限は `ALLOWED_EMAIL_DOMAIN`）
  - `src/app/api/auth/[...nextauth]/route.ts`: 認証ハンドラ
  - `src/middleware.ts`: ルート保護（`/login` と `/api/auth` は除外）
  - `src/app/login/page.tsx`: ログインページ（Google ボタン）
  - `src/components/auth/UserMenu.tsx`: ヘッダーのユーザーメニュー（ログアウト）

セットアップ:

1) `.env` を作成（`.env.example` を参照）
   - `.env.example` はリポジトリで追跡されるため、必要な環境変数の雛形として常に最新化します。

```text
NEXTAUTH_SECRET=（ランダム文字列）
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=（Google Cloud で取得）
GOOGLE_CLIENT_SECRET=（Google Cloud で取得）
# 任意: 指定ドメインのみ許可する場合
# ALLOWED_EMAIL_DOMAIN=school.ac.jp
# 任意: 指定メールのみ許可（カンマ区切り。設定時はこれが最優先）
# ALLOWED_EMAILS=dev1@example.com,dev2@example.com
```

2) Google Cloud Console で OAuth クライアント（Web）を作成し、承認済みリダイレクト URI に以下を追加:

```text
http://localhost:3000/api/auth/callback/google
```

3) 起動後、未ログインで `http://localhost:3000/` にアクセスすると `/login` へリダイレクトします。

ログアウト:

- 画面右上の「ログアウト」ボタンでサインアウトし、`/login` に戻ります。

### セットアップ

```bash
task dev
```

ブラウザで <http://localhost:3000> を開いてください。

開発用 Docker Compose は `.env` を読み込みます（`env_file`）。`NEXTAUTH_*` と `GOOGLE_*` を未設定の場合、認証関連のエンドポイントでエラーとなります。

### 注意

- 既存の `.next/` ディレクトリの所有者が `root` になっている場合、ビルド/開発サーバーが失敗することがあります。その場合は以下のいずれかで権限を修正してください（要管理者権限）。
  - `sudo rm -rf .next`
  - または `sudo chown -R $(whoami) .next`

### 実装メモ

- UIのみのデモであり、モデルAPIとの接続は未実装です。送信後はダミーの応答が表示されます。
- 簡易な会話履歴を LocalStorage に保存します（ブラウザごとに保持）。
- 主要ファイル:
  - `src/components/ChatApp.tsx`: 画面全体のコンテナ
  - `src/components/chat/*`: メッセージ表示・送信欄
  - `src/components/sidebar/Sidebar.tsx`: 左サイドバー
  - `src/types/chat.ts`: 型定義

---

## 環境変数の管理（Compose ベース）

本プロジェクトでは、`.env` の読み込みは Docker Compose で行います。

- `.env.common`: 公開前提の共通設定（GitHub にコミット可）。
- `.env.dev`: 開発者ローカルの上書き設定（Git 管理外）。
- `.env.dev.sample`: `.env.dev` のサンプル。

読み込みルール:

- 開発（`docker-compose.dev.yml`）: `env_file: [.env.common, .env.dev]`（後者が上書き）。
- ステージング/本番（`docker-compose.stg.yml` / `docker-compose.prod.yml`）: `env_file: [.env.common]`。

ローカル手順（Compose 開発）:

```bash
# 開発者ごとに .env.dev を作成
cp .env.dev.sample .env.dev

# dev サービスを起動
docker compose -f docker-compose.dev.yml up --build
```

### データベース操作（Taskfile 簡易化）

```bash
# 起動/停止/状態
task db:up        # Start Postgres(17) + web (detached)
task db:down      # Stop db + web
task db:ps        # Show compose services status
task db:logs      # Tail web/db logs

# マイグレーション & Studio
task db:migrate   # Run Drizzle migrations in web container
task db:studio    # Open Drizzle Studio at http://localhost:4983

# クイックチェック
task db:check     # pgcrypto / tables / views / env
```

Note: 初回は `task db:up` の後に `task db:migrate` を実行してください。
