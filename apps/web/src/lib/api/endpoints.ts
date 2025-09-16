// API エンドポイント定義（日本語コメント）

export const endpoints = {
  chat(): string {
    return "/api/chat";
  },
  chats(): string {
    return "/api/chats";
  },
  chatById(id: string): string {
    return `/api/chats/${id}`;
  },
  messagesByChatId(id: string): string {
    return `/api/chats/${id}/messages`;
  },
  subjects(): string {
    return "/api/subjects";
  },
  topicsBySubject(subjectId: string): string {
    return `/api/subjects/${subjectId}/topics`;
  },
} as const;

