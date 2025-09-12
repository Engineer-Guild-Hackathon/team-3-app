import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// Drizzle Kit 設定（開発/CI用）。接続は DATABASE_URL を使用します。
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

