"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

/**
 * 送信欄（テキストエリア + 送信ボタン）
 * - Enterで送信、Shift+Enterで改行
 * - 高さの自動調整（簡易実装）
 */
export default function ChatInput({ value, setValue, onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim().length > 0 && !disabled) onSend();
    }
  };

  return (
    <div className="border-t border-black/10 dark:border-white/10 p-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur px-3 py-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力（Enterで送信・Shift+Enterで改行）"
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none placeholder:text-black/40 dark:placeholder:text-white/40 text-sm md:text-base leading-relaxed"
          />
          <button
            onClick={onSend}
            disabled={disabled || value.trim().length === 0}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#0ea5e9] text-white hover:bg-[#0284c7]"
            aria-label="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path d="M3.404 2.31a.75.75 0 0 0-.944.944l2.22 7.13a.75.75 0 0 0 .474.474l7.13 2.22a.75.75 0 0 0 .944-.944l-2.22-7.13a.75.75 0 0 0-.474-.474l-7.13-2.22Z" />
              <path d="M6.82 7.94a.75.75 0 1 0-1.06 1.06l5.3 5.3a.75.75 0 0 0 1.06-1.06l-5.3-5.3Z" />
            </svg>
            送信
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-black/50 dark:text-white/40">
          モデルは接続されていません。UIのみのデモです。
        </p>
      </div>
    </div>
  );
}

