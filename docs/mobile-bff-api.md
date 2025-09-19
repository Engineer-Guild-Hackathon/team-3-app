# モバイル BFF API リファレンス（v1）

本書はモバイルアプリ向け Backend-for-Frontend (BFF) の REST API 仕様をまとめたものです。認証とチャット関連エンドポイントを中心に、現在実装済みの `/api/v1/*` をカバーします。詳細なスキーマは `openapi/mobile-bff-v1.yaml` を参照してください。ここでは「何のために利用する API か」「パラメータの意味」「想定するエラーと対処」を文章として解説します。

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
- **用途**: モバイルアプリ側で OIDC + PKCE を開始する際に呼び出します。返却された `authorizationEndpoint` にブラウザ遷移し、`code_challenge` に `S256` を指定して PKCE コードを生成します。
- **レスポンス項目**
- `authorizationEndpoint`…IdP の `/authorize` URL。AuthSession などで使用。
- `clientId`…モバイル専用クライアント ID。
- `redirectUri`…アプリのカスタムスキーム（例: `spar://auth/callback`）。
- `scope`…要求する OpenID スコープ。初期値は `openid profile email`。
- `codeChallengeMethod`…常に `S256`。
- `devMode`…`BFF_AUTH_DEV_MODE=1` の場合に `true`。モバイル側で dev コード (`dev:email`) を受け付けるか判断するために利用。
- **認証**: 不要。
- **想定エラー**: 設定不足の場合は 500 `configuration_error`。

### `GET /api/v1/auth/callback`
- **用途**: 認可サーバーから返却された code + PKCE verifier を用いて AppJWT/Refresh Token を取得します。同時に `deviceId` を添付し、今後の Refresh や Push 登録とひも付けます。
- **クエリ/ヘッダ**
  - `code`(必須)…IdP から受け取った認可コード。
  - `deviceId`(必須)…端末識別子。クエリに無い場合はヘッダ `x-device-id` を参照。
  - `state`(任意)…IdP の CSRF 対策用。レスポンス `metadata` に保持。
  - `x-code-verifier`(任意)…PKCE の verifier。クエリ `code_verifier` でも可。
- **レスポンス**
  - `accessToken`…15分程度有効な AppJWT。
  - `accessTokenExpiresIn`…残存期限（秒）。
  - `refreshToken` / `refreshTokenExpiresAt`…30日程度で有効期限切れ。
  - `deviceId`…入力された端末識別子をそのまま返却。
- **エラー**: `invalid_request`（code/deviceId 欠如）、`auth_failed`（PKCE 検証失敗等）。

### `POST /api/v1/auth/refresh`
- **用途**: 取得済みの Refresh Token を提示し、AppJWT/Refresh を再発行します。モバイルアプリは起動時やバックグラウンド復帰時にこのエンドポイントを呼び出します。
- **Body**
  ```json
  {
    "refreshToken": "...",
    "deviceId": "端末ID"
  }
  ```
- **レスポンス**: `AuthTokens` と同形式。Refresh Tokenはワンタイム運用のため、旧値はサーバー側で無効化されます。
- **主なエラーコード**
  - `invalid_refresh_token`…トークンが見つからない / 期限切れ / 端末不一致 / すでに revoke。
  - `service_unavailable`…DB 非接続など。
- **レート制限**: 429 （10秒間の過剰リクエスト）。

---

## プロフィール

### `GET /api/v1/me`
- **Scope**: `profile:read`
- **用途**: ログイン後に表示名やメールを表示する、トークン由来のスコープや `deviceId` を確認するために使用。
- **レスポンス構造**
  - `profile.id`…`users` テーブルの UUID。
  - `profile.email`…正規化済みメールアドレス。DB エラー時は `null`。
  - `profile.displayName`…表示名。未設定なら `null`。
  - `auth.scopes`…Bearer トークンに付与されたスコープ一覧。
  - `auth.source`…`bearer` もしくは Cookie fallback（現在は `bearer` のみ想定）。
  - `auth.tokenType`…`access|refresh|unknown`。アクセストークン検証結果。
  - `auth.deviceId`…AppJWT に埋め込まれた `device_id`。Refresh ローテーションや Push 登録と連携。
