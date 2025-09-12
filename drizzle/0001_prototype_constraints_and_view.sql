-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Unique constraints for composite natural keys
ALTER TABLE tags
  ADD CONSTRAINT uq_tags_subject_name UNIQUE (subject_id, name);

ALTER TABLE topics
  ADD CONSTRAINT uq_topics_subject_name UNIQUE (subject_id, name);

-- Check constraints for enumerations (TEXT + CHECK)
ALTER TABLE chats
  ADD CONSTRAINT ck_chats_status CHECK (status IN ('in_progress','ended'));

ALTER TABLE messages
  ADD CONSTRAINT ck_messages_role CHECK (role IN ('user','assistant','system'));

ALTER TABLE chat_tags
  ADD CONSTRAINT ck_chat_tags_assigned_by CHECK (assigned_by IN ('ai','user','system'));

-- View: user_tag_mastery_v (simple aggregation for prototype)
CREATE OR REPLACE VIEW user_tag_mastery_v AS
SELECT
  c.user_id,
  ct.tag_id,
  COUNT(*)::int AS occurrence_count,
  MAX(c.updated_at) AS last_tagged_at
FROM chat_tags ct
JOIN chats c ON c.id = ct.chat_id
GROUP BY c.user_id, ct.tag_id;

