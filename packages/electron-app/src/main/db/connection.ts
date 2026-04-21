/**
 * Electron 主进程数据库连接
 * 使用 better-sqlite3
 */

import * as schema from '@equipment/shared/db/sqlite-schema';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

type SqliteDatabase = ReturnType<typeof Database>;

let db: SqliteDatabase | null = null;
let drizzleDb: BetterSQLite3Database<typeof schema> | null = null;

/**
 * 获取数据库文件路径
 */
export function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  const preferred = path.join(userDataPath, 'equipment.db');

  const candidates: string[] = [
    preferred,
    path.join(userDataPath, 'database.sqlite'),
    path.join(userDataPath, 'database.db'),
  ];

  const legacyUserData = process.env.EQUIPMENT_LEGACY_USER_DATA?.trim();
  if (legacyUserData) {
    candidates.push(
      path.join(legacyUserData, 'equipment.db'),
      path.join(legacyUserData, 'database.sqlite'),
      path.join(legacyUserData, 'database.db'),
    );
  }

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      continue;
    }
  }

  return preferred;
}

/**
 * 初始化数据库连接
 */
export function initDatabase(): SqliteDatabase {
  if (db) return db;

  const dbPath = getDbPath();
  console.log('[Database] Opening:', dbPath);

  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {
    // ignore
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 初始化表结构
  initTables();
  upgradeTimestampsToMs();

  // 创建 Drizzle ORM 实例
  drizzleDb = drizzle(db, { schema });

  return db;
}

/**
 * 获取数据库实例
 */
export function getDatabase(): SqliteDatabase {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * 获取 Drizzle ORM 实例
 */
export function getDrizzleDb(): BetterSQLite3Database<typeof schema> {
  if (!drizzleDb) {
    initDatabase();
  }
  return drizzleDb!;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    drizzleDb = null;
  }
}

/**
 * 初始化数据库表
 */
function initTables(): void {
  if (!db) return;

  // 设备表
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '',
      brand TEXT DEFAULT '',
      model TEXT DEFAULT '',
      price REAL DEFAULT 0,
      location TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'available',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS device_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_device_types_name ON device_types(name);
  `);

  // 借还记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id),
      device_code TEXT NOT NULL,
      device_name TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      borrower_class TEXT DEFAULT '',
      borrower_student_id TEXT DEFAULT '',
      borrower_phone TEXT DEFAULT '',
      borrow_time INTEGER NOT NULL,
      return_deadline INTEGER NOT NULL,
      actual_return_time INTEGER,
      notified INTEGER DEFAULT 0,
      notify_time INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_borrow_device_id ON borrow_records(device_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_return_time ON borrow_records(actual_return_time);
    CREATE INDEX IF NOT EXISTS idx_borrow_deadline ON borrow_records(return_deadline);
  `);

  // 用户表（本地认证）
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);

  // 会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS report_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL DEFAULT 'weekly',
      period_start INTEGER NOT NULL,
      period_end INTEGER NOT NULL,
      generated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      kpi_snapshot TEXT NOT NULL,
      report_json TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_report_queries_generated_at ON report_queries(generated_at);
    CREATE INDEX IF NOT EXISTS idx_report_queries_status ON report_queries(status);
  `);

  console.log('[Database] Tables initialized');
}

function upgradeTimestampsToMs(): void {
  if (!db) return;

  const threshold = 1000000000000;
  const updates: string[] = [
    `UPDATE devices SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,
    `UPDATE devices SET updated_at = updated_at * 1000 WHERE updated_at IS NOT NULL AND updated_at > 0 AND updated_at < ${threshold}`,

    `UPDATE device_types SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,
    `UPDATE device_types SET updated_at = updated_at * 1000 WHERE updated_at IS NOT NULL AND updated_at > 0 AND updated_at < ${threshold}`,

    `UPDATE borrow_records SET borrow_time = borrow_time * 1000 WHERE borrow_time IS NOT NULL AND borrow_time > 0 AND borrow_time < ${threshold}`,
    `UPDATE borrow_records SET return_deadline = return_deadline * 1000 WHERE return_deadline IS NOT NULL AND return_deadline > 0 AND return_deadline < ${threshold}`,
    `UPDATE borrow_records SET actual_return_time = actual_return_time * 1000 WHERE actual_return_time IS NOT NULL AND actual_return_time > 0 AND actual_return_time < ${threshold}`,
    `UPDATE borrow_records SET notify_time = notify_time * 1000 WHERE notify_time IS NOT NULL AND notify_time > 0 AND notify_time < ${threshold}`,
    `UPDATE borrow_records SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,

    `UPDATE users SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,
    `UPDATE users SET updated_at = updated_at * 1000 WHERE updated_at IS NOT NULL AND updated_at > 0 AND updated_at < ${threshold}`,

    `UPDATE sessions SET expires_at = expires_at * 1000 WHERE expires_at IS NOT NULL AND expires_at > 0 AND expires_at < ${threshold}`,
    `UPDATE sessions SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,

    `UPDATE report_queries SET period_start = period_start * 1000 WHERE period_start IS NOT NULL AND period_start > 0 AND period_start < ${threshold}`,
    `UPDATE report_queries SET period_end = period_end * 1000 WHERE period_end IS NOT NULL AND period_end > 0 AND period_end < ${threshold}`,
    `UPDATE report_queries SET generated_at = generated_at * 1000 WHERE generated_at IS NOT NULL AND generated_at > 0 AND generated_at < ${threshold}`,
    `UPDATE report_queries SET created_at = created_at * 1000 WHERE created_at IS NOT NULL AND created_at > 0 AND created_at < ${threshold}`,
  ];

  let changed = 0;
  for (const sql of updates) {
    try {
      const res = db.prepare(sql).run();
      changed += res.changes ?? 0;
    } catch (error) {
      console.error('[Database] Timestamp upgrade failed:', error);
    }
  }

  if (changed > 0) {
    console.log(`[Database] Upgraded ${changed} timestamp values to ms`);
  }
}

/**
 * 备份数据库
 */
export function backupDatabase(): string {
  const db = getDatabase();
  const backupPath = getDbPath() + '.backup';
  db.backup(backupPath);
  return backupPath;
}
