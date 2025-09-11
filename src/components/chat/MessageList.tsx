"use client";

import { ChatMessage } from "@/types/chat";

import { MessageBubble } from "./MessageBubble";

type Props = {
  messages: ChatMessage[];
};

/**
 * メッセージ一覧のスクロール領域
 */
export default function MessageList({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
    </div>
  );
}

