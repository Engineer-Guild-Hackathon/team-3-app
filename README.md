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
- チャットUI: ChatGPT風のメイン画面を `apps/web/src/app/page.tsx` で提供しています。

### リポジトリ構成（モノレポ）

```
apps/
  web/            # 既存 Next.js アプリ
packages/
  api-client/     # Web/Mobile 共通の API クライアント（準備中）
  auth-shared/    # 認証・トークン共通ロジック（準備中）
  db/             # Drizzle スキーマ共有（準備中）
  types/          # 型定義パッケージ（準備中）
openapi/
  mobile-bff-v1.yaml  # Mobile BFF の OpenAPI 定義
```

ルート `package.json` は npm workspaces を利用し、`npm run dev` などのコマンドは `apps/web` のスクリプトへ委譲しています。

### 認証（即席: Google + Auth.js/NextAuth）

- 目的: 未ログインユーザーのアクセスを遮断し、ユーザー識別を可能にするための暫定措置。
- 方式: next-auth v4 + Google プロバイダ。`/login` でログイン、ミドルウェアで保護。
- 主なファイル:
  - `apps/web/src/auth.ts`: 認証設定（ドメイン制限は `ALLOWED_EMAIL_DOMAIN`）
  - `apps/web/src/app/api/auth/[...nextauth]/route.ts`: 認証ハンドラ
  - `apps/web/src/middleware.ts`: ルート保護（`/login` と `/api/auth` は除外）
  - `apps/web/src/app/login/page.tsx`: ログインページ（Google ボタン）
  - `apps/web/src/components/auth/UserMenu.tsx`: ヘッダーのユーザーメニュー（ログアウト）

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
  - `apps/web/src/components/ChatApp.tsx`: 画面全体のコンテナ
  - `apps/web/src/components/chat/*`: メッセージ表示・送信欄
  - `apps/web/src/components/sidebar/Sidebar.tsx`: 左サイドバー
  - `apps/web/src/types/chat.ts`: 型定義

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

### テスト

Vitest を利用したテストスイートが用意されています。

```bash
npm run test      # 共有ユーティリティと /api/v1/auth/* の動作検証
```

Taskfile の `task test` でも同じコマンドを実行できます。CI (`task ci:all`) では lint/typecheck/build に加えてこのテストが自動で走ります。

- モバイル BFF 認証の手動チェックや個別テストコマンドは `docs/mobile-bff-auth.md` を参照してください。

### API（チャット基盤 / フェーズA）

- `POST /api/chat` — LLM実行 + 永続化（要認証）
  - 入力: `{ chatId: number, subject: string, theme: string, description?: string, clientSessionId?: string, history: {assistant: string, user: string}[] }`
  - 出力: `{ ok: true, result: { chatId: number, answer: string, status: -1|0|1 } }`
  - 備考: `clientSessionId`（UIのセッションUUID）指定時は `chats/messages` へ保存されます。

- `GET /api/chats` — 自分のチャット一覧（要認証）
  - クエリ: `?limit=1..200`（省略時50）
  - 出力: `{ ok: true, result: { items: [{ id, title, status, createdAt, updatedAt }] } }`

- `POST /api/chats` — チャット作成（要認証）
  - 入力: `{ title?: string, subjectId?: string }`
  - 出力: `{ ok: true, result: { id, title, status, createdAt, updatedAt } }`

- `PATCH /api/chats/:id` — タイトル変更（要認証）
  - 入力: `{ title: string }`
  - 出力: `{ ok: true, result: { id, title, updatedAt } }`

- `DELETE /api/chats/:id` — チャット削除（要認証）
  - 出力: `{ ok: true, result: { id } }`

- `GET /api/chats/:id/messages` — メッセージ履歴（要認証・所有者のみ）
  - クエリ: `?limit=1..1000`（省略時全件 / createdAt 昇順）
  - 出力: `{ ok: true, result: { chatId, items: [{ id, role, content, createdAt }] } }`

所有者判定は認証セッションの `email` から `users.id` を解決して実施しています。

### フロントエンドの挙動（フェーズA）

- サイドバー一覧は `GET /api/chats` の結果を優先して表示（LocalStorage はフォールバック）。
- チャット画面の履歴は `GET /api/chats/:id/messages` を初回のみ取得し、以後はクライアント側に保持。
- 401 は `/login` に誘導。404（存在しない/権限なし）は画面中央に案内を表示し、トップ遷移/新規作成の導線を提供。
- 新規作成/名称変更/削除は `/api/chats` の CRUD を呼び出し、UIへ反映します。

### パフォーマンス

- 追加インデックス（Drizzle SQL / 0002）
  - `chats(user_id, updated_at desc)` / `messages(chat_id, created_at asc)`
  - 初回は `task db:migrate` で適用してください。
