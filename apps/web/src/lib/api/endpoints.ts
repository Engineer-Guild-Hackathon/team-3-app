// API エンドポイント定義（日本語コメント）

export const endpoints = {
  chat(): string {
    return "/api/v1/chat";
  },
  chats(): string {
    return "/api/v1/chats";
  },
  chatById(id: string): string {
    return `/api/v1/chats/${id}`;
  },
  messagesByChatId(id: string): string {
    return `/api/v1/chats/${id}/messages`;
  },
  tagTypes(): string {
    return '/api/v1/tag-types';
  },
  tags(): string {
    return '/api/v1/tags';
  },
  chatTags(chatId: string): string {
    return `/api/v1/chats/${chatId}/tags`;
  },
  chatTagById(chatId: string, tagId: string): string {
    return `/api/v1/chats/${chatId}/tags/${tagId}`;
  },
  tagMastery(): string {
    return '/api/v1/tag-mastery';
  },
  tagMasteryByTag(tagId: string): string {
    return `/api/v1/tags/${tagId}/mastery`;
  },
  subjects(): string {
    return '/api/v1/subjects';
  },
  topicsBySubject(subjectId: string): string {
    return `/api/v1/subjects/${subjectId}/topics`;
  },
} as const;
