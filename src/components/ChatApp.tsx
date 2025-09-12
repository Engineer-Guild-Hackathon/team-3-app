"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ChatMessage, ChatSession } from "@/types/chat";
import type { ConversationTurn, RunChatInput } from "@/types/llm";

import ChatInput from "./chat/ChatInput";
import MessageList from "./chat/MessageList";
import Sidebar from "./sidebar/Sidebar";
import ProfilePane from "@/components/ProfilePane";
import UserMenu from "@/components/auth/UserMenu";

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
type Props = { initialId?: string; showProfileOnEmpty?: boolean };

export default function ChatApp({ initialId, showProfileOnEmpty = false }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [bootIntroDone, setBootIntroDone] = useState(false); // 初回LLM応答の自動生成フラグ
  // サイドバーのUI状態（日本語コメント）
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // APIからの読み込み済みメッセージ管理（重複フェッチ防止）
  const loadedMessages = useRef<Record<string, boolean>>({});
  // 404 Not Found（所有権なし/存在しない）の表示制御
  const [notFound, setNotFound] = useState(false);

  // 簡易フェッチヘルパー
  const fetchJson = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 401) {
      // 未認証はログインへ誘導
      if (typeof window !== "undefined") window.location.href = "/login";
      const err: any = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    let data: any = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data?.ok === false) {
      const err: any = new Error(String(data?.error ?? `HTTP ${res.status}`));
      err.status = res.status;
      throw err;
    }
    return data;
  }, []);

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
          // /（プロフィール優先表示）の場合はアクティブを持たない
          setActiveId(
            hasInitial
              ? initialId
              : (showProfileOnEmpty ? null : (parsed[0]?.id ?? null))
          );
        }
      } else {
        if (initialId) {
          router.replace("/");
          redirected = true;
        } else {
          const first = createSession();
          const next = [first];
          setSessions(next);
          // /（プロフィール優先表示）の場合はアクティブを持たない
          setActiveId(showProfileOnEmpty ? null : first.id);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
      }
    } catch {}
    if (!redirected) setBootstrapped(true);
    // リダイレクト時は別ページに遷移するため描画はスキップ
  }, [createSession, initialId, router, showProfileOnEmpty]);

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

  // API: チャット一覧の読み込み（初回）
  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchJson('/api/chats');
        const items = (data?.result?.items ?? []) as Array<{ id: string; title: string; updatedAt: string | number }>;
        if (!Array.isArray(items) || items.length === 0) return;
        const mapped: ChatSession[] = items.map((r) => ({
          id: String(r.id),
          title: String(r.title ?? "(無題)"),
          messages: [],
          updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : new Date(r.updatedAt).getTime(),
        }));
        setSessions((prev) => {
          // 既存と統合（同一IDはAPIを優先）
          const map = new Map<string, ChatSession>();
          for (const s of prev) map.set(s.id, s);
          for (const s of mapped) map.set(s.id, s);
          const merged = Array.from(map.values()).sort((a,b)=>b.updatedAt-a.updatedAt);
          // アクティブが未設定なら先頭を選ぶ（プロフィール優先表示時は null を維持）
          if (!activeId && !showProfileOnEmpty && merged.length > 0) setActiveId(merged[0].id);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
          return merged;
        });
      } catch {
        // 失敗時は無視（LocalStorage 維持）
      }
    };
    run();
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // アクティブセッションの取得
  const active = useMemo(() => sessions.find((s) => s.id === activeId) ?? null, [sessions, activeId]);

  // 新規チャット
  const handleNewChat = async () => {
    try {
      // API で作成（失敗時はローカルフォールバック）
      const data = await fetchJson('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const row = data?.result as { id: string; title: string; updatedAt: string | number };
      const s: ChatSession = { id: row.id, title: row.title ?? '新しいチャット', messages: [], updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : new Date(row.updatedAt).getTime() };
      const next = [s, ...sessions];
      setSessions(next);
      setActiveId(s.id);
      setNotFound(false);
      persist(next);
      setInput("");
      router.push(`/chats/${s.id}`);
    } catch {
      const newSession = createSession();
      const next = [newSession, ...sessions];
      setSessions(next);
      setActiveId(newSession.id);
      setNotFound(false);
      persist(next);
      setInput("");
      router.push(`/chats/${newSession.id}`);
    }
  };

  // 送信処理（API接続版）
  const handleSend = async () => {
    // ガード
    if (!active || !input.trim() || sending) return;

    // 1) ユーザーメッセージをセッションに反映
    const userMsg: ChatMessage = {
      id: rid(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };

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

    // 2) バックエンドへ送信
    setSending(true);
    try {
      const current = nextSessions.find((s) => s.id === active.id)!;

      // 数値 chatId へ変換（UUID→32bit hash）
      const chatId = (() => {
        const str = current.id;
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return Math.abs(h);
      })();

      // 履歴を { assistant, user } のターン配列へ変換
      const toTurns = (msgs: ChatMessage[]): ConversationTurn[] => {
        const turns: ConversationTurn[] = [];
        let pendingA = "";
        let pendingU = "";
        for (const m of msgs) {
          if (m.role === "assistant") {
            if (pendingA || pendingU) {
              turns.push({ assistant: pendingA, user: pendingU });
              pendingA = ""; pendingU = "";
            }
            pendingA = m.content;
          } else if (m.role === "user") {
            if (pendingU) {
              turns.push({ assistant: pendingA, user: pendingU });
              pendingA = ""; pendingU = "";
            }
            pendingU = m.content;
            // assistant が未到着でも一旦ペアとして確定
            turns.push({ assistant: pendingA, user: pendingU });
            pendingA = ""; pendingU = "";
          }
        }
        if (pendingA || pendingU) turns.push({ assistant: pendingA, user: pendingU });
        return turns;
      };

      const payload: RunChatInput = {
        chatId,
        subject: current.title || "Chat",
        theme: "default",
        clientSessionId: current.id,
        history: toTurns(current.messages),
      };

      const data = await fetchJson('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      // 3) 応答メッセージを追記（RunChatOutput 優先、旧API互換も対応）
      const assistant: ChatMessage = {
        id: rid(),
        role: "assistant",
        content: String(data.result?.answer ?? data.result?.text ?? ""),
        createdAt: Date.now(),
      };
      const withAssistant = nextSessions.map((s) =>
        s.id === active.id
          ? { ...s, messages: [...s.messages, assistant], updatedAt: Date.now() }
          : s
      );
      setSessions(withAssistant);
      persist(withAssistant);
      loadedMessages.current[active.id] = true; // 以後API再フェッチ不要
    } catch (e: any) {
      // エラー時はメッセージとして表示
      const err: ChatMessage = {
        id: rid(),
        role: "assistant",
        content: `エラーが発生しました: ${String(e?.message ?? e)}`,
        createdAt: Date.now(),
      };
      const withError = nextSessions.map((s) =>
        s.id === active.id
          ? { ...s, messages: [...s.messages, err], updatedAt: Date.now() }
          : s
      );
      setSessions(withError);
      persist(withError);
    } finally {
      setSending(false);
    }
  };

  // 選択中チャットの履歴をAPIからロード（未ロード時のみ）
  useEffect(() => {
    const run = async () => {
      const id = activeId;
      if (!id || loadedMessages.current[id]) return;
      try {
        setNotFound(false);
        const data = await fetchJson(`/api/chats/${id}/messages`);
        const items = (data?.result?.items ?? []) as Array<{ id: string; role: 'user'|'assistant'|'system'; content: string; createdAt: string | number }>;
        if (!Array.isArray(items)) return;
        setSessions((prev) => prev.map((s) => s.id === id
          ? {
              ...s,
              messages: items.map((m) => ({ id: m.id, role: m.role as any, content: m.content, createdAt: typeof m.createdAt === 'number' ? m.createdAt : new Date(m.createdAt).getTime() })),
              updatedAt: Date.now(),
            }
          : s));
        loadedMessages.current[id] = true;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
      } catch (e: any) {
        if (e?.status === 404) {
          setNotFound(true);
        }
        // 404 以外の失敗は無視（LocalStorage のみ）
      }
    };
    run();
  }, [activeId, fetchJson, sessions]);

  // 新規/空チャットのとき最初に LLM 応答を自動生成（subject=物理, theme=加速度）
  useEffect(() => {
    const autoIntro = async () => {
      if (!active || sending || bootIntroDone) return;
      if (active.messages.length > 0) return;
      setSending(true);
      try {
        const chatId = (() => {
          const str = active.id; let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h);
        })();
        const payload = {
          chatId,
          subject: "物理",
          theme: "加速度",
          clientSessionId: active.id,
          description: `
高校物理における「加速度」の定義と説明（詳説）
1. 加速度の定義

加速度とは、物体の速度が時間とともにどのように変化するかを表す量。

「単位時間あたりにどれだけ速度が変化するか」を示す。

速度の変化を時間で割ることで平均加速度が定義される。

時間を限りなく細かく見ていくと、ある瞬間の加速度を考えることができ、これを「瞬時の加速度」という。

2. 単位と性質

単位は「メートル毎秒毎秒（m/s²）」。

意味は「毎秒ごとに速度が何メートル毎秒ずつ変化するか」。

加速度はベクトル量であり、大きさと向きを持つ。

速度の大きさが変わる場合だけでなく、向きが変わる場合にも加速度が存在する。

3. 加速度の向きと直線運動

加速度の向きは「速度の変化の向き」と一致する。

直線運動では、速度と加速度が同じ向きのとき物体は速くなり、逆向きのとき物体は遅くなる。

「加速度が正なら加速」「加速度が負なら減速」と表現されるが、実際には速度と加速度の向きの関係で決まる。

4. 加速度の物理的意味

加速度は「速度がどれくらいの速さで変化しているか」を定量的に示す。

速度が短時間で大きく変われば加速度は大きく、ゆるやかに変化すれば小さい。

車が急ブレーキをかけると加速度は大きく、ゆっくり減速すると加速度は小さい。

5. 方向の変化による加速度

速度の変化には速さだけでなく方向の変化も含まれる。

そのため、速さが一定でも進む方向が変わる運動には加速度がある。

円運動では、物体は一定の速さで動いていても中心に向かう加速度が常に働いている。

6. 等加速度運動

加速度が時間によらず一定の運動を「等加速度運動」という。

この場合、速度と時間や位置と時間の関係を簡単な式で表すことができる。

等加速度運動は、加速度の概念を理解する上で典型的な例である。

7. 力との関係

ニュートンの運動の法則によれば、物体に加わる合力が加速度を生み出す。

加速度は力の大きさに比例し、質量に反比例する。

つまり「力があるから加速度が生じる」というのが基本的な考え方である。

8. 具体例

直線運動の例：車の速度が毎秒ごとに一定の量だけ増えたり減ったりするとき、それが加速度である。

減速の例：速度と逆向きの加速度が働いており、速度が毎秒ごとに一定量ずつ小さくなっている。

円運動の例：速さは変わらなくても方向が変わるため、中心に向かう加速度が存在する。曲がる半径が小さいほど加速度は大きくなる。
`,
          history: [],
        } as RunChatInput;
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        const assistant: ChatMessage = { id: rid(), role: "assistant", content: String(data.result?.answer ?? data.result?.text ?? ""), createdAt: Date.now() };
        setSessions((prev) => {
          const next = prev.map((s) => s.id === active.id ? { ...s, messages: [...s.messages, assistant], updatedAt: Date.now(), title: s.title === "新しいチャット" && assistant.content ? assistant.content.slice(0, 24) : s.title } : s);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
        setBootIntroDone(true);
      } catch (_) {
        // 失敗時は黙ってスキップ
      } finally {
        setSending(false);
      }
    };
    autoIntro();
  }, [active, sending, bootIntroDone]);

  // 予備：提案カードの選択ハンドラ（未使用）

  // 初期読み込みが終わるまでは表示を抑制して履歴画面のチラつきを防ぐ
  if (!bootstrapped && initialId) {
    return null;
  }

  const showProfile = showProfileOnEmpty && (!active || active.messages.length === 0);

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={sessions}
        onNewChat={handleNewChat}
        onSelectChat={(id) => setActiveId(id)}
        onRename={async (id, title) => {
          // 名称変更（日本語コメント）
          try {
            await fetchJson(`/api/chats/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
          } catch {}
          setSessions((prev) => {
            const next = prev.map((s) => s.id === id ? { ...s, title, updatedAt: Date.now() } : s);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
            return next;
          });
        }}
        onDelete={async (id) => {
          // 削除処理：アクティブ削除時は次のセッションへ遷移、無ければ新規作成（日本語コメント）
          try { await fetchJson(`/api/chats/${id}`, { method: 'DELETE' }); } catch {}
          const remained = sessions.filter((s) => s.id !== id);
          if (remained.length === 0) {
            const created = createSession();
            const next = [created];
            setSessions(next);
            setActiveId(created.id);
            setNotFound(false);
            persist(next);
            router.replace(`/chats/${created.id}`);
            return;
          }
          setSessions(remained);
          persist(remained);

          if (activeId === id) {
            const nextActive = remained[0].id;
            setActiveId(nextActive);
            setNotFound(false);
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
            <div className="font-semibold truncate">{showProfile ? "Profile" : "Chat"}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-black/50 dark:text-white/50 hidden sm:block">UI Demo</div>
            <UserMenu />
          </div>
        </div>

        {/* 本文 */}
        {showProfile ? (
          <ProfilePane />
        ) : active && active.messages.length > 0 ? (
          <MessageList messages={active.messages} />
        ) : notFound ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="mx-auto w-full max-w-3xl px-6 md:px-8">
              <div className="text-center space-y-3">
                <h1 className="text-2xl md:text-3xl font-semibold">チャットが見つかりません</h1>
                <p className="text-sm text-black/60 dark:text-white/60">存在しない、または権限がありません。別のチャットを選ぶか、新規作成してください。</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => router.push('/')} className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">トップへ</button>
                  <button onClick={handleNewChat} className="rounded-lg bg-black/80 text-white px-3 py-1.5 text-sm hover:bg-black">+ 新しいチャット</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="mx-auto w-full max-w-3xl px-6 md:px-8">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-semibold mb-3">新しくチャットを作成</h1>
              </div>
            </div>
          </div>
        )}

        {/* 入力欄 */}
        {!showProfile && (
          <ChatInput value={input} setValue={setInput} onSend={handleSend} disabled={sending} />
        )}
      </main>
    </div>
  );
}