- **備考**: プロフィール取得で例外が発生した場合でも API 自体は 200 を返し、メール／表示名のみ `null` にフォールバックします。

---

## チャット

### `GET /api/v1/chats`
- **Scope**: `chat:rw`
- **用途**: ホーム画面の履歴表示や再想起一覧の取得に使用。`deletedAt` が設定されたチャットは省かれます。
- **Query**
  - `limit`…最大件数。1〜200。数字以外は既定の 50 を採用。将来的に `cursor` が追加予定。
- **Response（一部）**
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
- **用途**: 新規チャットを作成し、履歴一覧に反映する。モバイルではチャット開始時に自動作成する運用を想定。
- **Body**
  - `title`…任意。未指定または空文字は `新しいチャット`。
  - `subjectId`/`topicId`…学習科目・テーマの初期値。省略時は `null`。
- **レスポンス**: 作成された `ChatItem` を 201 で返却。
- **主なエラー**
  - 400 `invalid_request`…JSON でない、もしくは Body が解釈できない場合。
  - 401/403…認可エラー。
  - 503…DB 接続不可。

### `PATCH /api/v1/chats/{id}`
- **Scope**: `chat:rw`
- **用途**: チャットタイトル変更、ステータス更新、科目・トピックの再設定を行う。
- **Body**
  - `title`…任意。空文字は禁止。
  - `status`…`in_progress` または `ended`。
  - `subjectId` / `topicId`…再設定したい場合のみ指定。空文字は `null` として扱われます。
- **レスポンス**: 204（body なし）。
- **エラー**
  - 400 `invalid_request`…更新フィールドが無い、値が不正。
  - 404 `not_found`…チャットが存在しない、または削除済み、他ユーザーのリソース。
  - 503 `service_unavailable`…DB 非接続。

### `DELETE /api/v1/chats/{id}`
- **Scope**: `chat:rw`
- **用途**: チャットを論理削除し、履歴から除外する。`deletedAt` に現在時刻を設定。
- **レスポンス**: 204。
- **備考**: 二度目以降は 404。復元 API を実装する場合は `deletedAt` を `null` に更新。

### `GET /api/v1/chats/{id}/messages`
- **Scope**: `chat:rw`
- **用途**: チャット履歴をページング取得。詳細画面で過去メッセージを同期します。
- **Query**
  - `limit`…1〜1000（既定 100）。
- **レスポンス**: `items[]` に `{ id, role, content, createdAt }` を返却。

---

## タグ

### `GET /api/v1/tag-types`
- **Scope**: `profile:read`
- **用途**: タグ類型マスタを取得し、フィルタやバッジ表示を構成。
- **レスポンス例**
  ```json
  {
    "items": [
      { "id": 1, "code": "definition", "label": "定義" },
      { "id": 2, "code": "procedure", "label": "手順" }
    ]
  }
  ```

### `GET /api/v1/tags`
- **Scope**: `chat:rw`
- **用途**: タグ候補リストを取得。科目/トピック/タグ類型によるフィルタをサポート。
- **Query**
  - `subjectId`…UUID。省略時は全科目。
  - `topicId`…UUID。指定時は `subjectId` と整合する必要あり。
  - `tagTypeId`…smallint。タグ類型で絞り込み。
- **レスポンス**: `items[]` に `{ id, name, description, subjectId, topicId, tagTypeId }`。

### `GET /api/v1/chats/{id}/tags`
- **Scope**: `chat:rw`
- **用途**: チャットに付与されたタグ一覧と確信度を取得し、UI に表示。
- **レスポンス例**
  ```json
  {
    "items": [
      {
        "tagId": "9f21…",
        "name": "ベイズの定理",
        "tagTypeId": 1,
        "assignedBy": "ai",
        "confidence": 0.72,
        "createdAt": "2025-09-12T12:02:00Z"
      }
    ]
  }
  ```

### `POST /api/v1/chats/{id}/tags`
- **Scope**: `chat:rw`
- **用途**: チャットにタグを付与。AI 推定・ユーザー手動の双方に対応。
- **Body**
  ```json
  {
    "tagId": "9f21…",
    "assignedBy": "user",
    "confidence": 0.9
  }
  ```
- **備考**: `assignedBy` は `ai` / `user` / `system`。`confidence` を省略した場合は 0.0。

