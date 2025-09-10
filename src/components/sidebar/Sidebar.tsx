"use client";

import { ChatSession } from "@/types/chat";
import Link from "next/link";
import { useState } from "react";

type Props = {
  sessions: ChatSession[];
  onNewChat: () => void;
  onSelectChat?: (id: string) => void;
  activeId?: string;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
};

/**
 * 左サイドバー（新規チャット + 履歴）
 */
export default function Sidebar({ sessions, onNewChat, onSelectChat, activeId, onRename, onDelete, collapsed, onToggle }: Props) {
  // メニューとインライン編集用の状態（日本語コメント）
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  return (
    <aside
      className={`hidden md:flex flex-col ${collapsed ? "border-0" : "border-r border-black/10 dark:border-white/10"}`}
      style={{ width: collapsed ? 0 : 288, overflow: "hidden" }}
      aria-hidden={collapsed}
    >
      <div className="p-3 flex items-center justify-between gap-2">
        <button
          onClick={onNewChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 px-3 py-2 text-sm font-medium hover:bg-white/90 dark:hover:bg-white/15"
        >
          + 新しいチャット
        </button>
        <button
          onClick={onToggle}
          aria-label="サイドバーを閉じる"
          title="サイドバーを閉じる"
          className="shrink-0 inline-flex items-center justify-center rounded-md p-2 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="px-3 pb-3 text-xs font-medium text-black/50 dark:text-white/50">履歴</div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 && (
          <div className="mx-2 text-xs text-black/40 dark:text-white/40">
            履歴はまだありません。
          </div>
        )}
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li key={s.id} className="relative">
              <div
                className={`group flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 ${
                  activeId === s.id ? "bg-black/5 dark:bg-white/10" : ""
                }`}
                title={s.title}
              >
                {editingId === s.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const t = draftTitle.trim();
                          if (t) onRename?.(s.id, t);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-sm outline-none"
                      placeholder="名称を入力"
                    />
                    <button
                      aria-label="保存"
                      title="保存"
                      onClick={() => {
                        const t = draftTitle.trim();
                        if (t) onRename?.(s.id, t);
                        setEditingId(null);
                      }}
                      className="inline-flex items-center justify-center rounded-md p-1.5 bg-black/80 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-black/30 dark:bg-white/20 dark:hover:bg-white/25"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.007L3.29 9.99A1 1 0 1 1 4.71 8.57l3.003 3.003 6.543-6.588a1 1 0 0 1 1.448.006Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      aria-label="取消"
                      title="取消"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <Link href={`/chats/${s.id}`} className="block flex-1 truncate px-1 py-1 text-sm">
                    {s.title || "(無題)"}
                  </Link>
                )}

                <div
                  className="relative"
                  tabIndex={-1}
                  onBlur={(e) => {
                    const next = e.relatedTarget as HTMLElement | null;
                    if (!next || !e.currentTarget.contains(next)) setMenuOpenId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setMenuOpenId(null);
                  }}
                >
                  <button
                    className="rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label="Open menu"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpenId((v) => (v === s.id ? null : s.id));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d="M12 6.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                    </svg>
                  </button>
                  {menuOpenId === s.id && (
                    <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow">
                      <button
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenId(null);
                          setEditingId(s.id);
                          setDraftTitle(s.title);
                        }}
                      >名称を変更</button>
                      <button
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-600/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenId(null);
                          const ok = window.confirm("このチャットを削除しますか？");
                          if (ok) onDelete?.(s.id);
                        }}
                      >削除</button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
