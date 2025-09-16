// データベースクライアント（pg + Drizzle）
// 注意: 環境変数 DATABASE_URL を使用します。

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // ログは英語のみ
  console.warn('DATABASE_URL is not set. DB client will not be initialized.');
}

export const pool = connectionString
  ? new Pool({ connectionString })
  : undefined;

export const db = pool ? drizzle(pool) : undefined;

