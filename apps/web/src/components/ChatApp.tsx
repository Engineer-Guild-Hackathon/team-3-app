"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ChatMessage, ChatSession } from "@/types/chat";
import type { RunChatInput } from "@/types/llm";

import SparSidebar from "./spar/ChatSidebar";
import SparChatbot from "./spar/Chatbot";
import SparProfile from "./spar/Profile";
import ChatTagPanel from "./spar/ChatTagPanel";
// 共通ユーティリティ（将来のモバイル移植も見据えて分離）
import { numericIdFromUuid } from "@/lib/chat/id";
import { messagesToTurns } from "@/lib/chat/mapping";
import { endpoints } from "@/lib/api/endpoints";
import { apiFetchJson } from "@/lib/http";
import { getSubjectName, getTopicDetails } from "@/lib/subjects";
import { loadSessions, saveSessions } from "@/lib/storage/sessionStore";
import { listChats as apiListChats, createChat as apiCreateChat, runChat as apiRunChat, renameChat as apiRenameChat, deleteChat as apiDeleteChat } from "@/lib/api/chat";
import {
  fetchTagTypes,
  fetchTags,
  fetchChatTags,
  attachChatTag,
  detachChatTag,
  fetchTagMastery,
  updateTagMastery,
  type TagTypeItem,
  type TagSummary,
  type ChatTagItem,
  type TagMasteryItem,
} from "@/lib/api/tags";
import { useAppJwt } from "@/components/providers/AppJwtProvider";

