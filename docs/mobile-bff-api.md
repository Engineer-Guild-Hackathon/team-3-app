# モバイル BFF API リファレンス（v1）

本書はモバイルアプリ向け Backend-for-Frontend (BFF) の REST API 仕様をまとめたものです。認証とチャット関連エンドポイントを中心に、現在実装済みの `/api/v1/*` をカバーします。詳細なスキーマは `openapi/mobile-bff-v1.yaml` を参照してください。

## 共通事項

- **ベースURL**
  - 本番: `https://api.spar-app.com`
  - ステージング: `https://api-stg.spar-app.com`
  - ローカル: `http://127.0.0.1:3000`
- **認証方式**: Bearer Token（AppJWT）。Scope は必要に応じて `profile:read`, `chat:rw`, `push:register`, `iap:verify` を要求します。
- **CORS**: `Access-Control-Allow-Origin` はモバイル許可リストに限定。`Allow-Credentials: false`。
- **エラーフォーマット**: `{ "code": "invalid_request", "message": "..." }`。HTTP ステータスは 400/401/403/404/409/422/429/500 を利用します。
- **論理削除**: チャットは `deletedAt` を設定することで削除扱い。復元 API 追加の余地を残しています。

---

## 認証系

### `GET /api/v1/auth/start`
- **Purpose**: OIDC (PKCE) フロー開始に必要なメタ情報を返却。
- **Response**
  ```json
  {
    "authorizationEndpoint": "https://.../authorize",
    "clientId": "...",
    "redirectUri": "spar://auth/callback",
    "scope": "openid profile email",
    "codeChallengeMethod": "S256"
  }
  ```
- **Auth**: なし。

### `GET /api/v1/auth/callback`
- **Purpose**: 認可コードを AppJWT / Refresh Token に交換。
- **Query**: `code` (必須), `state` (任意), `deviceId` (必須)、`x-code-verifier` ヘッダ（PKCE）。
- **Response** (`AuthTokens`)
  - `accessToken`, `accessTokenExpiresIn`, `refreshToken`, `refreshTokenExpiresAt`, `deviceId`
- **Rate limit**: なし（ただし PKCE 必須）。

### `POST /api/v1/auth/refresh`
- **Purpose**: Refresh Token をローテーション。AppJWT を再発行。
- **Body**
  ```json
  {
    "refreshToken": "string",
    "deviceId": "string"
  }
  ```
- **Response**: `AuthTokens`
- **エラー例**: `invalid_refresh_token`（紐付け不一致/期限切れ等）。
- **Rate limit**: 429（過剰リクエスト）。

---

## プロフィール

### `GET /api/v1/me`
- **Scope**: `profile:read`
- **Response**
  ```json
  {
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "User"
    },
    "auth": {
      "scopes": ["profile:read", "chat:rw"],
      "source": "bearer",
      "tokenType": "access",
      "deviceId": "device-1"
    }
  }
  ```
- **備考**: DB エラー時は `email`/`displayName` が `null` で返ります。

---

## チャット

### `GET /api/v1/chats`
- **Scope**: `chat:rw`
- **Query**: `limit` (1–200, default 50)。現状 `nextCursor` は常に `null`。
- **Response**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "status": "in_progress",
        "subjectId": "uuid|null",
        "topicId": "uuid|null",
        "updatedAt": "ISO8601",
        "createdAt": "ISO8601"
      }
    ],
    "nextCursor": null
  }
  ```
- **注意**: `deletedAt` が設定されたチャットは一覧に含まれません。

### `POST /api/v1/chats`
- **Scope**: `chat:rw`
- **Body**
  ```json
  {
    "title": "string (optional)",
    "subjectId": "uuid|null",
    "topicId": "uuid|null"
  }
  ```
- **Response**: 作成された `ChatItem`
- **Validation**: JSON 以外は 400、DB 未接続は 503。

### `PATCH /api/v1/chats/{id}`
- **Scope**: `chat:rw`
- **Body**（任意項目のみ更新）
  ```json
  {
    "title": "string",
    "status": "in_progress|ended",
    "subjectId": "uuid|null",
    "topicId": "uuid|null"
  }
  ```
- **Response**: 204（成功時）
- **エラー**: 400（更新対象なし/値不正）、404（存在しない or 他ユーザー）、503（DB不在）。

### `DELETE /api/v1/chats/{id}`
- **Scope**: `chat:rw`
- **挙動**: `deletedAt` と `updatedAt` を `now()` で更新。204 を返す。
- **備考**: 冪等性あり。既に削除済み or 所有者以外の場合は 404。

### `/api/v1/chats/{id}/messages` (GET)
- **現在**: 仕様のみ定義あり。実装はフェーズ2後半予定。`limit` / `cursor` でメッセージ履歴を取得します。

### `POST /api/v1/chat`
- **Purpose**: LLM 呼び出し。history とメタ情報を渡して回答を受け取る。
- **Body (抜粋)**
  ```json
  {
    "chatId": "uuid|null",
    "history": [ { "role": "user", "content": "..." } ],
    "clientSessionId": "string|null"
  }
  ```
- **レスポンス**: `{ "answer": "string", "status": -1|0|1, "chatId": "uuid" }`
- **Rate limit**: 5リクエスト/10秒（429）。
- **備考**: `clientSessionId` が未指定の場合は新しいチャットを作成し、LLM 出力を `messages` テーブルに保存します。

---

## Push 通知

### `POST /api/v1/push/register`
- **Scope**: `push:register`
- **Body**
  ```json
  {
    "deviceId": "string",
    "platform": "ios|android",
    "token": "string",
    "model": "string (optional)",
    "osVersion": "string (optional)"
  }
  ```
- **Response**: 204
- **備考**: dev トークン（`dev:`）のときは DB 未接続でも 204 を返す。実機検証 TODO は `docs/mobile-push-testing-todo.md` を参照。

---

## 課金

### `POST /api/v1/iap/verify`
- **Scope**: `iap:verify`
- **Body**
  ```json
  {
    "platform": "ios|android",
    "receipt": "...",
    "deviceId": "string"
  }
  ```
- **Response** 例
  ```json
  {
    "status": "active",
    "productId": "spar.pro.monthly",
    "expiresAt": "2025-01-01T00:00:00Z"
  }
  ```
- **エラー**: 422（不正レシート/期限切れ）。

---

## 付録

- **OpenAPI**: `openapi/mobile-bff-v1.yaml`
- **開発ハンドブック**: `docs/mobile-bff-auth.md`（認証／QA 手順）
- **要件定義**: `docs/mobile-requirements-spec.md`
- **チャットBFF変更メモ**: `docs/phase2-chat-bff-notes.md`

今後、メッセージ一覧やチャット実行 API の詳細仕様が固まり次第、本ドキュメントを更新してください。
