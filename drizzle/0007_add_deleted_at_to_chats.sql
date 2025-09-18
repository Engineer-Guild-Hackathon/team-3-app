ALTER TABLE "chats"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS "chats_deleted_at_idx" ON "chats" ("deleted_at");
