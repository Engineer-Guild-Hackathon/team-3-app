-- Add topic_id to chats and foreign key to topics
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "topic_id" uuid;
DO $$ BEGIN
  ALTER TABLE "chats" ADD CONSTRAINT "chats_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

