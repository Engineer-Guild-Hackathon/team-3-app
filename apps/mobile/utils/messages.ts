import type { ChatMessage } from '../components/types';
import type { ConversationTurn } from '../types/chat';

// メッセージ配列を { user, assistant } ターン列に変換
export function messagesToTurns(messages: ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let current: ConversationTurn | null = null;

  messages.forEach((message) => {
    if (message.pending) {
      return;
    }
    if (message.author === 'user') {
      if (current) {
        turns.push(current);
      }
      current = { user: message.text, assistant: '' };
    } else if (message.author === 'assistant') {
      if (current) {
        current.assistant = message.text;
        turns.push(current);
        current = null;
      } else {
        turns.push({ user: '', assistant: message.text });
      }
    }
  });

  if (current) {
    turns.push(current);
  }
  return turns;
}
