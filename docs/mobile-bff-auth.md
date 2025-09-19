# Mobile BFF Auth Flow (M0.5)

## OIDC 設定

- `BFF_OIDC_AUTHORIZATION_ENDPOINT` … 認可エンドポイント（例: Azure AD B2C の `/authorize`）。
- `BFF_OIDC_TOKEN_ENDPOINT` … トークンエンドポイント。
- `BFF_OIDC_CLIENT_ID` / `BFF_OIDC_CLIENT_SECRET` … モバイル専用クライアント。
- `BFF_OIDC_REDIRECT_URI` … Expo 側のスキーム (`spar://auth/callback` など)。
- `BFF_OIDC_SCOPE` … `openid profile email` を基本とし、必要に応じて追加。
- `BFF_AUTH_DEV_MODE=1` で `dev:email@example.com` 形式のコードを許可（ローカル検証用）。`/api/v1/auth/start` のレスポンスに `devMode=true` が含まれ、モバイル側で dev コード利用可否を判断します。

## AppJWT

- `BFF_APP_JWT_SECRET` … HMAC 署名用シークレット（Key Vault 管理推奨）。
- `BFF_APP_JWT_ISSUER` / `BFF_APP_JWT_AUDIENCE` … JWT の iss / aud を設定。
- `BFF_APP_JWT_ACCESS_TTL` … アクセストークン寿命（秒）。既定 900 秒 (15 分)。
- `BFF_APP_JWT_REFRESH_TTL` … リフレッシュトークン寿命（秒）。既定 30 日。

## 開発時のハンドシェイク手順

1. `GET /api/v1/auth/start` で OIDC メタ情報を取得。
2. モバイル側で PKCE と認可コードを取得（開発モードでは `dev:user@example.com` をコードとして渡せば即時完了）。
3. `GET /api/v1/auth/callback?code=...&deviceId=...&state=...` でコード交換。必要に応じて `x-code-verifier` ヘッダーを付与。
4. 応答に含まれる `accessToken` と `refreshToken` を安全に保存（SecureStore）。
5. `POST /api/v1/auth/refresh` に `{ refreshToken, deviceId }` を渡してローテーション。

## ローカル環境変数（例）

`.env.common` に以下のプレースホルダを追加済み。実機値は `.env.local` など Git 管理外で上書きする。

```dotenv
BFF_OIDC_AUTHORIZATION_ENDPOINT=https://example-tenant.b2clogin.com/oauth2/v2.0/authorize
BFF_OIDC_TOKEN_ENDPOINT=https://example-tenant.b2clogin.com/oauth2/v2.0/token
BFF_OIDC_CLIENT_ID=00000000-0000-0000-0000-000000000000
BFF_OIDC_REDIRECT_URI=spar://auth/callback
BFF_OIDC_SCOPE=openid profile email

BFF_APP_JWT_SECRET=dev-secret-change-me
# BFF_APP_JWT_ISSUER=https://api.example.com
# BFF_APP_JWT_AUDIENCE=spar-mobile
BFF_APP_JWT_ACCESS_TTL=900
BFF_APP_JWT_REFRESH_TTL=2592000
```

- `BFF_OIDC_CLIENT_SECRET` が必要な場合はローカル専用 `.env` にのみ記載（コミット禁止）。
- `MOBILE_ALLOWED_ORIGINS` は Expo / Web の実行ホストをカンマ区切りで設定。

### 本番環境への切り替え

- IdP (例: Azure AD B2C) でモバイル用クライアントを登録し、`redirect_uri` に `spar://auth/callback` を許可する。
- 秘密情報 (`BFF_OIDC_CLIENT_SECRET`, `BFF_APP_JWT_SECRET`) は Key Vault 等で管理し、`.env.common` には記載しない。デプロイ環境でのみ環境変数として注入する。
- `BFF_AUTH_DEV_MODE` を `0` に設定し、`dev:` 形式のコード受け入れを無効化する。
- Expo 側では既定で `extra.devAuthCode` を設定せず、実際の認可コードフローのみでログインする。QA 向けに dev コードを使う場合は `BFF_AUTH_DEV_MODE=1` とし、`app.json` などで `extra.devAuthCode` を個別に注入する。
- AppJWT シークレットは定期的にローテーションする。`@team3/auth-shared` の `verifyAppJwt` は `dev:` を許容しないため、監視で dev トークンの混入を検知する。

