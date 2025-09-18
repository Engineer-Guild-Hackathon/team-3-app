import type { ChatThread } from "../components/types";

export const SAMPLE_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "最近の質問",
    unread: true,
    messages: [
      {
        id: "thread-1-msg-1",
        author: "assistant",
        text: "本日のゴールを確認させてください。",
        createdAt: "12:28",
      },
      {
        id: "thread-1-msg-2",
        author: "user",
        text: "プロジェクト状況を整理したいです。",
        createdAt: "12:30",
      },
    ],
  },
  {
    id: "thread-2",
    title: "AI 相談",
    messages: [
      {
        id: "thread-2-msg-1",
        author: "user",
        text: "課題の洗い出しを手伝って。",
        createdAt: "12:05",
      },
      {
        id: "thread-2-msg-2",
        author: "assistant",
        text: "ヒアリングした内容から優先度を整理します。",
        createdAt: "12:08",
      },
    ],
  },
  {
    id: "thread-3",
    title: "資料レビュー",
    messages: [
      {
        id: "thread-3-msg-1",
        author: "assistant",
        text: "資料の構成を確認しました。",
        createdAt: "昨日",
      },
      {
        id: "thread-3-msg-2",
        author: "user",
        text: "改善ポイントを教えてください。",
        createdAt: "昨日",
      },
    ],
  },
  {
    id: "thread-4",
    title: "議事録生成",
    messages: [
      {
        id: "thread-4-msg-1",
        author: "user",
        text: "会議の結論をまとめたい。",
        createdAt: "2日前",
      },
      {
        id: "thread-4-msg-2",
        author: "assistant",
        text: "決定事項とアクションを整理します。",
        createdAt: "2日前",
      },
    ],
  },
  {
    id: "thread-5",
    title: "プロジェクト計画",
    messages: [
      {
        id: "thread-5-msg-1",
        author: "assistant",
        text: "今週のタスクを洗い出しました。",
        createdAt: "3日前",
      },
      {
        id: "thread-5-msg-2",
        author: "user",
        text: "次のステップは？",
        createdAt: "3日前",
      },
    ],
  },
  {
    id: "thread-6",
    title: "技術サポート",
    messages: [
      {
        id: "thread-6-msg-1",
        author: "user",
        text: "エラーの意味が分からない。",
        createdAt: "4日前",
      },
      {
        id: "thread-6-msg-2",
        author: "assistant",
        text: "再現手順と解決策を提示します。",
        createdAt: "4日前",
      },
    ],
  },
  {
    id: "thread-7",
    title: "マーケティング戦略",
    messages: [
      {
        id: "thread-7-msg-1",
        author: "assistant",
        text: "ターゲット市場の調査結果です。",
        createdAt: "5日前",
      },
      {
        id: "thread-7-msg-2",
        author: "user",
        text: "重要な指標を抜き出して。",
        createdAt: "5日前",
      },
    ],
  },
  {
    id: "thread-8",
    title: "製品フィードバック",
    messages: [
      {
        id: "thread-8-msg-1",
        author: "user",
        text: "改善点を集約してほしい。",
        createdAt: "6日前",
      },
      {
        id: "thread-8-msg-2",
        author: "assistant",
        text: "重要度順にリストアップします。",
        createdAt: "6日前",
      },
    ],
  },
  {
    id: "thread-9",
    title: "競合分析",
    messages: [
      {
        id: "thread-9-msg-1",
        author: "assistant",
        text: "主要競合の比較表を共有します。",
        createdAt: "1週間前",
      },
      {
        id: "thread-9-msg-2",
        author: "user",
        text: "優位性を整理して。",
        createdAt: "1週間前",
      },
    ],
  },
  {
    id: "thread-10",
    title: "ユーザーインタビュー",
    messages: [
      {
        id: "thread-10-msg-1",
        author: "user",
        text: "インサイトをまとめたい。",
        createdAt: "1週間前",
      },
      {
        id: "thread-10-msg-2",
        author: "assistant",
        text: "共通する課題を洗い出しました。",
        createdAt: "1週間前",
      },
    ],
  },
];
