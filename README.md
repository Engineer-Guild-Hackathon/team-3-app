# team3 teamname

このリポジトリはハッカソン提出用の雛形です。以下の項目をすべて埋めてください。

---

## チーム情報
- チーム番号: 3
- チーム名: （ここに記入）
- プロダクト名: （ここに記入）
- メンバー: 横内佑哉，渡瀬友裕

---

## デモ　/ プレゼン資料
- デモURL: 
- プレゼンURL：

---

## 開発（フロントエンド）

- 技術構成: Next.js (App Router) + React + Tailwind CSS
- チャットUI: ChatGPT風のメイン画面を `src/app/page.tsx` で提供しています。

### セットアップ

```bash
task dev
```

ブラウザで http://localhost:3000 を開いてください。

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
