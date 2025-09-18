# Mobile Push Testing TODO

## 背景
現在、Expo Push 通知の本番フローは実機が未手配のため検証できていません。実機入手後に抜け漏れなく確認できるよう、対応項目を整理します。

## TODO
- [ ] Android / iOS の実機を準備し、Expo Dev Client をインストール
- [ ] `.env.dev` へ Push 用設定を反映（`BFF_APP_JWT_SECRET`、`BFF_OIDC_CLIENT_SECRET` など）
- [ ] `google-services.json` / `GoogleService-Info.plist` を配置し、Firebase プロジェクトと Expo を接続
- [ ] `expo-notifications` の Expo Push Token を実機で取得
- [ ] `/api/v1/push/register` に Expo Push Token を登録し、DB の `devices` / `push_tokens` テーブルを確認
- [ ] Expo Push API 経由で通知を送信し、端末で受信できることを確認
- [ ] エラー時の挙動（トークン無効化、ネットワーク断など）を検証
- [ ] 検証結果を `docs/mobile-bff-auth.md` の QA 手順に追記し、対応完了を共有

## 認証まわりの残タスク
- [ ] IdP（Azure AD B2C 等）で本番クライアント設定を確定し、`BFF_OIDC_CLIENT_SECRET` を安全に配布
- [ ] 本番モードで `BFF_AUTH_DEV_MODE=0` を適用し、dev コード経路が閉じていることを確認
- [ ] AppJWT シークレットを本番用に再生成し、キー管理手順（ローテーション含む）を共有

## 参考
- `docs/mobile-bff-auth.md` – 認証フローと QA チェックリスト
- Expo Dev Client: https://docs.expo.dev/develop/development-builds/introduction/
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
