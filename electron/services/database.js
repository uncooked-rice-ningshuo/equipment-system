const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = null;
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
const backupPath = path.join(app.getPath('userData'), 'database_backup.sqlite');

function initDatabase() {
  // Create backup if database exists
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backup created at:', backupPath);
    } catch (e) {
      console.error('Failed to create database backup:', e);
    }
  }

  // Initialize better-sqlite3
  // verbose: console.log will log executed queries
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
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  db.transaction(() => {
    for (const sql of tables) {
      db.prepare(sql).run();
    }

    // Create default user if not exists
    // Note: We'll migrate to better-auth tables later, this is for backward compatibility
    try {
      // Check if admin exists
      const admin = db
        .prepare('SELECT id FROM users WHERE username = ?')
        .get('admin');
      if (!admin) {
        // We temporarily use a placeholder hash or keep the old one
        // Since we are migrating to better-auth, this user might need to be migrated or recreated
        // For now, let's keep it compatible if we still use the old auth logic
        // But the user asked for better-auth upgrade, so we might need new tables for better-auth.
      }
    } catch (error) {
      console.error('Error creating default user:', error);
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
  saveDatabase,
  queryAll,
  runStmt,
};
