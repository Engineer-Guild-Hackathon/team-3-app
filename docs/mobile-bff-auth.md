# Mobile BFF Auth Flow (M0.5)

## OIDC 設定

- `BFF_OIDC_AUTHORIZATION_ENDPOINT` … 認可エンドポイント（例: Azure AD B2C の `/authorize`）。
- `BFF_OIDC_TOKEN_ENDPOINT` … トークンエンドポイント。
- `BFF_OIDC_CLIENT_ID` / `BFF_OIDC_CLIENT_SECRET` … モバイル専用クライアント。
- `BFF_OIDC_REDIRECT_URI` … Expo 側のスキーム (`spar://auth/callback` など)。
- `BFF_OIDC_SCOPE` … `openid profile email` を基本とし、必要に応じて追加。
- `BFF_AUTH_DEV_MODE=1` で `dev:email@example.com` 形式のコードを許可（ローカル検証用）。

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
