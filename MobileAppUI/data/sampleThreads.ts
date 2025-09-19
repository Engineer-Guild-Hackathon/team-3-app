// このファイルはUIのモック用に会話スレッドのサンプルデータを定義します
// - 例を増やし、特に thread-1 は長い往復にしています
// - 各スレッドの「最後のメッセージ」は必ず assistant にしています
// - 1メッセージだけのスレッドも含めます（その場合も assistant）

import type { ChatThread } from "../components/types";

export const SAMPLE_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "最近の質問（ロングスレッド）",
    unread: true,
    messages: [
      { id: "thread-1-msg-1",  author: "assistant", text: "本日のゴールと制約を確認します。何を終えれば成功ですか？", createdAt: "08:10" },
      { id: "thread-1-msg-2",  author: "user",      text: "プロジェクト状況を整理したい。特にAPIの認証回り。",     createdAt: "08:11" },
      { id: "thread-1-msg-3",  author: "assistant", text: "OK。現状の認証方式は？（例: EasyAuth, OAuth, 自前JWT）", createdAt: "08:12" },
      { id: "thread-1-msg-4",  author: "user",      text: "EasyAuthでGoogleログインを想定。ローカルはNextAuth。",    createdAt: "08:13" },
      { id: "thread-1-msg-5",  author: "assistant", text: "環境差分が鍵ですね。共通化のため、リダイレクトURLとスコープを表にします。", createdAt: "08:14" },
      { id: "thread-1-msg-6",  author: "user",      text: "助かる。あとCORSでハマる。モバイルアプリから叩く想定。", createdAt: "08:16" },
      { id: "thread-1-msg-7",  author: "assistant", text: "CORSは FrontDoor/NGINX/アプリ側のどこで許可するかを固定化しましょう。許可ドメインは最小に。", createdAt: "08:17" },
      { id: "thread-1-msg-8",  author: "user",      text: "FrontDoorは未使用。まずはApp Service直で良い？", createdAt: "08:18" },
      { id: "thread-1-msg-9",  author: "assistant", text: "まずは直でOK。スケールやWAFが必要になったらFrontDoorを検討で十分です。", createdAt: "08:19" },
      { id: "thread-1-msg-10", author: "user",      text: "APIのエンドポイント命名は /api/v1 で切る？", createdAt: "08:20" },
      { id: "thread-1-msg-11", author: "assistant", text: "はい。/api/v1/* に統一。認証必要/不要もパスで整理（例: /public, /secure）。", createdAt: "08:21" },
      { id: "thread-1-msg-12", author: "user",      text: "ログは英語、コメントは日本語にする運用でOK？", createdAt: "08:22" },
      { id: "thread-1-msg-13", author: "assistant", text: "OK。運用ルールをREADMEに記載してESLint/Prettierで最小限の強制を。", createdAt: "08:23" },
      { id: "thread-1-msg-14", author: "user",      text: "サンプルcurlが欲しい。認証あり・なし両方。", createdAt: "08:24" },
      { id: "thread-1-msg-15", author: "assistant", text: "準備します。/api/v1/health (public) と /api/v1/profile (secure) の2本で例示します。", createdAt: "08:25" },
      { id: "thread-1-msg-16", author: "user",      text: "プロジェクトタスクも洗い出して。今週中にやり切りたい。", createdAt: "08:27" },
      { id: "thread-1-msg-17", author: "assistant", text: "承知。認証統一・CORS調整・エンドポイント整備・監視導入の4本柱でWBSを切ります。", createdAt: "08:29" },
      { id: "thread-1-msg-18", author: "user",      text: "監視はまず何を？", createdAt: "08:30" },
      { id: "thread-1-msg-19", author: "assistant", text: "最小は可用性(HTTP 200)、レイテンシ、エラーレート。App Insights でダッシュボード化します。", createdAt: "08:31" },
      { id: "thread-1-msg-20", author: "user",      text: "了解。今日のゴールをもう一度整理して。", createdAt: "08:32" },
      { id: "thread-1-msg-21", author: "assistant", text: "本日のゴール：① 認証設定の差分表作成 ② CORSの許可範囲確定 ③ /api/v1/health と /api/v1/profile の疎通確認。", createdAt: "08:33" },
    ],
  },

  {
    id: "thread-2",
    title: "AI 相談",
    messages: [
      { id: "thread-2-msg-1", author: "user",      text: "課題の洗い出しを手伝って。", createdAt: "09:05" },
      { id: "thread-2-msg-2", author: "assistant", text: "ヒアリング内容から優先度を整理します。期限と難易度も併記します。", createdAt: "09:08" },
      { id: "thread-2-msg-3", author: "user",      text: "依存関係も追記して。", createdAt: "09:10" },
      { id: "thread-2-msg-4", author: "assistant", text: "承知。ブロッカー・前提タスク・並行可能タスクを区別して提示します。", createdAt: "09:12" },
      { id: "thread-2-msg-5", author: "assistant", text: "初版リストを用意しました。レビュー後にIssueへ分割します。", createdAt: "09:20" },
    ],
  },

  {
    id: "thread-3",
    title: "資料レビュー",
    messages: [
      { id: "thread-3-msg-1", author: "assistant", text: "資料の構成を確認しました。", createdAt: "昨日 21:02" },
      { id: "thread-3-msg-2", author: "user",      text: "改善ポイントを教えてください。", createdAt: "昨日 21:05" },
      { id: "thread-3-msg-3", author: "assistant", text: "結論→根拠→詳細の順に並べ替え、1スライド1メッセージへ簡潔化しましょう。", createdAt: "昨日 21:08" },
    ],
  },

  {
    id: "thread-4",
    title: "議事録生成",
    messages: [
      { id: "thread-4-msg-1", author: "user",      text: "会議の結論をまとめたい。", createdAt: "2日前" },
      { id: "thread-4-msg-2", author: "assistant", text: "決定事項・保留事項・担当者/期限で整理して出力します。", createdAt: "2日前" },
    ],
  },

  {
    id: "thread-5",
    title: "プロジェクト計画",
    messages: [
      { id: "thread-5-msg-1", author: "assistant", text: "今週のタスクを洗い出しました。", createdAt: "3日前" },
      { id: "thread-5-msg-2", author: "user",      text: "次のステップは？", createdAt: "3日前" },
      { id: "thread-5-msg-3", author: "assistant", text: "レビュー会の設定と、依存するPRのマージ順序の確定です。", createdAt: "3日前" },
    ],
  },

  {
    id: "thread-6",
    title: "技術サポート",
    messages: [
      { id: "thread-6-msg-1", author: "user",      text: "エラーの意味が分からない。", createdAt: "4日前" },
      { id: "thread-6-msg-2", author: "assistant", text: "再現手順とログを共有ください。仮説と回避策もあわせて提示します。", createdAt: "4日前" },
    ],
  },

  {
    id: "thread-7",
    title: "マーケティング戦略",
    messages: [
      { id: "thread-7-msg-1", author: "assistant", text: "ターゲット市場の調査結果です。", createdAt: "5日前" },
      { id: "thread-7-msg-2", author: "user",      text: "重要な指標を抜き出して。", createdAt: "5日前" },
      { id: "thread-7-msg-3", author: "assistant", text: "CPL, CAC, LTV, リテンション率をKPI候補として抽出しました。", createdAt: "5日前" },
    ],
  },

  {
    id: "thread-8",
    title: "製品フィードバック",
    messages: [
      { id: "thread-8-msg-1", author: "user",      text: "改善点を集約してほしい。", createdAt: "6日前" },
      { id: "thread-8-msg-2", author: "assistant", text: "重要度・影響度・実装難易度でスコアリングして一覧化します。", createdAt: "6日前" },
    ],
  },

  {
    id: "thread-9",
    title: "競合分析",
    messages: [
      { id: "thread-9-msg-1", author: "assistant", text: "主要競合の比較表を共有します。", createdAt: "1週間前" },
      { id: "thread-9-msg-2", author: "user",      text: "優位性を整理して。", createdAt: "1週間前" },
      { id: "thread-9-msg-3", author: "assistant", text: "差別化ポイントを3軸（速度・費用・拡張性）で可視化しました。", createdAt: "1週間前" },
    ],
  },

  {
    id: "thread-10",
    title: "ユーザーインタビュー",
    messages: [
      { id: "thread-10-msg-1", author: "user",      text: "インサイトをまとめたい。", createdAt: "1週間前" },
      { id: "thread-10-msg-2", author: "assistant", text: "共通する課題をクラスタリングし、代表発言を添えます。", createdAt: "1週間前" },
    ],
  },

  // --- 1メッセージのみ（必ずassistantで終わる） -------------------------
  {
    id: "thread-11",
    title: "クイックチップ",
    messages: [
      { id: "thread-11-msg-1", author: "assistant", text: "Tip: ログは英語・コメントは日本語にするとレビュアー間の齟齬が減ります。", createdAt: "07:55" },
    ],
  },

  // --- 超短期のやり取り（最後はassistant） ------------------------------
  {
    id: "thread-12",
    title: "API設計メモ",
    messages: [
      { id: "thread-12-msg-1", author: "user",      text: "エンドポイントの命名規則、迷っています。", createdAt: "今朝" },
      { id: "thread-12-msg-2", author: "assistant", text: "REST準拠で複数形リソース + 動詞はHTTPメソッドへ委譲、でいきましょう。", createdAt: "今朝" },
    ],
  },

  // --- テスト用（UIの既読/未読やピン留めを試す想定） --------------------
  {
    id: "thread-13",
    title: "テスト: 一問一答",
    unread: false,
    messages: [
      { id: "thread-13-msg-1", author: "user",      text: "FigmaからReact Nativeに変換する最短は？", createdAt: "昨日 09:40" },
      { id: "thread-13-msg-2", author: "assistant", text: "最短は画像書き出し+手書き実装ですが、Locofy等で雛形生成→整形が現実的です。", createdAt: "昨日 09:42" },
    ],
  },

  // --- シングル：リマインド文 -------------------------
  {
    id: "thread-14",
    title: "リマインド",
    messages: [
      { id: "thread-14-msg-1", author: "assistant", text: "本日 18:00 にデモ環境の動作確認を実施予定です。準備をお願いします。", createdAt: "今朝" },
    ],
  },

  // --- 少し長め：要件すり合わせ（最後assistant） -----------------------
  {
    id: "thread-15",
    title: "要件すり合わせ",
    messages: [
      { id: "thread-15-msg-1", author: "assistant", text: "機能要件・非機能要件・運用要件の3観点で確認します。", createdAt: "月曜" },
      { id: "thread-15-msg-2", author: "user",      text: "機能: 認証/チャット/履歴、非機能: 可用性99.9%、運用: 監視とアラート。", createdAt: "月曜" },
      { id: "thread-15-msg-3", author: "assistant", text: "可用性はSLA/SLI/SLOで定義、監視はApp Insights＋アラートで実装します。", createdAt: "月曜" },
    ],
  },

  // --- シングル：完了報告（assistantで終わり） --------------------------
  {
    id: "thread-16",
    title: "完了報告",
    messages: [
      { id: "thread-16-msg-1", author: "assistant", text: "依頼のダッシュボードを作成し、共有権限を付与しました。", createdAt: "昨日 18:15" },
    ],
  },
];
