/**
 * Drizzle ORM 数据库连接
 * Web 版使用 PostgreSQL
 */

import * as schema from '@equipment/shared/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

let client: Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (db) return db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }
  client = postgres(connectionString);
  db = drizzle(client, { schema });
  return db;
}

// 导出 schema
export * from '@equipment/shared/db/schema';
