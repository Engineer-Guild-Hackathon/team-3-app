-- Seed initial subjects and topics (idempotent)
-- Subjects: 物理, 英語
-- Topics: 物理→加速度, 英語→仮定法

-- subjects
INSERT INTO "subjects" (id, name)
VALUES
  (gen_random_uuid(), '物理'),
  (gen_random_uuid(), '英語')
ON CONFLICT (name) DO NOTHING;

-- topics for 物理
INSERT INTO "topics" (id, subject_id, name)
SELECT gen_random_uuid(), s.id, '加速度'
FROM subjects s
WHERE s.name = '物理'
ON CONFLICT DO NOTHING;

-- topics for 英語
INSERT INTO "topics" (id, subject_id, name)
SELECT gen_random_uuid(), s.id, '仮定法'
FROM subjects s
WHERE s.name = '英語'
ON CONFLICT DO NOTHING;

