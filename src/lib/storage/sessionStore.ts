// セッション永続化（Web: LocalStorage実装）（日本語コメント）

import type { ChatSession } from "@/types/chat";

/**
 * LocalStorage のキー（他環境でも流用できるよう公開）
 */
export const SESSION_STORAGE_KEY = "chat:sessions:v1";

/**
 * ストレージアダプタ（Web/RN差分を吸収）
 * - Web: LocalStorage 実装
 * - RN: AsyncStorage/SQLite 実装に差し替え予定
 */
export interface SessionStoreAdapter {
  load(): ChatSession[] | null;
  save(sessions: ChatSession[]): void;
}

let adapter: SessionStoreAdapter = {
  load(): ChatSession[] | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ChatSession[];
    } catch {
      return null;
    }
  },
  save(sessions: ChatSession[]) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
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
export function loadSessions(): ChatSession[] | null {
  return adapter.load();
}

/**
 * すべてのセッションを保存（例外は握りつぶす）
 */
export function saveSessions(sessions: ChatSession[]): void {
  adapter.save(sessions);
}
