// DB マイグレーション（本番ランタイム用）
// - drizzle-kit CLI なしで、実行時に SQL マイグレーションを適用します。
// - DATABASE_URL を使用し、`drizzle/` ディレクトリの SQL を適用します。

import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

/**
 * エントリポイント
 */
async function main() {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error('[migrate] DATABASE_URL is not set');
    process.exit(2);
  }

  // Azure Database for PostgreSQL 等、sslmode=require のケースを考慮
  // 接続文字列に sslmode が含まれていない場合でも、本番では TLS を有効化
  const needsTLS = /sslmode=require/i.test(DATABASE_URL) || process.env.NODE_ENV === 'production';

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: needsTLS ? { rejectUnauthorized: false } : undefined,
  });

  console.log('[migrate] connecting to database...');
  await client.connect();

  try {
    const db = drizzle(client);
    console.log('[migrate] applying migrations from ./drizzle');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('[migrate] migration finished successfully');
  } catch (err) {
    console.error('[migrate] migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

