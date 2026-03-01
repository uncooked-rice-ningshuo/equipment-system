/**
 * Electron 主进程数据库连接
 * 使用 better-sqlite3
 */

import * as schema from '@equipment/shared/db/sqlite-schema';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';

let db: Database.Database | null = null;
let drizzleDb: BetterSQLite3Database<typeof schema> | null = null;

/**
 * 获取数据库文件路径
 */
export function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'equipment.db');
}

/**
 * 初始化数据库连接
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  console.log('[Database] Opening:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 初始化表结构
  initTables();

  // 创建 Drizzle ORM 实例
  drizzleDb = drizzle(db, { schema });

  return db;
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
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

  console.log('[Database] Tables initialized');
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
