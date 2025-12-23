const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = null;
console.log(app.getPath('userData'))
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../../node_modules/sql.js/dist', file),
  });
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    console.log('Database loaded:', new Date().toISOString())
    console.log('Database', buffer);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    createTables();
    saveDatabase();
  }
  setInterval(saveDatabase, 5 * 60 * 1000);
}

function createTables() {
  // 设备表，增加 type 字段用于类型分布
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
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
    )
  `);

  // 借出记录表，增加 notify_time 字段
  db.run(`
    CREATE TABLE IF NOT EXISTS borrow_records (
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
    )
  `);

  // 用户表，使用密码哈希
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 默认用户：admin/admin123（首次登录请修改密码）
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  try {
    runStmt(db, 'INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  } catch {}
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    console.log('Database saved:', new Date().toISOString());
  }
}

function queryAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function runStmt(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

module.exports = {
  initDatabase,
  getDatabase: () => db,
  saveDatabase,
  queryAll,
  runStmt,
};