### `DELETE /api/v1/chats/{id}/tags/{tagId}`
- **Scope**: `chat:rw`
- **用途**: 付与済みタグを解除。
- **レスポンス**: 204。

### `GET /api/v1/tag-mastery`
- **Scope**: `profile:read`
- **用途**: ユーザーのタグ理解度一覧を取得。ダッシュボードや推奨学習に利用。
- **レスポンス例**
  ```json
  {
    "items": [
      {
        "tagId": "9f21…",
        "masteryScore": 0.35,
        "lastAssessedAt": "2025-09-12T12:10:00Z"
      }
    ]
  }
  ```

### `POST /api/v1/tags/{id}/mastery`
- **Scope**: `chat:rw`
- **用途**: 自己評価や再想起結果に基づいて理解度を更新。
- **Body**
  ```json
  {
    "masteryScore": 0.6,
    "assessedAt": "2025-09-18T09:00:00Z"
  }
  ```
- **備考**: `masteryScore` は 0.0〜1.0。`assessedAt` 未指定時はサーバ時刻を使用。

### `POST /api/v1/chat`
- **用途**: LLM を呼び出し、回答を取得。モバイルアプリのチャット画面から送信されるメッセージを処理します。
- **Body (抜粋)**
  ```json
  {
    "chatId": "uuid|null",           // 既存チャットがある場合に指定
    "history": [                      // LLM へ渡す会話履歴。role は user/assistant/system
      { "role": "user", "content": "説明します" }
    ],
    "clientSessionId": "uuid|null",  // モバイル側で生成したチャットID。新規時にサーバが利用
    "subject": "数学",                // 任意。チャットの科目ラベル
    "tags": ["uuid"],                // 任意。誤解タグなど
    "metadata": { ... }               // 将来拡張用
  }
  ```
- **レスポンス**
  ```json
  {
    "chatId": "uuid",               // 実際に保存されたチャットID
    "answer": "string",             // LLM 応答
    "status": -1 | 0 | 1,            // 既定の評価値（-1:未確定, 0:通常, 1:終了）
    "messages": [ ... ],             // サーバーが保存したメッセージのサマリ（必要に応じて）
    "tags": ["uuid"],               // 最新タグ
    "metadata": { ... }              // 送信・保存結果に関する補足情報
  }
  ```
- **備考**
  - `clientSessionId` が未指定の場合、サーバー側で新しいチャットを作成します。
  - DB 保存に失敗した場合も API は 200 を返し、`meta.assistantPersisted=false` などのフラグで通知。
  - レート制限はユーザーごとに 5 リクエスト / 10 秒。

---

## Push 通知

### `POST /api/v1/push/register`
- **Scope**: `push:register`
- **用途**: Expo Push Token / APNs Token をサーバに登録。端末モデルや OS バージョンも任意で送信できます。
- **Body**
  ```json
  {
    "deviceId": "端末識別子",
    "platform": "ios",
    "token": "ExponentPushToken[...]",
    "model": "iPhone 15",
    "osVersion": "17.4"
  }
  ```
- **備考**: dev トークン（`dev:` で始まる）を利用すると DB 未接続時でも 204 を返し、ローカル検証を容易にしています。実機検証タスクは `docs/mobile-push-testing-todo.md`。

---

## 課金

### `POST /api/v1/iap/verify`
- **Scope**: `iap:verify`
- **用途**: アプリ内課金レシートをサーバー側で検証し、購読状態を同期します。
- **Body**
  ```json
  {
    "platform": "ios",
    "receipt": "Base64EncodedReceipt",
    "deviceId": "device-123"
  }
  ```
- **レスポンス例**
  ```json
  {
    "status": "active",
    "productId": "spar.pro.monthly",
    "expiresAt": "2025-01-01T00:00:00Z"
  }
  ```
- **エラー**: 不正レシートやストア未同期は 422 `invalid_receipt` を返します。

---

## 付録

- **OpenAPI**: `openapi/mobile-bff-v1.yaml`
- **開発ハンドブック**: `docs/mobile-bff-auth.md`（認証／QA 手順）
- **要件定義**: `docs/mobile-requirements-spec.md`

今後、メッセージ一覧やチャット実行 API の詳細仕様が固まり次第、本ドキュメントを更新してください。
