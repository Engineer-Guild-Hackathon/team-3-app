"use client";

import { ChatMessage } from "@/types/chat";
import { memo } from "react";

type Props = {
  message: ChatMessage;
};

/**
 * メッセージ1件の吹き出し表示コンポーネント
 * - ユーザーとアシスタントで配色とレイアウトを切り替える
 */
function MessageBubbleBase({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap leading-relaxed break-words ${
          isUser
            ? "bg-[#0ea5e9] text-white rounded-br-sm"
            : "bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 backdrop-blur rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

