-- Mobile BFF 用のテーブルを追加

CREATE TABLE IF NOT EXISTS "devices" (
  "device_id" text PRIMARY KEY,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "model" text,
  "os_version" text,
  "last_seen_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "push_tokens" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "platform" text NOT NULL,
  "device_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "push_tokens_platform_check" CHECK ("platform" IN ('ios','android')),
  CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("user_id", "token")
);

DO $$
BEGIN
  ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_token_unique" UNIQUE ("token");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "iap_receipts" (
  "receipt_id" text PRIMARY KEY,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "platform" text NOT NULL,
  "product_id" text NOT NULL,
  "status" text NOT NULL,
  "purchase_at" timestamptz,
  "expires_at" timestamptz,
  "raw_payload_hash" text,
  "raw_payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "iap_receipts_platform_check" CHECK ("platform" IN ('ios','android')),
  CONSTRAINT "iap_receipts_status_check" CHECK ("status" IN ('trial','active','grace','paused','canceled','expired'))
);

CREATE INDEX IF NOT EXISTS "push_tokens_device_idx" ON "push_tokens" ("device_id");
CREATE INDEX IF NOT EXISTS "devices_user_idx" ON "devices" ("user_id");
CREATE INDEX IF NOT EXISTS "iap_receipts_user_idx" ON "iap_receipts" ("user_id");
