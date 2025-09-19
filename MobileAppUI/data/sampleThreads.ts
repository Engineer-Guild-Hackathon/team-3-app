import type { ChatThread } from "../components/types";

export const SAMPLE_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "認証方式の整理（ロングスレッド）",
    unread: true,
    messages: [
      { id: "t1-m1", author: "assistant", status: -1, text: "先生、本日のゴールは何でしょうか？", createdAt: "2025-09-19T08:00:00+09:00" },
      { id: "t1-m2", author: "user", text: "認証方式の差分を整理したい。", createdAt: "2025-09-19T08:01:00+09:00" },
      { id: "t1-m3", author: "assistant", status: -1, text: "現在の利用方式を教えていただけますか？", createdAt: "2025-09-19T08:02:00+09:00" },
      { id: "t1-m4", author: "user", text: "ローカルはNextAuth、本番はEasyAuth。", createdAt: "2025-09-19T08:03:00+09:00" },
      { id: "t1-m5", author: "assistant", status: -1, text: "ありがとうございます。リダイレクトURLは環境ごとに違いますか？", createdAt: "2025-09-19T08:04:00+09:00" },
      { id: "t1-m6", author: "user", text: "そう、ローカルと本番で別のURL。", createdAt: "2025-09-19T08:05:00+09:00" },
      { id: "t1-m7", author: "assistant", status: -1, text: "スコープは email と profile のみで共通で良いでしょうか？", createdAt: "2025-09-19T08:06:00+09:00" },
      { id: "t1-m8", author: "user", text: "はい、それで共通。", createdAt: "2025-09-19T08:07:00+09:00" },
      { id: "t1-m9", author: "assistant", status: -1, text: "CORS はまず App Service 直で許可、FrontDoor なしの想定で合っていますか？", createdAt: "2025-09-19T08:08:00+09:00" },
      { id: "t1-m10", author: "user", text: "合ってる。まずは直で許可。", createdAt: "2025-09-19T08:09:00+09:00" },
      { id: "t1-m11", author: "assistant", status: -1, text: "承知しました。API 名は /api/v1 配下で統一しますか？", createdAt: "2025-09-19T08:09:30+09:00" },
      { id: "t1-m12", author: "user", text: "そうして。/api/v1/health は公開、/api/v1/profile は認証あり。", createdAt: "2025-09-19T08:10:00+09:00" },
      { id: "t1-m13", author: "assistant", status: -1, text: "了解です。では本日のゴールは ①認証差分表 ②CORS許可範囲 ③疎通確認 で良いですか？", createdAt: "2025-09-19T08:10:30+09:00" },
      { id: "t1-m14", author: "user", text: "それでOK。", createdAt: "2025-09-19T08:11:00+09:00" },
      { id: "t1-m15", author: "assistant", status: 1, text: "承知しました。上記3点で作業します。", createdAt: "2025-09-19T08:11:30+09:00" },
    ],
  },
  {
    id: "thread-2",
    title: "課題整理",
    messages: [
      { id: "t2-m1", author: "assistant", status: -1, text: "先生、課題を洗い出してもよろしいですか？", createdAt: "2025-09-18T09:00:00+09:00" },
      { id: "t2-m2", author: "user", text: "依存関係も含めて整理して。", createdAt: "2025-09-18T09:01:00+09:00" },
      { id: "t2-m3", author: "assistant", status: -1, text: "ブロッカー・前提・並行可能の3分類で進めます。優先度は High/Med/Low で良いですか？", createdAt: "2025-09-18T09:02:00+09:00" },
      { id: "t2-m4", author: "user", text: "良い。", createdAt: "2025-09-18T09:02:30+09:00" },
      { id: "t2-m5", author: "assistant", status: 1, text: "初版リストを作成しました。レビュー依頼を出します。", createdAt: "2025-09-18T09:03:00+09:00" },
    ],
  },
  {
    id: "thread-3",
    title: "資料レビュー",
    messages: [
      { id: "t3-m1", author: "assistant", status: -1, text: "先生、資料の改善点について質問してもいいですか？", createdAt: "2025-09-17T20:00:00+09:00" },
      { id: "t3-m2", author: "user", text: "改善点を挙げて。", createdAt: "2025-09-17T20:01:00+09:00" },
      { id: "t3-m3", author: "assistant", status: -1, text: "結論→根拠→詳細の順に並べ替え、1スライド1メッセージにすると良さそうです。", createdAt: "2025-09-17T20:02:00+09:00" },
      { id: "t3-m4", author: "user", text: "他には？", createdAt: "2025-09-17T20:03:00+09:00" },
      { id: "t3-m5", author: "assistant", status: 1, text: "重要指標は色とアイコンで視線誘導します。変更案を追記します。", createdAt: "2025-09-17T20:04:00+09:00" },
    ],
  },
  {
    id: "thread-4",
    title: "会議のまとめ",
    messages: [
      { id: "t4-m1", author: "assistant", status: -1, text: "先生、会議の結論をまとめても良いですか？", createdAt: "2025-09-16T14:00:00+09:00" },
      { id: "t4-m2", author: "user", text: "決定事項と保留事項を分けて。", createdAt: "2025-09-16T14:02:00+09:00" },
      { id: "t4-m3", author: "assistant", status: -1, text: "担当者と期限も合わせて載せます。優先度は A/B/C で付けます。", createdAt: "2025-09-16T14:04:00+09:00" },
      { id: "t4-m4", author: "user", text: "頼む。", createdAt: "2025-09-16T14:04:30+09:00" },
      { id: "t4-m5", author: "assistant", status: 1, text: "完成しました。共有リンクを送付します。", createdAt: "2025-09-16T14:05:00+09:00" },
    ],
  },
  {
    id: "thread-5",
    title: "プロジェクト計画",
    messages: [
      { id: "t5-m1", author: "assistant", status: -1, text: "先生、今週のタスクを整理しました。次はどうしますか？", createdAt: "2025-09-15T10:00:00+09:00" },
      { id: "t5-m2", author: "user", text: "レビュー会を設定して。", createdAt: "2025-09-15T10:02:00+09:00" },
      { id: "t5-m3", author: "assistant", status: -1, text: "候補は水曜/木曜の午前です。どちらが良いですか？", createdAt: "2025-09-15T10:03:00+09:00" },
      { id: "t5-m4", author: "user", text: "木曜午前で。", createdAt: "2025-09-15T10:03:30+09:00" },
      { id: "t5-m5", author: "assistant", status: 1, text: "木曜 10:00 に確定し、招待を送りました。", createdAt: "2025-09-15T10:04:00+09:00" },
    ],
  },
  {
    id: "thread-6",
    title: "技術サポート（わからない終了 / status=0）",
    messages: [
      { id: "t6-m1", author: "assistant", status: -1, text: "先生、このエラーの再現手順を確認しても良いですか？", createdAt: "2025-09-14T11:00:00+09:00" },
      { id: "t6-m2", author: "user", text: "再現手順は共有済みのログに書いてある。", createdAt: "2025-09-14T11:01:00+09:00" },
      { id: "t6-m3", author: "assistant", status: 0, text: "確認しましたが、原因が特定できません…申し訳ありません。", createdAt: "2025-09-14T11:03:00+09:00" },
    ],
  },
  {
    id: "thread-7",
    title: "マーケティング戦略",
    messages: [
      { id: "t7-m1", author: "assistant", status: -1, text: "市場調査の結果をまとめました。主要指標を抽出しても良いですか？", createdAt: "2025-09-13T09:00:00+09:00" },
      { id: "t7-m2", author: "user", text: "抽出して。", createdAt: "2025-09-13T09:02:00+09:00" },
      { id: "t7-m3", author: "assistant", status: -1, text: "CPL, CAC, LTV を候補にしました。閾値は暫定で設定しますか？", createdAt: "2025-09-13T09:03:00+09:00" },
      { id: "t7-m4", author: "user", text: "閾値も暫定で。", createdAt: "2025-09-13T09:03:30+09:00" },
      { id: "t7-m5", author: "assistant", status: 1, text: "設定しました。ダッシュボードに反映済みです。", createdAt: "2025-09-13T09:05:00+09:00" },
    ],
  },
  {
    id: "thread-8",
    title: "製品フィードバック",
    messages: [
      { id: "t8-m1", author: "assistant", status: -1, text: "先生、改善点を集約してよろしいですか？", createdAt: "2025-09-12T15:00:00+09:00" },
      { id: "t8-m2", author: "user", text: "お願い。", createdAt: "2025-09-12T15:02:00+09:00" },
      { id: "t8-m3", author: "assistant", status: -1, text: "重要度・影響度・実装難易度の3軸でスコアリングします。", createdAt: "2025-09-12T15:03:00+09:00" },
      { id: "t8-m4", author: "user", text: "それで。", createdAt: "2025-09-12T15:03:30+09:00" },
      { id: "t8-m5", author: "assistant", status: 1, text: "スコア付きの一覧を作成しました。共有します。", createdAt: "2025-09-12T15:05:00+09:00" },
    ],
  },
  {
    id: "thread-9",
    title: "競合分析",
    messages: [
      { id: "t9-m1", author: "assistant", status: -1, text: "先生、主要競合の比較表を作成しました。優位性を整理しますか？", createdAt: "2025-09-11T13:00:00+09:00" },
      { id: "t9-m2", author: "user", text: "整理して。", createdAt: "2025-09-11T13:02:00+09:00" },
      { id: "t9-m3", author: "assistant", status: -1, text: "速度・費用・拡張性の3軸でマッピングしました。可視化も添えます。", createdAt: "2025-09-11T13:03:00+09:00" },
      { id: "t9-m4", author: "user", text: "良い。", createdAt: "2025-09-11T13:03:30+09:00" },
      { id: "t9-m5", author: "assistant", status: 1, text: "まとめ版を共有フォルダに配置しました。", createdAt: "2025-09-11T13:05:00+09:00" },
    ],
  },
  {
    id: "thread-10",
    title: "復習チェック（質問継続中 / status=-1 終了）",
    messages: [
      { id: "t10-m1", author: "assistant", status: -1, text: "先生、前回の復習内容を確認しても良いですか？", createdAt: "2025-09-10T08:00:00+09:00" },
      { id: "t10-m2", author: "user", text: "要点だけまとめて。", createdAt: "2025-09-10T08:02:00+09:00" },
      { id: "t10-m3", author: "assistant", status: -1, text: "要点を3つにまとめました。さらに深掘り質問を続けてもよろしいですか？", createdAt: "2025-09-10T08:05:00+09:00" },
    ],
  },
] satisfies ChatThread[];