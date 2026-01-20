const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = null;

// 旧的数据库路径（之前使用 app.getPath('userData')）
const legacyDbPath = path.join(app.getPath('userData'), 'database.sqlite');

// 新的数据库路径：开发环境迁移到项目目录下，方便使用可视化工具查看
// 生产环境仍然使用 userData，避免只读目录问题
const isDev = !app.isPackaged;
const projectDbPath = path.join(
  __dirname,
  '..',
  '..',
  'data',
  'database.sqlite',
);

const dbPath = isDev ? projectDbPath : legacyDbPath;
const backupPath = path.join(path.dirname(dbPath), 'database_backup.sqlite');

function initDatabase() {
  // 确保目录存在
  const dbDir = path.dirname(dbPath);
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (e) {
    console.error('Failed to ensure database directory exists:', dbDir, e);
  }

  // 如果是开发环境，且新路径不存在但旧路径存在，则做一次迁移拷贝
  if (isDev && !fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
    try {
      fs.copyFileSync(legacyDbPath, dbPath);
      console.log('Database migrated from legacy path to project path:', {
        from: legacyDbPath,
        to: dbPath,
      });
    } catch (e) {
      console.error('Failed to migrate legacy database file:', e);
    }
  }

  // 如果当前路径已存在数据库文件，则先创建备份
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backup created at:', backupPath);
    } catch (e) {
      console.error('Failed to create database backup:', e);
    }
  }

  // 初始化 better-sqlite3
  db = new Database(dbPath, { verbose: null });
  console.log('Database loaded using better-sqlite3:', dbPath);

  // Enable WAL mode for better concurrency and performance
  db.pragma('journal_mode = WAL');

  createTables();
}

function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      brand TEXT,
      model TEXT,
      price REAL,
      location TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      borrower_name TEXT NOT NULL,
      borrower_class TEXT NOT NULL,
      borrower_student_id TEXT NOT NULL,
      borrower_phone TEXT NOT NULL,
      borrow_time DATETIME NOT NULL,
      return_deadline DATETIME NOT NULL,
      actual_return_time DATETIME,
      notified INTEGER DEFAULT 0,
      notify_time DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    )`,
  ];

  db.transaction(() => {
    for (const sql of tables) {
      db.prepare(sql).run();
    }

    // 添加索引以提高查询性能
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_device ON borrow_records(device_id)',
    );
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_time ON borrow_records(borrow_time)',
    );
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_deadline ON borrow_records(return_deadline)',
    );

    // 清理已废弃的旧表：users（旧认证逻辑使用）
    try {
      db.prepare('DROP TABLE IF EXISTS users').run();
    } catch (error) {
      console.error('Error dropping legacy users table:', error);
    }
  })();
}

// better-sqlite3 saves automatically, so this is a no-op or can be used for explicit checkpoints
function saveDatabase() {
  // WAL mode has auto-checkpointing, but we can force it if needed
  // db.pragma('wal_checkpoint(RESTART)');
  console.log('Database autosaved (better-sqlite3 handles persistence)');
}

function queryAll(database, sql, params = []) {
  // better-sqlite3 prepare().all() returns array of objects
  return database.prepare(sql).all(params);
}

function runStmt(database, sql, params = []) {
  // better-sqlite3 prepare().run() returns info object { changes, lastInsertRowid }
  return database.prepare(sql).run(params);
}

module.exports = {
  initDatabase,
  getDatabase: () => db,
  getDbPath: () => dbPath,
  saveDatabase,
  queryAll,
  runStmt,
};
