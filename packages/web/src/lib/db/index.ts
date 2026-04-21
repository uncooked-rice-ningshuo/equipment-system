/**
 * Drizzle ORM 数据库连接
 * Web 版使用 PostgreSQL
 */

import * as authSchema from '@equipment/shared/db/auth-schema';
import * as businessSchema from '@equipment/shared/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

let client: Sql | null = null;
const schema = { ...businessSchema, ...authSchema };
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

// 导出业务 schema
export * from '@equipment/shared/db/schema';
// 导出认证 schema
export * from '@equipment/shared/db/auth-schema';
