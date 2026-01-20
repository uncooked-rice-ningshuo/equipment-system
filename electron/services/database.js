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

      // 检查是否需要重建数据库（通过检查是否有 updated_at 字段）
      const testDb = new Database(backupPath, { verbose: null });
      const columns = testDb.pragma('table_info(devices)');
      const hasUpdatedAt = columns.some((col) => col.name === 'updated_at');
      testDb.close();

      if (!hasUpdatedAt) {
        console.log('Database schema needs update, deleting old database...');
        fs.unlinkSync(dbPath);
        console.log('Old database deleted, will create with new schema');
      }
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
      type TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      price REAL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance', 'retired')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      device_code TEXT NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      device_brand TEXT,
      borrower_name TEXT NOT NULL,
      borrower_class TEXT NOT NULL,
      borrower_student_id TEXT NOT NULL,
      borrower_phone TEXT NOT NULL,
      borrow_time DATETIME NOT NULL,
      return_deadline DATETIME NOT NULL,
      actual_return_time DATETIME,
      notified INTEGER DEFAULT 0 CHECK (notified IN (0, 1)),
      notify_time DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE RESTRICT,
      CHECK (borrow_time < return_deadline),
      CHECK (actual_return_time IS NULL OR actual_return_time >= borrow_time)
    )`,
  ];

  db.transaction(() => {
    for (const sql of tables) {
      db.prepare(sql).run();
    }

    runStmt(db, 'CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code)');
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)',
    );
    runStmt(db, 'CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type)');
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_devices_brand ON devices(brand, type)',
    );
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
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_returned ON borrow_records(actual_return_time)',
    );
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_borrower ON borrow_records(borrower_name, borrower_student_id)',
    );
    runStmt(
      db,
      'CREATE INDEX IF NOT EXISTS idx_borrow_device_code ON borrow_records(device_code)',
    );

    try {
      db.prepare('DROP TABLE IF EXISTS users').run();
    } catch (error) {
      console.error('Error dropping legacy users table:', error);
    }

    const triggers = db
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger'")
      .all();
    const triggerNames = triggers.map((t) => t.name);

    if (!triggerNames.includes('update_devices_timestamp')) {
      db.prepare(
        `
        CREATE TRIGGER update_devices_timestamp
        AFTER UPDATE ON devices
        FOR EACH ROW
        BEGIN
          UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `,
      ).run();
      console.log('Created trigger: update_devices_timestamp');
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