// UUID生成（衝突リスクが非常に低い）
const rid = () => crypto.randomUUID();

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
  const { data: session, status } = useSession();
  const { ready: appJwtReady } = useAppJwt();
  const storageOwner = session?.user?.email ?? null;
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
  const loadingMessages = useRef<Record<string, boolean>>({});
  // 404 Not Found（所有権なし/存在しない）の表示制御
  const [notFound, setNotFound] = useState(false);
  const [tagTypes, setTagTypes] = useState<TagTypeItem[]>([]);
  const tagTypesLoadedRef = useRef(false);
  const tagAllLoadedRef = useRef(false);
  const [chatTagsMap, setChatTagsMap] = useState<Record<string, ChatTagItem[]>>({});
  const [tagOptionsMap, setTagOptionsMap] = useState<Record<string, TagSummary[]>>({});
  const [tagMasteryMap, setTagMasteryMap] = useState<Record<string, TagMasteryItem>>({});
  const [tagLoading, setTagLoading] = useState(false);
  const [tagActionKey, setTagActionKey] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [forbiddenState, setForbiddenState] = useState<{ active: boolean; message?: string }>({ active: false });
  const [listLoading, setListLoading] = useState(true);

  const markForbidden = useCallback((message?: string) => {
    setForbiddenState((prev) => (prev.active ? prev : { active: true, message }));
  }, []);

  // 簡易フェッチヘルパー
  const fetchJson = useCallback(apiFetchJson, []);

  // subject/topic 名称の解決ヘルパー（必要時のみ取得）
  const fetchSubjectName = useCallback((sid?: string) => getSubjectName(sid), []);
  const fetchTopicDetails = useCallback((sid?: string, tid?: string) => getTopicDetails(sid, tid), []);

  // 空のセッションを作成
  const createSession = useCallback((fixedId?: string): ChatSession => {
    const id = fixedId ?? rid();
    const now = Date.now();
    return { id, title: "新しいチャット", status: "in_progress", messages: [], updatedAt: now };
  }, []);

  // 保存
  const persist = useCallback(
    (next: ChatSession[]) => {
      saveSessions(storageOwner, next);
    },
    [storageOwner]
  );

  const makeAutoIntroKey = useCallback(
    (chatId: string) => (storageOwner ? `${AUTO_INTRO_FLAG_PREFIX}${storageOwner}:${chatId}` : null),
    [storageOwner]
  );

  const lastOwnerRef = useRef<string | null>(null);
  const listFetchedForOwner = useRef<string | null>(null);
  const persistRef = useRef(persist);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  // タグ種別の初回ロード
  useEffect(() => {
    if (!appJwtReady || status !== 'authenticated') return;
    if (tagTypesLoadedRef.current) return;
    tagTypesLoadedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchTagTypes();
        if (!cancelled) setTagTypes(items);
      } catch (error: any) {
        if (!cancelled) {
          if (error?.status === 403) {
            markForbidden('タグ種別を取得する権限がありません。');
          } else {
            console.error(error);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markForbidden, appJwtReady, status]);

  // タグ理解度の初回ロード
  useEffect(() => {
    if (!appJwtReady || status !== 'authenticated') return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchTagMastery();
        if (cancelled) return;
        const map: Record<string, TagMasteryItem> = {};
        items.forEach((item) => {
          map[item.tagId] = item;
        });
        setTagMasteryMap(map);
      } catch (error: any) {
        if (!cancelled) {
          if (error?.status === 403) {
            markForbidden('理解度情報へのアクセスが拒否されました。');
          } else {
            console.error(error);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markForbidden, appJwtReady, status]);

  // 利用可能タグ一覧（全体）のロード
  useEffect(() => {
    if (!appJwtReady || status !== 'authenticated') return;
    if (tagAllLoadedRef.current) return;
    tagAllLoadedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchTags();
        if (!cancelled) {
          setTagOptionsMap((prev) => ({ ...prev, ['all::any']: items }));
        }
      } catch (error: any) {
        if (!cancelled) {
          if (error?.status === 403) {
            markForbidden('タグ一覧を取得する権限がありません。');
          } else {
            console.error(error);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markForbidden, appJwtReady, status]);

  // 初期化：保存済み読み込み or 新規作成（初回描画前に反映するため useLayoutEffect を使用）
  const [bootstrapped, setBootstrapped] = useState(false);
  useLayoutEffect(() => {
    if (!storageOwner) return;
    const ownerChanged = lastOwnerRef.current !== storageOwner;
    lastOwnerRef.current = storageOwner;
    if (ownerChanged) {
      setSessions([]);
      setActiveId(initialId ?? null);
      loadedMessages.current = {};
      autoIntroSent.current = {};
      autoIntroInFlight.current = {};
      listFetchedForOwner.current = null;
    }
    try {
      const parsed = loadSessions(storageOwner);
      if (parsed) {
        setSessions(parsed);
        if (initialId) {
          setActiveId(initialId);
          const flagKey = makeAutoIntroKey(initialId);
          const flag = flagKey ? localStorage.getItem(flagKey) : null;
          if (flag === "1") setPendingAutoIntroId(initialId);
        } else if (!showProfileOnEmpty) {
          setActiveId(parsed[0]?.id ?? null);
        }
      } else if (!initialId && showProfileOnEmpty) {
        setSessions([]);
        setActiveId(null);
      }
    } catch {}
    setBootstrapped(true);
  }, [initialId, showProfileOnEmpty, storageOwner, makeAutoIntroKey]);

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
    if (status !== 'authenticated' || !appJwtReady || !storageOwner) {
      setListLoading(false);
      return;
    }
    if (listFetchedForOwner.current === storageOwner) {
      setListLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setListLoading(true);
      try {
        const items = await apiListChats();
        if (cancelled) return;
        const mapped: ChatSession[] = (items ?? []).map((r) => ({
          id: String(r.id),
          title: String(r.title ?? '(無題)'),
          status: r.status ?? 'in_progress',
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          topicId: r.topicId,
          topicName: r.topicName,
          messages: [],
          updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : new Date(r.updatedAt).getTime(),
        })).sort((a, b) => b.updatedAt - a.updatedAt);

        setSessions((prev) => {
          const prevById = new Map(prev.map((s) => [s.id, s] as const));
          const merged = mapped.map((s) => {
            const prevSession = prevById.get(s.id);
            if (prevSession) {
              return {
                ...s,
                messages: prevSession.messages,
                status: prevSession.status,
                prefTopicName: prevSession.prefTopicName,
              };
            }
            loadedMessages.current[s.id] = false;
            return s;
          });
          persistRef.current(merged);
          setActiveId((prevActive) => {
            if (prevActive && merged.some((s) => s.id === prevActive)) return prevActive;
            if (showProfileOnEmpty) return null;
            return merged[0]?.id ?? null;
          });
          return merged;
        });
      } catch (error: any) {
        if (error?.status === 403) {
          markForbidden('チャット一覧を読み込む権限がありません。再ログインしてください。');
        } else {
          console.error(error);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };
    listFetchedForOwner.current = storageOwner;
    run();
    return () => {
      cancelled = true;
      setListLoading(false);
    };
  }, [storageOwner, showProfileOnEmpty, persist, markForbidden, appJwtReady, status]);

  // アクティブセッションの取得
  const active = useMemo(() => sessions.find((s) => s.id === activeId) ?? null, [sessions, activeId]);
  const activeChatTags = useMemo(() => chatTagsMap[activeId ?? ''] ?? [], [chatTagsMap, activeId]);
  const tagOptionKey = active ? `${active.subjectId ?? 'all'}::${active.topicId ?? 'any'}` : 'none';

  const availableTagOptions = useMemo(() => {
    const baseList = tagOptionKey !== 'none'
      ? tagOptionsMap[tagOptionKey] ?? tagOptionsMap['all::any'] ?? []
      : tagOptionsMap['all::any'] ?? [];
    const selected = new Set(activeChatTags.map((t) => t.tagId));
    return baseList.filter((tag) => !selected.has(tag.id));
  }, [tagOptionsMap, tagOptionKey, activeChatTags]);

  useEffect(() => {
    setTagError(null);
  }, [activeId]);

  useEffect(() => {
    if (status !== 'authenticated' || !appJwtReady) return;
    if (!activeId) return;
    let cancelled = false;
    setTagLoading(true);
    (async () => {
      try {
        const items = await fetchChatTags(activeId);
        if (!cancelled) {
          setChatTagsMap((prev) => ({ ...prev, [activeId]: items }));
        }
      } catch (error: any) {
        if (!cancelled) {
          if (error?.status === 403) {
            markForbidden('タグ情報を取得する権限がありません。');
          } else {
            console.error(error);
          }
        }
      } finally {
        if (!cancelled) setTagLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, markForbidden, appJwtReady, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !appJwtReady) return;
    if (!active) return;
    if (tagOptionKey === 'none') return;
    if (tagOptionsMap[tagOptionKey]) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchTags({ subjectId: active.subjectId ?? undefined, topicId: active.topicId ?? undefined });
        if (!cancelled) {
          setTagOptionsMap((prev) => ({ ...prev, [tagOptionKey]: items }));
        }
      } catch (error: any) {
        if (!cancelled) {
          if (error?.status === 403) {
            markForbidden('タグ候補を取得する権限がありません。');
          } else {
            console.error(error);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, tagOptionKey, tagOptionsMap, markForbidden, appJwtReady, status]);

  // 新規チャット
  const handleNewChat = async (opts?: { subjectId?: string; topicId?: string; prefTopicName?: string; prefTopicDescription?: string }) => {
    if (status !== 'authenticated' || !appJwtReady) return;
    try {
      // API で作成（失敗時はローカルフォールバック）
      const created = await apiCreateChat({ subjectId: opts?.subjectId, topicId: opts?.topicId });
      let prefTopicName = opts?.prefTopicName;
      let prefTopicDescription = opts?.prefTopicDescription;
      const resolvedSubjectId = created.subjectId ?? opts?.subjectId;
      const resolvedTopicId = created.topicId ?? opts?.topicId;
      if ((!prefTopicName || !prefTopicDescription) && resolvedSubjectId && resolvedTopicId) {
        try {
          const details = await fetchTopicDetails(resolvedSubjectId, resolvedTopicId);
          if (details?.name && !prefTopicName) prefTopicName = details.name;
          if (details?.description && !prefTopicDescription) prefTopicDescription = details.description;
        } catch {}
      }
      const s: ChatSession = {
        id: created.id,
        title: created.title ?? '新しいチャット',
        status: created.status ?? 'in_progress',
        subjectId: created.subjectId,
        topicId: created.topicId,
        prefTopicName,
        prefTopicDescription,
        messages: [],
        updatedAt: typeof created.updatedAt === 'number' ? created.updatedAt : new Date(created.updatedAt).getTime(),
      };
      setSessions((prev) => {
        const next = [s, ...prev];
        persist(next);
        return next;
      });
      setActiveId(s.id);
      const flagKey = makeAutoIntroKey(s.id);
      if (flagKey) {
        try { localStorage.setItem(flagKey, "1"); } catch {}
      }
      setPendingAutoIntroId(s.id);
      setNotFound(false);
      setInput("");
      router.replace(`/chats/${s.id}`);
    } catch (error: any) {
      if (error?.status === 403) {
        markForbidden('チャットを作成する権限がありません。再ログインしてください。');
        return;
      }
      const newSession = createSession();
      const next = [newSession, ...sessions];
      setSessions(next);
      setActiveId(newSession.id);
      const flagKey = makeAutoIntroKey(newSession.id);
      if (flagKey) {
        try { localStorage.setItem(flagKey, "1"); } catch {}
      }
      setPendingAutoIntroId(newSession.id);
      setNotFound(false);
      persist(next);
      setInput("");
      router.replace(`/chats/${newSession.id}`);
    }
  };

  const handleRenameChat = useCallback(
    async (id: string) => {
      if (status !== 'authenticated' || !appJwtReady) return;
      const target = sessions.find((s) => s.id === id);
      const currentTitle = target?.title ?? '';
      const nextTitleRaw = typeof window !== 'undefined' ? window.prompt('チャット名を変更', currentTitle) : null;
      if (nextTitleRaw == null) return;
      const nextTitle = nextTitleRaw.trim();
      if (!nextTitle || nextTitle === currentTitle) return;
      try {
        await apiRenameChat(id, nextTitle);
        setSessions((prev) => {
          const next = prev.map((s) => (s.id === id ? { ...s, title: nextTitle, updatedAt: Date.now() } : s));
          persist(next);
          return next;
        });
      } catch (e: any) {
        if (e?.status === 403) {
          markForbidden('チャット名を変更する権限がありません。');
          return;
        }
        console.error(e);
        if (typeof window !== 'undefined') {
          window.alert(`名前の変更に失敗しました: ${String(e?.message ?? e)}`);
        }
      }
    },
    [sessions, persist, markForbidden, status, appJwtReady]
  );

  const handleDeleteChat = useCallback(
    async (id: string) => {
      if (status !== 'authenticated' || !appJwtReady) return;
      const target = sessions.find((s) => s.id === id);
      if (!target) return;
      const confirmed = typeof window === 'undefined' ? false : window.confirm(`「${target.title || '無題のチャット'}」を削除しますか？`);
      if (!confirmed) return;
      try {
        await apiDeleteChat(id);
        const next = sessions.filter((s) => s.id !== id);
        setSessions(next);
        persist(next);
        delete loadedMessages.current[id];
        const flagKey = makeAutoIntroKey(id);
        if (flagKey) {
          try { localStorage.removeItem(flagKey); } catch {}
        }
        if (activeId === id) {
          const fallbackId = showProfileOnEmpty ? null : next[0]?.id ?? null;
          setActiveId(fallbackId);
          if (fallbackId) router.replace(`/chats/${fallbackId}`);
          else router.replace('/chats');
        }
      } catch (e: any) {
        if (e?.status === 403) {
          markForbidden('チャットを削除する権限がありません。');
          return;
        }
        console.error(e);
        if (typeof window !== 'undefined') {
          window.alert(`削除に失敗しました: ${String(e?.message ?? e)}`);
        }
      }
    },
    [sessions, persist, makeAutoIntroKey, activeId, router, showProfileOnEmpty, markForbidden, status, appJwtReady]
  );

  const refreshChatTags = useCallback(async (chatId: string) => {
    try {
      const items = await fetchChatTags(chatId);
      setChatTagsMap((prev) => ({ ...prev, [chatId]: items }));
    } catch (error: any) {
      if (error?.status === 403) {
        markForbidden('タグ情報を取得する権限がありません。');
        return;
      }
      console.error(error);
      throw error;
    }
  }, [markForbidden]);

  const attachTagToActive = useCallback(
    async (tagId: string) => {
      if (status !== 'authenticated' || !appJwtReady) return;
      if (!activeId) return;
      setTagActionKey(`attach:${tagId}`);
      setTagError(null);
      try {
        await attachChatTag(activeId, { tagId });
        await refreshChatTags(activeId);
      } catch (error: any) {
        if (error?.status === 403) {
          markForbidden('タグを追加する権限がありません。');
          return;
        }
        console.error(error);
        const message = error instanceof Error ? error.message : 'タグの追加に失敗しました';
        setTagError(message);
        throw error;
      } finally {
        setTagActionKey(null);
      }
    },
    [activeId, refreshChatTags, markForbidden, status, appJwtReady]
  );

  const detachTagFromActive = useCallback(
    async (tagId: string) => {
      if (status !== 'authenticated' || !appJwtReady) return;
      if (!activeId) return;
      setTagActionKey(`remove:${tagId}`);
      setTagError(null);
      try {
        await detachChatTag(activeId, tagId);
        setChatTagsMap((prev) => {
          const current = prev[activeId] ?? [];
          return { ...prev, [activeId]: current.filter((t) => t.tagId !== tagId) };
        });
      } catch (error: any) {
        if (error?.status === 403) {
          markForbidden('タグを削除する権限がありません。');
          return;
        }
        console.error(error);
        const message = error instanceof Error ? error.message : 'タグの削除に失敗しました';
        setTagError(message);
        throw error;
      } finally {
        setTagActionKey(null);
      }
    },
    [activeId, markForbidden, status, appJwtReady]
  );

  const updateTagMasteryScore = useCallback(
    async (tagId: string, score: number) => {
      if (status !== 'authenticated' || !appJwtReady) return;
      setTagActionKey(`mastery:${tagId}`);
      setTagError(null);
      try {
        const item = await updateTagMastery(tagId, score, new Date().toISOString());
        setTagMasteryMap((prev) => ({ ...prev, [tagId]: item }));
      } catch (error: any) {
        if (error?.status === 403) {
          markForbidden('理解度を更新する権限がありません。');
          return;
        }
        console.error(error);
        const message = error instanceof Error ? error.message : '理解度の更新に失敗しました';
        setTagError(message);
        throw error;
      } finally {
        setTagActionKey(null);
      }
    },
    [markForbidden, status, appJwtReady]
  );

  // 送信処理（API接続版）
  const handleSend = async (textArg?: string) => {
    if (status !== 'authenticated' || !appJwtReady) return;
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
      let description = current.topicDescription || current.prefTopicDescription || '';
      if (!subj && current.subjectId) {
        const name = await fetchSubjectName(current.subjectId);
        if (name) {
          subj = name;
          // セッションにも反映
          setSessions((prev) => {
            const next = prev.map((s) => (s.id === current.id ? { ...s, subjectName: name } : s));
            persist(next);
            return next;
          });
        }
      }
      if ((!topic || !description) && current.subjectId && current.topicId) {
        const tdetails = await fetchTopicDetails(current.subjectId, current.topicId);
        if (tdetails) {
          if (!topic && tdetails.name) {
            topic = tdetails.name;
          }
          if (!description && tdetails.description) {
            description = tdetails.description;
          }
          if (tdetails.name || tdetails.description) {
            const nameToStore = tdetails.name;
            const descToStore = tdetails.description;
            setSessions((prev) => {
              const next = prev.map((s) =>
                s.id === current.id
                  ? {
                      ...s,
                      topicName: s.topicName || nameToStore || s.topicName,
                      topicDescription: s.topicDescription || descToStore,
                    }
                  : s,
              );
              persist(next);
              return next;
            });
          }
        }
      }
      description = description.trim();
      const themeDefault = (subj || '数学') === '英語' ? '仮定法' : '確率';
      const payload: RunChatInput = {
        chatId,
        subject: subj || "数学",
        theme: topic || themeDefault,
        description: description || undefined,
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
        status: data.result?.status,
      };
      const assistantPersisted = (data.meta?.assistantPersisted ?? (data as any).result?.meta?.assistantPersisted) !== false;
      const lastLocal = nextSessions.find((s) => s.id === active.id)?.messages?.at(-1);
      const lastLocalIsAssistant = lastLocal?.role === 'assistant';
      const statusValue = data.result?.status ?? 0;
      const ended = statusValue !== -1 && statusValue !== 999;
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
      loadedMessages.current[active.id] = true;
      if (loadingMessages.current[active.id]) {
        loadingMessages.current[active.id] = false;
      }
    } catch (e: any) {
      if (e?.status === 403) {
        markForbidden('メッセージを送信する権限がありません。再ログインしてください。');
      } else {
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
      }
    } finally {
      setSending(false);
    }
  };

  // 選択中チャットの履歴をAPIからロード（未ロード時のみ）
  useEffect(() => {
    const id = activeId;
    if (!id || loadedMessages.current[id] || loadingMessages.current[id]) return;
    loadingMessages.current[id] = true;
    let cancelled = false;
    (async () => {
      try {
        setNotFound(false);
        const data = await fetchJson(endpoints.messagesByChatId(id));
        if (cancelled) return;
        const items = (data?.items ?? []) as Array<{ id: string; role: 'user'|'assistant'|'system'; content: string; createdAt: string | number }>;
        if (!Array.isArray(items)) return;
        setSessions((prev) => {
          const updated = prev.map((s) => s.id === id
            ? {
                ...s,
                messages: items.map((m) => ({ id: m.id, role: m.role as any, content: m.content, createdAt: typeof m.createdAt === 'number' ? m.createdAt : new Date(m.createdAt).getTime() })),
                updatedAt: Date.now(),
              }
            : s);
          persistRef.current(updated);
          return updated;
        });
        loadedMessages.current[id] = true;
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 404) {
            setNotFound(true);
          } else if (e?.status === 403) {
            markForbidden('チャットメッセージを取得する権限がありません。');
          } else {
            console.error(e);
          }
        }
      } finally {
        loadingMessages.current[id] = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, fetchJson, markForbidden]);

  // 新規作成直後のみ最初に LLM 応答を自動生成（既存チャットを開いたときは送信しない）
  useEffect(() => {
    if (status !== 'authenticated' || !appJwtReady) return;
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
        let desc2 = active.topicDescription || active.prefTopicDescription || '';
        if (!subj2 && active.subjectId) {
          const name = await fetchSubjectName(active.subjectId);
          if (name) {
            subj2 = name;
            setSessions((prev) => {
              const next = prev.map((s) => (s.id === active.id ? { ...s, subjectName: name } : s));
              persist(next);
              return next;
            });
          }
        }
        if ((!topic2 || !desc2) && active.subjectId && active.topicId) {
          const details = await fetchTopicDetails(active.subjectId, active.topicId);
          if (details) {
            if (!topic2 && details.name) {
              topic2 = details.name;
            }
            if (!desc2 && details.description) {
              desc2 = details.description;
            }
            if (details.name || details.description) {
              const detailName = details.name;
              const detailDesc = details.description;
              setSessions((prev) => {
                const next = prev.map((s) =>
                  s.id === active.id
                    ? {
                        ...s,
                        topicName: s.topicName || detailName || s.topicName,
                        topicDescription: s.topicDescription || detailDesc,
                      }
                    : s,
                );
                persist(next);
                return next;
              });
            }
          }
        }
        desc2 = desc2.trim();
        const turns = messagesToTurns(active.messages);

        const themeDefault2 = (subj2 || '数学') === '英語' ? '仮定法' : '確率';
        const payload = {
          chatId,
          subject: subj2 || "数学",
          theme: topic2 || themeDefault2,
          description: desc2 || undefined,
          clientSessionId: active.id,
          history: turns,
        } as RunChatInput;
        const data = await apiRunChat(payload);
        const assistant: ChatMessage = {
          id: rid(),
          role: "assistant",
          content: String(data.result?.answer ?? (data as any).result?.text ?? ""),
          createdAt: Date.now(),
          status: data.result?.status,
        };
        const assistantPersisted = (data.meta?.assistantPersisted ?? (data as any).result?.meta?.assistantPersisted) !== false;
        let nextState: ChatSession[] = [];
        setSessions((prev) => {
          const statusValue = data.result?.status ?? 0;
          const ended = statusValue !== -1 && statusValue !== 999;
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
          nextState = next;
          return next;
        });
        persist(nextState);
        autoIntroSent.current[active.id] = true;
        const ridKey = makeAutoIntroKey(active.id);
        if (ridKey) {
          try { localStorage.removeItem(ridKey); } catch {}
        }
        setPendingAutoIntroId(null);
      } catch (error: any) {
        if (error?.status === 403) {
          markForbidden('チャットの自動応答を取得する権限がありません。');
        } else {
          console.error(error);
        }
      } finally {
        delete autoIntroInFlight.current[active.id];
        setSending(false);
        setPendingAutoIntroId(null);
      }
    };
    autoIntro();
  }, [active, sending, pendingAutoIntroId, fetchSubjectName, fetchTopicDetails, persist, makeAutoIntroKey, markForbidden, appJwtReady, status]);

  // 予備：提案カードの選択ハンドラ（未使用）

  if (forbiddenState.active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">アクセスが拒否されました</h1>
          <p className="text-sm leading-relaxed text-gray-700">
            {forbiddenState.message ?? '必要な権限がありません。再ログインしてからもう一度お試しください。'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-xl bg-blue-600 text-white px-5 py-2 text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
            >
              ログアウトする
            </button>
            <button
              onClick={() => (typeof window !== 'undefined' ? window.location.reload() : undefined)}
              className="rounded-xl border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              もう一度試す
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && !appJwtReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-xl shadow-black/10 p-8 text-center space-y-3">
          <h1 className="text-xl font-semibold text-gray-900">セキュアセッションを準備中…</h1>
          <p className="text-sm text-gray-700">数秒待ってから操作を続けてください。</p>
        </div>
      </div>
    );
  }

  // 初期読み込みが終わるまでは表示を抑制して履歴画面のチラつきを防ぐ
  if (!bootstrapped && initialId) {
    return null;
  }

  const showProfile = showProfileOnEmpty && (!active || active.messages.length === 0);
  const showEmptyState = bootstrapped && sessions.length === 0 && !listLoading;
  const tagBusy = tagActionKey != null;
  const tagPanelLoading = tagLoading && activeChatTags.length === 0;

  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 背景アニメーション用レイヤー（親要素は全画面固定のまま装飾のみが被さる） */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 h-full flex gap-4 p-4">
        <SparSidebar
          sessions={sessions}
          activeId={activeId ?? undefined}
          onNewChat={handleNewChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
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
          ) : showEmptyState ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="mx-auto w-full max-w-2xl px-6 md:px-8 text-center space-y-4">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">チャットを始めましょう</h1>
                <p className="text-sm text-gray-600">
                  まだチャットがありません。新しいチャットを作成して、学習を開始してください。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => handleNewChat({})}
                    className="rounded-xl bg-blue-600 text-white px-5 py-2 text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                  >
                    + 新しいチャットを作成
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="rounded-xl border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    プロフィールを見る
                  </button>
                </div>
              </div>
            </div>
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
            <div className="h-full flex flex-col xl:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <SparChatbot
                  messages={active?.messages ?? []}
                  isLoading={sending}
                  hideInput={active?.status === 'ended'}
                  inputDisabled={sending}
                  onSendMessage={(text) => { handleSend(text); }}
                  subjectLabel={active?.subjectName || ((active?.subjectId ? undefined : '数学')) || undefined}
                  topicLabel={active?.topicName || active?.prefTopicName || (((active?.subjectName || (active?.subjectId ? '' : '数学')) || '数学') === '英語' ? '仮定法' : '確率')}
                />
              </div>
              <div className="w-full xl:w-80 flex-shrink-0">
                <ChatTagPanel
                  tagTypes={tagTypes}
                  tags={activeChatTags}
                  availableTags={availableTagOptions}
                  masteryMap={tagMasteryMap}
                  loading={tagPanelLoading}
                  busy={tagBusy}
                  error={tagError}
                  onAddTag={(tagId) => attachTagToActive(tagId)}
                  onRemoveTag={(tagId) => detachTagFromActive(tagId)}
                  onUpdateMastery={(tagId, score) => updateTagMasteryScore(tagId, score)}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
