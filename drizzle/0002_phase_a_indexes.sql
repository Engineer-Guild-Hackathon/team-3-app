-- Phase A: performance indexes
-- chats: list by user, updated desc
CREATE INDEX IF NOT EXISTS idx_chats_user_updated ON "chats" ("user_id", "updated_at" DESC);

-- messages: fetch by chat, created asc
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON "messages" ("chat_id", "created_at" ASC);

