import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { fileURLToPath } from 'url';
import path from 'path';

const baseDir = path.dirname(fileURLToPath(import.meta.url));

// Drizzle Kit 設定（開発/CI用）。接続は DATABASE_URL を使用します。
export default {
  schema: path.resolve(baseDir, 'apps/web/src/db/schema.ts'),
  out: path.resolve(baseDir, 'drizzle'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
