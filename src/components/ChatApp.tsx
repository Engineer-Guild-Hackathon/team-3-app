"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import Sidebar from "./sidebar/Sidebar";
import type { ChatMessage, ChatSession } from "@/types/chat";

// UUID生成（衝突リスクが非常に低い）
const rid = () => crypto.randomUUID();

// LocalStorage キー
const STORAGE_KEY = "chat:sessions:v1";
const UI_SIDEBAR_OPEN_KEY = "ui:sidebar:open:v1";

/**
 * ChatGPT風のメインUIコンポーネント
 * - サイドバー / ヘッダ / メッセージリスト / 入力欄
 * - ローカルストレージに会話履歴を保存（セッション簡易実装）
 * - バックエンド接続は未実装で、ダミー応答を返す
 */
type Props = { initialId?: string };

export default function ChatApp({ initialId }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // サイドバーのUI状態（日本語コメント）
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 空のセッションを作成
  const createSession = useCallback((fixedId?: string): ChatSession => {
    const id = fixedId ?? rid();
    const now = Date.now();
    return { id, title: "新しいチャット", messages: [], updatedAt: now };
  }, []);

  // 保存
  const persist = useCallback((next: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  // 初期化：保存済み読み込み or 新規作成（初回描画前に反映するため useLayoutEffect を使用）
  const [bootstrapped, setBootstrapped] = useState(false);
  useLayoutEffect(() => {
    let redirected = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];
        setSessions(parsed);
        const hasInitial = initialId && parsed.some((s) => s.id === initialId);
        if (initialId && !hasInitial) {
          router.replace("/");
          redirected = true;
        } else {
          setActiveId((hasInitial ? initialId : parsed[0]?.id) ?? null);
        }
      } else {
        if (initialId) {
          router.replace("/");
          redirected = true;
        } else {
          const first = createSession();
          const next = [first];
          setSessions(next);
          setActiveId(first.id);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
      }
    } catch {}
    if (!redirected) setBootstrapped(true);
    // リダイレクト時は別ページに遷移するため描画はスキップ
  }, [createSession, initialId, router]);

  // ルートの初期IDが変わった場合の追随（/chats/:id 遷移）
  useEffect(() => {
    if (initialId && initialId !== activeId) {
      setActiveId(initialId);
    }
  }, [initialId, activeId]);

  // サイドバーUIの初期化（開閉のみ）
  useEffect(() => {
    try {
      const open = localStorage.getItem(UI_SIDEBAR_OPEN_KEY);
      if (open != null) setSidebarOpen(open === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(UI_SIDEBAR_OPEN_KEY, sidebarOpen ? "1" : "0"); } catch {}
  }, [sidebarOpen]);

  // アクティブセッションの取得
  const active = useMemo(() => sessions.find((s) => s.id === activeId) ?? null, [sessions, activeId]);

  // 新規チャット
  const handleNewChat = () => {
    const newSession = createSession();
    const next = [newSession, ...sessions];
    setSessions(next);
    setActiveId(newSession.id);
    persist(next);
    setInput("");
    // ルーティングで詳細へ遷移
    router.push(`/chats/${newSession.id}`);
  };

  // 送信処理（UIのみ）
  const handleSend = async () => {
    if (!active || !input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: rid(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };

    // セッションタイトルを1件目のユーザーメッセージから自動生成（簡易）
    const nextSessions = sessions.map((s) =>
      s.id === active.id
        ? {
            ...s,
            title: s.messages.length === 0 ? userMsg.content.slice(0, 24) : s.title,
            messages: [...s.messages, userMsg],
            updatedAt: Date.now(),
          }
        : s
    );
    setSessions(nextSessions);
    persist(nextSessions);
    setInput("");

    // ダミー応答（バックエンド未接続のため）
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    const assistant: ChatMessage = {
      id: rid(),
      role: "assistant",
      content:
        "これはダミーの回答です。API接続後に置き換えてください。\n\n- 入力: " +
        userMsg.content,
      createdAt: Date.now(),
    };
    const withAssistant = nextSessions.map((s) =>
      s.id === active.id
        ? { ...s, messages: [...s.messages, assistant], updatedAt: Date.now() }
        : s
    );
    setSessions(withAssistant);
    persist(withAssistant);
    setSending(false);
  };

  // 予備：提案カードの選択ハンドラ（未使用）

  // 初期読み込みが終わるまでは表示を抑制して履歴画面のチラつきを防ぐ
  if (!bootstrapped && initialId) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={sessions}
        onNewChat={handleNewChat}
        onSelectChat={(id) => setActiveId(id)}
        onRename={(id, title) => {
          // 名称変更（日本語コメント）
          const next = sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          );
          setSessions(next);
          persist(next);
        }}
        onDelete={(id) => {
          // 削除処理：アクティブ削除時は次のセッションへ遷移、無ければ新規作成（日本語コメント）
          const remained = sessions.filter((s) => s.id !== id);
          if (remained.length === 0) {
            const created = createSession();
            const next = [created];
            setSessions(next);
            setActiveId(created.id);
            persist(next);
            router.replace(`/chats/${created.id}`);
            return;
          }
          setSessions(remained);
          persist(remained);

          if (activeId === id) {
            const nextActive = remained[0].id;
            setActiveId(nextActive);
            router.replace(`/chats/${nextActive}`);
          }
        }}
        activeId={activeId ?? undefined}
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main className="flex-1 flex flex-col">
        {/* ヘッダ */}
        <div className="h-14 border-b border-black/10 dark:border-white/10 px-2 md:px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="サイドバーを開く"
                title="サイドバーを開く"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M3 6.75A.75.75 0 0 1 3.75 6h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 3.5A.75.75 0 0 1 3.75 9.5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10.25Zm0 3.5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"/>
                </svg>
              </button>
            )}
            <div className="font-semibold truncate">Chat</div>
          </div>
          <div className="text-xs text-black/50 dark:text-white/50">UI Demo</div>
        </div>

        {/* 本文 */}
        {active && active.messages.length > 0 ? (
          <MessageList messages={active.messages} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="mx-auto w-full max-w-3xl px-6 md:px-8">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-semibold mb-3">新しくチャットを作成</h1>
                <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                  この機能はいずれなくなります。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 入力欄 */}
        <ChatInput value={input} setValue={setInput} onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
