-- Seed initial subjects and topics (idempotent)
-- Subjects: 数学, 英語
-- Topics: 数学→確率, 英語→仮定法

-- subjects
INSERT INTO "subjects" (id, name)
VALUES
  (gen_random_uuid(), '数学'),
  (gen_random_uuid(), '英語')
ON CONFLICT (name) DO NOTHING;

-- topics for 数学
INSERT INTO "topics" (id, subject_id, name)
SELECT gen_random_uuid(), s.id, '確率'
FROM subjects s
WHERE s.name = '数学'
ON CONFLICT DO NOTHING;

-- topics for 英語
INSERT INTO "topics" (id, subject_id, name)
SELECT gen_random_uuid(), s.id, '仮定法'
FROM subjects s
WHERE s.name = '英語'
ON CONFLICT DO NOTHING;

