// セッション永続化（Web: LocalStorage実装）（日本語コメント）

import type { ChatSession } from "@/types/chat";

/**
 * LocalStorage のキー（他環境でも流用できるよう公開）
 */
export const SESSION_STORAGE_KEY = "chat:sessions:v1";
const LEGACY_STORAGE_KEY = SESSION_STORAGE_KEY;

const ownerKey = (owner: string) => `${SESSION_STORAGE_KEY}:${owner}`;

/**
 * ストレージアダプタ（Web/RN差分を吸収）
 * - Web: LocalStorage 実装
 * - RN: AsyncStorage/SQLite 実装に差し替え予定
 */
export interface SessionStoreAdapter {
  load(key: string): ChatSession[] | null;
  save(key: string, sessions: ChatSession[]): void;
  remove?(key: string): void;
}

let adapter: SessionStoreAdapter = {
  load(key: string): ChatSession[] | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as ChatSession[];
    } catch {
      return null;
    }
  },
  save(key: string, sessions: ChatSession[]) {
    try {
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch {
      // no-op
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
};

/**
 * アダプタ差し替え（RN移植時に使用）
 */
export function setSessionStoreAdapter(next: SessionStoreAdapter) {
  adapter = next;
}

/**
 * すべてのセッションを読み込む（失敗時は null）
 */
export function loadSessions(owner?: string | null): ChatSession[] | null {
  if (!owner) return null;
  const key = ownerKey(owner);
  const current = adapter.load(key);
  if (current) return current;

  // 旧キーに保存されている履歴があれば移行
  const legacy = adapter.load(LEGACY_STORAGE_KEY);
  if (legacy) {
    adapter.save(key, legacy);
    adapter.remove?.(LEGACY_STORAGE_KEY);
    return legacy;
  }
  return null;
}

/**
 * すべてのセッションを保存（例外は握りつぶす）
 */
export function saveSessions(owner: string | null | undefined, sessions: ChatSession[]): void {
  if (!owner) return;
  adapter.save(ownerKey(owner), sessions);
}
