# フェーズ2 チャットBFF対応メモ

## 変更サマリ
- `/api/v1/me` のレスポンスを `profile` + `auth` 構成に拡張し、メール・表示名を返却。
- `/api/v1/chats` に一覧・作成APIを実装。`deletedAt` 未設定のチャットのみ返却し、limit 最大200を許容。
- `/api/v1/chats/:id` に PATCH/DELETE を実装。PATCH はタイトル等の編集、DELETE は `deletedAt` を更新する論理削除。
- OpenAPI (`mobile-bff-v1.yaml`) を現行仕様に合わせて更新（`ProfileSummary`/`AuthContext`/`MeResponse`/`ChatListResponse.nextCursor`）。
- `chats` テーブルに `deleted_at` カラムを追加。
- チャット系エンドポイントのユニットテストを大幅に追加し、正常系・エラー系・DB未接続ケースをカバー。

## テスト
```
npm run lint
npm run test -- apps/web/src/app/api/v1/chats/route.test.ts apps/web/src/app/api/v1/chats/[id]/route.test.ts
npm run test
npm run typecheck -- --noEmit
task ci:all
```

## 備考
- `/api/v1/chats` の `nextCursor` は現状 `null` 固定。カーソル式ページング導入時に更新予定。
- `/api/v1/me` のプロフィール取得は DB エラー時に null を返し、API は成功応答を維持。
- 論理削除に伴い復元APIを追加する場合は `deletedAt` を利用して実装可能。
