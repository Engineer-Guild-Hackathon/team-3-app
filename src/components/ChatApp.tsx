"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ChatMessage, ChatSession } from "@/types/chat";
import type { RunChatInput } from "@/types/llm";

import SparSidebar from "./spar/ChatSidebar";
import SparChatbot from "./spar/Chatbot";
import SparProfile from "./spar/Profile";
// 共通ユーティリティ（将来のモバイル移植も見据えて分離）
import { numericIdFromUuid } from "@/lib/chat/id";
import { messagesToTurns } from "@/lib/chat/mapping";
import { apiFetchJson } from "@/lib/http";
import { getSubjectName, getTopicName } from "@/lib/subjects";
import { loadSessions, saveSessions, SESSION_STORAGE_KEY } from "@/lib/storage/sessionStore";
import { listChats as apiListChats, createChat as apiCreateChat, runChat as apiRunChat } from "@/lib/api/chat";

// UUID生成（衝突リスクが非常に低い）
const rid = () => crypto.randomUUID();

// LocalStorage キー
const STORAGE_KEY = SESSION_STORAGE_KEY;
const AUTO_INTRO_FLAG_PREFIX = "chat:auto-intro:"; // localStorage フラグ（新規作成直後の自動送信許可）
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
  // bootIntroDone は廃止（per-chat フラグで管理）
  // 新規作成直後のチャットにのみ自動イントロを許可（既存チャットを開いた際の誤送信を防止）
  const [pendingAutoIntroId, setPendingAutoIntroId] = useState<string | null>(null);
  // チャットごとの自動イントロ送信済みフラグ
  const autoIntroSent = useRef<Record<string, boolean>>({});
  // 自動イントロ送信の同時実行防止（開発時の StrictMode 二重実行も抑止）
  const autoIntroInFlight = useRef<Record<string, boolean>>({});
  // サイドバーのUI状態（日本語コメント）
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // APIからの読み込み済みメッセージ管理（重複フェッチ防止）
  const loadedMessages = useRef<Record<string, boolean>>({});
  // 404 Not Found（所有権なし/存在しない）の表示制御
  const [notFound, setNotFound] = useState(false);

  // 簡易フェッチヘルパー
  const fetchJson = useCallback(apiFetchJson, []);

  // subject/topic 名称の解決ヘルパー（必要時のみ取得）
  const fetchSubjectName = useCallback((sid?: string) => getSubjectName(sid), []);
  const fetchTopicName = useCallback((sid?: string, tid?: string) => getTopicName(sid, tid), []);

  // 空のセッションを作成
  const createSession = useCallback((fixedId?: string): ChatSession => {
    const id = fixedId ?? rid();
    const now = Date.now();
    return { id, title: "新しいチャット", status: "in_progress", messages: [], updatedAt: now };
  }, []);

  // 保存
  const persist = useCallback((next: ChatSession[]) => { saveSessions(next); }, []);

  // 初期化：保存済み読み込み or 新規作成（初回描画前に反映するため useLayoutEffect を使用）
  const [bootstrapped, setBootstrapped] = useState(false);
  useLayoutEffect(() => {
    let redirected = false;
    try {
      const parsed = loadSessions();
      if (parsed) {
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
          // 新規作成直後の自動イントロフラグ（ルート遷移跨ぎのためLSで受け渡し）
          if (initialId) {
            const flag = localStorage.getItem(AUTO_INTRO_FLAG_PREFIX + initialId);
            if (flag === "1") setPendingAutoIntroId(initialId);
          }
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
          saveSessions(next);
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
        const items = await apiListChats();
        if (!Array.isArray(items) || items.length === 0) return;
        const mapped: ChatSession[] = items.map((r) => ({
          id: String(r.id),
          title: String(r.title ?? "(無題)"),
          status: (r.status ?? 'in_progress'),
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          topicId: r.topicId,
          topicName: r.topicName,
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
          saveSessions(merged);
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
  const handleNewChat = async (opts?: { subjectId?: string; topicId?: string; prefTopicName?: string }) => {
    try {
      // API で作成（失敗時はローカルフォールバック）
      const created = await apiCreateChat({ subjectId: opts?.subjectId, topicId: opts?.topicId });
      const s: ChatSession = { id: created.id, title: created.title ?? '新しいチャット', status: created.status ?? 'in_progress', subjectId: created.subjectId, topicId: created.topicId, prefTopicName: opts?.prefTopicName, messages: [], updatedAt: typeof created.updatedAt === 'number' ? created.updatedAt : new Date(created.updatedAt).getTime() };
      const next = [s, ...sessions];
      setSessions(next);
      setActiveId(s.id);
      try { localStorage.setItem(AUTO_INTRO_FLAG_PREFIX + s.id, "1"); } catch {}
      setPendingAutoIntroId(s.id);
      setNotFound(false);
      persist(next);
      setInput("");
      router.push(`/chats/${s.id}`);
    } catch {
      const newSession = createSession();
      const next = [newSession, ...sessions];
      setSessions(next);
      setActiveId(newSession.id);
      try { localStorage.setItem(AUTO_INTRO_FLAG_PREFIX + newSession.id, "1"); } catch {}
      setPendingAutoIntroId(newSession.id);
      setNotFound(false);
      persist(next);
      setInput("");
      router.push(`/chats/${newSession.id}`);
    }
  };

  // 送信処理（API接続版）
  const handleSend = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    // ガード（ended の場合は送信不可）
    if (!active || !text || sending || active.status === 'ended') return;

    // 1) ユーザーメッセージをセッションに反映
    const userMsg: ChatMessage = {
      id: rid(),
      role: "user",
      content: text,
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
      const chatId = numericIdFromUuid(current.id);

      // 履歴を { assistant, user } のターン配列へ変換
      const toTurns = messagesToTurns;

      // 教科/分野ラベルの解決（未解決なら API から取得）
      let subj = current.subjectName || (current.subjectId ? '' : '数学');
      let topic = current.topicName || current.prefTopicName || '';
      if (!subj && current.subjectId) {
        const name = await fetchSubjectName(current.subjectId);
        if (name) {
          subj = name;
          // セッションにも反映
          setSessions((prev) => prev.map((s) => s.id === current.id ? { ...s, subjectName: name } : s));
        }
      }
      if (!topic && current.subjectId && current.topicId) {
        const tname = await fetchTopicName(current.subjectId, current.topicId);
        if (tname) {
          topic = tname;
          setSessions((prev) => prev.map((s) => s.id === current.id ? { ...s, topicName: tname } : s));
        }
      }
      const themeDefault = (subj || '数学') === '英語' ? '仮定法' : '確率';
      const payload: RunChatInput = {
        chatId,
        subject: subj || "数学",
        theme: topic || themeDefault,
        clientSessionId: current.id,
        history: toTurns(current.messages),
      };

      const data = await apiRunChat(payload);

      // 3) 応答メッセージを追記（RunChatOutput 優先、旧API互換も対応）
      const assistant: ChatMessage = {
        id: rid(),
        role: "assistant",
        content: String(data.result?.answer ?? (data as any).result?.text ?? ""),
        createdAt: Date.now(),
      };
      const assistantPersisted = (data.meta?.assistantPersisted ?? (data as any).result?.meta?.assistantPersisted) !== false;
      const lastLocal = nextSessions.find((s) => s.id === active.id)?.messages?.at(-1);
      const lastLocalIsAssistant = lastLocal?.role === 'assistant';
      const ended = (data.result?.status ?? 0) === -1 ? false : true;
      // DB 側で破棄された場合でも、ローカルの直近が assistant でなければ UI は表示する
      if ((assistantPersisted || !lastLocalIsAssistant) && assistant.content) {
        const withAssistant = nextSessions.map((s) =>
          s.id === active.id
            ? { ...s, status: ended ? 'ended' : (s.status ?? 'in_progress'), messages: [...s.messages, assistant], updatedAt: Date.now() }
            : s
        );
        setSessions(withAssistant);
        persist(withAssistant);
      } else {
        // 破棄された場合でもステータスのみ更新（必要なら）
        const onlyStatus = nextSessions.map((s) => s.id === active.id ? { ...s, status: ended ? 'ended' : (s.status ?? 'in_progress'), updatedAt: Date.now() } : s);
        setSessions(onlyStatus);
        persist(onlyStatus);
      }
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

  // 新規作成直後のみ最初に LLM 応答を自動生成（既存チャットを開いたときは送信しない）
  useEffect(() => {
    const autoIntro = async () => {
      if (!active || sending) return;
      if (!pendingAutoIntroId || pendingAutoIntroId !== active.id) return;
      if (autoIntroSent.current[active.id]) return;
      if (autoIntroInFlight.current[active.id]) return;
      // 既に assistant が最後のメッセージなら送信しない
      if (active.messages.length > 0) {
        const last = active.messages[active.messages.length - 1];
        if (last?.role === 'assistant') return;
      }
      autoIntroInFlight.current[active.id] = true; // ここでロック
      setSending(true);
      try {
        const chatId = numericIdFromUuid(active.id);
        // 教科/分野ラベルの解決
        let subj2 = active.subjectName || (active.subjectId ? '' : '数学');
        let topic2 = active.topicName || active.prefTopicName || '';
        if (!subj2 && active.subjectId) {
          const name = await fetchSubjectName(active.subjectId);
          if (name) {
            subj2 = name;
            setSessions((prev) => prev.map((s) => s.id === active.id ? { ...s, subjectName: name } : s));
          }
        }
        if (!topic2 && active.subjectId && active.topicId) {
          const tname = await fetchTopicName(active.subjectId, active.topicId);
          if (tname) {
            topic2 = tname;
            setSessions((prev) => prev.map((s) => s.id === active.id ? { ...s, topicName: tname } : s));
          }
        }
        const themeDefault2 = (subj2 || '数学') === '英語' ? '仮定法' : '確率';
        const payload = {
          chatId,
          subject: subj2 || "数学",
          theme: topic2 || themeDefault2,
          clientSessionId: active.id,
          history: [],
        } as RunChatInput;
        const data = await apiRunChat(payload);
        const assistant: ChatMessage = { id: rid(), role: "assistant", content: String(data.result?.answer ?? (data as any).result?.text ?? ""), createdAt: Date.now() };
        const assistantPersisted = (data.meta?.assistantPersisted ?? (data as any).result?.meta?.assistantPersisted) !== false;
        setSessions((prev) => {
          const ended = (data.result?.status ?? 0) === -1 ? false : true;
          const next = prev.map((s) => {
            if (s.id !== active.id) return s;
            const base = { ...s, status: ended ? 'ended' : (s.status ?? 'in_progress'), updatedAt: Date.now() } as ChatSession;
            const lastLocal2 = s.messages.at(-1);
            const lastLocalIsAssistant2 = lastLocal2?.role === 'assistant';
            if ((assistantPersisted || !lastLocalIsAssistant2) && assistant.content) {
              return { ...base, messages: [...s.messages, assistant], title: s.title === "新しいチャット" && assistant.content ? assistant.content.slice(0, 24) : s.title };
            }
            return base;
          });
          saveSessions(next);
          return next;
        });
        autoIntroSent.current[active.id] = true;
        try { localStorage.removeItem(AUTO_INTRO_FLAG_PREFIX + active.id); } catch {}
        setPendingAutoIntroId(null);
      } catch (_) {
        // 失敗時は黙ってスキップ
      } finally {
        delete autoIntroInFlight.current[active.id];
        setSending(false);
      }
    };
    autoIntro();
  }, [active, sending, pendingAutoIntroId, fetchSubjectName, fetchTopicName]);

  // 予備：提案カードの選択ハンドラ（未使用）

  // 初期読み込みが終わるまでは表示を抑制して履歴画面のチラつきを防ぐ
  if (!bootstrapped && initialId) {
    return null;
  }

  const showProfile = showProfileOnEmpty && (!active || active.messages.length === 0);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 背景のアニメーション要素（日本語コメント）*/}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 h-full flex gap-4 p-4">
        <SparSidebar
          sessions={sessions}
          activeId={activeId ?? undefined}
          onNewChat={handleNewChat}
          onSelectChat={(id) => {
            setActiveId(id);
            router.push(`/chats/${id}`);
          }}
          isExpanded={sidebarOpen}
          onToggleExpanded={() => setSidebarOpen((v) => !v)}
          onNavigateToProfile={() => router.push('/')}
        />

        <main className="flex-1 min-w-0 h-full">
          {/* 本文 */}
          {showProfile ? (
            <SparProfile
              chatSessions={sessions}
              currentChatId={activeId}
              onCreateChat={handleNewChat}
              onSelectChat={(id) => { setActiveId(id); router.push(`/chats/${id}`); }}
              onLogout={() => signOut({ callbackUrl: '/login' })}
            />
          ) : notFound ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="mx-auto w-full max-w-3xl px-6 md:px-8">
                <div className="text-center space-y-3">
                  <h1 className="text-2xl md:text-3xl font-semibold">チャットが見つかりません</h1>
                  <p className="text-sm text-black/60 dark:text-white/60">存在しない、または権限がありません。別のチャットを選ぶか、新規作成してください。</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => router.push('/')} className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">トップへ</button>
                    <button onClick={() => handleNewChat()} className="rounded-lg bg-black/80 text-white px-3 py-1.5 text-sm hover:bg-black">+ 新しいチャット</button>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <SparChatbot
              messages={active?.messages ?? []}
              isLoading={sending}
              hideInput={active?.status === 'ended'}
              inputDisabled={sending}
              onSendMessage={(text) => { handleSend(text); }}
              subjectLabel={active?.subjectName || ((active?.subjectId ? undefined : '数学')) || undefined}
              topicLabel={active?.topicName || active?.prefTopicName || (((active?.subjectName || (active?.subjectId ? '' : '数学')) || '数学') === '英語' ? '仮定法' : '確率')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
