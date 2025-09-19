INSERT INTO "tag_types" ("code", "label")
VALUES
  ('definition', '定義'),
  ('concept', '概念理解'),
  ('procedure', '手順'),
  ('application', '応用'),
  ('intuition', '直感 / 誤解耐性')
ON CONFLICT ("code") DO UPDATE
SET "label" = EXCLUDED."label";