## 自動テスト

- `npm run test` で Vitest を実行し、トークンユーティリティと `/api/v1/auth/*` のハンドラを検証できます。
- 主要な依存はモックされるため、外部 OIDC や DB を起動せずにロジックの regresion を検知できます。

### フェーズ1で追加した重点テスト

| コマンド | 検証内容 |
| --- | --- |
| `npm run test -- apps/web/src/app/api/v1/me/route.test.ts apps/web/src/app/api/v1/push/register/route.test.ts` | `/api/v1/me` のレスポンス整形と Push 登録の主要分岐（dev トークン、DB 未接続、バリデーション） |
| `npm run test -- apps/web/src/app/api/v1/auth/refresh/route.test.ts` | Refresh トークンのローテーションと NotFound / Device 不一致 / 期限切れハンドリング |

## QA 手動チェックリスト（フェーズ1）

0. **事前準備**:
   - `.env.dev` などローカル専用ファイルにランダム生成した `BFF_APP_JWT_SECRET`（例: `openssl rand -base64 48` の結果）を設定し、サーバーを再起動する。
   - `BFF_OIDC_CLIENT_SECRET` や `BFF_AUTH_DEV_MODE` なども `.env.dev` 側で上書きされていることを確認する。
1. **Expo アプリ起動**: `expo start --android` もしくは `--ios` で起動し、ログにスキーム `spar://auth/callback` が登録されていることを確認する。
2. **ログイン検証**:
   - dev コードを使用する場合は `BFF_AUTH_DEV_MODE=1` に設定したうえで `extra.devAuthCode` を注入し、ログ出力に `devMode=true` が含まれることを確認してからログインを実行。
   - 実機 OIDC の場合はブラウザが開き、正常に `spar://auth/callback` にリダイレクトされてアプリへ復帰することを確認。
   - 画面表示が「ログインに成功しました」に変わり、SecureStore に `spar.auth.tokens` が保存されているか `expo-secure-store` のデバッグ機能で確認。
3. **トークンリフレッシュ**: 「トークン更新」ボタンを押下し、`/api/v1/auth/refresh` が 200 を返すことを mitmproxy などで確認。レスポンス内の `refreshToken` が更新され、SecureStore の値も更新されていること。
4. **Push トークン登録**: 「Push トークン登録」ボタンを押下し、`/api/v1/push/register` が 204 を返すこと、`devices` / `push_tokens` テーブルに対象レコードが保存されていることを Drizzle Studio で確認。
5. **ログアウト**: 「ログアウト」ボタンで SecureStore のトークンが削除され、画面表示が「ログアウトしました」に変わることを確認。
6. **異常系**: 端末日時を過去に変更する、あるいは Push 登録時にネットワークを切断して 4xx/5xx が返るケースを確認し、画面ステータスにエラーが表示されることをチェック。

> メモ: QA では可能であれば Android 実機 (API 29+) と iOS 16+ の双方で上記を実施する。

## DB 永続化

- `refresh_tokens` … ハッシュ化したリフレッシュトークンを保存。`metadata.scopes` に発行スコープを保持。
- `devices` / `push_tokens` … `/api/v1/push/register` で端末情報をアップサート。既存トークンは deviceId 単位で整理。

## Postman/Hoppscotch

以下の順序で呼び出すことでローカル動作確認が可能です。

```http
### Auth Start
GET http://localhost:3000/api/v1/auth/start

### Auth Callback (dev mode)
GET http://localhost:3000/api/v1/auth/callback?code=dev:user@example.com|Dev%20User&deviceId=dev-simulator

### Refresh
POST http://localhost:3000/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>",
  "deviceId": "dev-simulator"
}

### Push Register
POST http://localhost:3000/api/v1/push/register
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "deviceId": "dev-simulator",
  "platform": "android",
  "token": "dummy-token"
}
```

> NOTE: `{{accessToken}}` には `/auth/callback` のレスポンスで得たトークンを設定します。
