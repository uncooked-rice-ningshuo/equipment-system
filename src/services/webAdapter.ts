import initSqlJs from 'sql.js';
import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';

let dbPromise: Promise<any> | null = null;

function uint8ArrayToBase64(u8: Uint8Array): string {
  let binary = '';
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js/dist/${file}` });
      const saved = localStorage.getItem('web-db');
      const db = saved ? new SQL.Database(base64ToUint8Array(saved)) : new SQL.Database();
      if (!saved) {
        createTables(db);
        save(db);
      }
      return db;
    })();
  }
  return await dbPromise;
}

function save(db: any) {
  const data = db.export();
  localStorage.setItem('web-db', uint8ArrayToBase64(data));
}

function runStmt(db: any, sql: string, params: any[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

function queryAll(db: any, sql: string, params: any[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function createTables(db: any) {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const hash = bcrypt.hashSync('admin123', 10);
  try { runStmt(db, 'INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]); } catch {}
}

export async function invoke(channel: string, ...args: any[]): Promise<any> {
  const db = await getDb();
  switch (channel) {
    case 'device:list': {
      const filters = args[0] || {};
      let sql = 'SELECT * FROM devices WHERE 1=1';
      const params: any[] = [];
      if (filters.code) { sql += ' AND code LIKE ?'; params.push(`%${filters.code}%`); }
      if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
      if (filters.type) { sql += ' AND type = ?'; params.push(filters.type); }
      return queryAll(db, sql, params);
    }
    case 'device:create': {
      const d = args[0];
      try {
        runStmt(db, 'INSERT INTO devices (code, name, type, brand, model, price, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [d.code, d.name, d.type || '', d.brand || '', d.model || '', d.price || 0, d.location || '', 'available']);
        save(db);
        return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
    }
    case 'device:update': {
      const id = args[0]; const d = args[1];
      try {
        runStmt(db, 'UPDATE devices SET code=?, name=?, type=?, brand=?, model=?, price=?, location=? WHERE id=?',
          [d.code, d.name, d.type || '', d.brand || '', d.model || '', d.price || 0, d.location || '', id]);
        save(db);
        return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
    }
    case 'device:delete': {
      const id = args[0];
      const status = queryAll(db, 'SELECT status FROM devices WHERE id = ?', [id])[0]?.status;
      if (status === 'borrowed') return { success: false, message: '设备已借出，无法删除' };
      try { runStmt(db, 'DELETE FROM devices WHERE id = ?', [id]); save(db); return { success: true }; }
      catch (e: any) { return { success: false, message: e.message }; }
    }
    case 'borrow:create': {
      const r = args[0];
      const st = queryAll(db, 'SELECT status FROM devices WHERE id = ?', [r.device_id])[0]?.status;
      if (st === 'borrowed') return { success: false, message: '该设备当前不可借，请选择其他设备' };
      runStmt(db, `INSERT INTO borrow_records (device_id, borrower_name, borrower_class, borrower_student_id, borrower_phone, borrow_time, return_deadline, notified) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [r.device_id, r.borrower_name, r.borrower_class, r.borrower_student_id, r.borrower_phone, r.borrow_time, r.return_deadline]);
      runStmt(db, 'UPDATE devices SET status = ? WHERE id = ?', ['borrowed', r.device_id]);
      save(db);
      return { success: true };
    }
    case 'borrow:return': {
      const recordId = args[0];
      const now = new Date().toISOString();
      const deviceId = queryAll(db, 'SELECT device_id FROM borrow_records WHERE id = ?', [recordId])[0]?.device_id;
      runStmt(db, 'UPDATE borrow_records SET actual_return_time = ? WHERE id = ?', [now, recordId]);
      if (deviceId) runStmt(db, 'UPDATE devices SET status = ? WHERE id = ?', ['available', deviceId]);
      save(db);
      return { success: true };
    }
    case 'borrow:list': {
      const sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
                   FROM borrow_records br JOIN devices d ON d.id = br.device_id
                   WHERE br.actual_return_time IS NULL`;
      return queryAll(db, sql, []);
    }
    case 'borrow:listOverdue': {
      const sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
                   FROM borrow_records br JOIN devices d ON d.id = br.device_id
                   WHERE br.actual_return_time IS NULL`;
      const rows = queryAll(db, sql, []);
      const now = dayjs();
      const overdue: any[] = []; const dueSoon: any[] = [];
      rows.forEach((r) => {
        const ddl = dayjs(r.return_deadline);
        const diff = ddl.diff(now, 'day');
        const item = { ...r, remaining_days: diff };
        if (diff < 0) overdue.push(item); else if (diff <= 5) dueSoon.push(item);
      });
      overdue.sort((a,b) => a.remaining_days - b.remaining_days);
      dueSoon.sort((a,b) => a.remaining_days - b.remaining_days);
      return { overdue, dueSoon };
    }
    case 'notify:mark': {
      const recordId = args[0];
      const now = new Date().toISOString();
      runStmt(db, 'UPDATE borrow_records SET notified = 1, notify_time = ? WHERE id = ?', [now, recordId]);
      save(db);
      return { success: true };
    }
    case 'stats:dashboard': {
      const totalDevices = queryAll(db, 'SELECT COUNT(*) as c FROM devices')[0]?.c || 0;
      const borrowedDevices = queryAll(db, "SELECT COUNT(*) as c FROM devices WHERE status = 'borrowed'")[0]?.c || 0;
      const overdueDevices = queryAll(db, `SELECT COUNT(*) as c FROM borrow_records WHERE actual_return_time IS NULL AND datetime(return_deadline) < datetime('now')`)[0]?.c || 0;
      return { totalDevices, borrowedDevices, availableDevices: totalDevices - borrowedDevices, overdueDevices };
    }
    case 'auth:login': {
      const username = args[0]; const password = args[1];
      const row = queryAll(db, 'SELECT * FROM users WHERE username = ?', [username])[0];
      if (!row) return { success: false, message: '用户名或密码错误' };
      const ok = bcrypt.compareSync(password, row.password_hash);
      if (!ok) return { success: false, message: '用户名或密码错误' };
      return { success: true };
    }
    case 'auth:changePassword': {
      const username = args[0]; const oldPwd = args[1]; const newPwd = args[2];
      const row = queryAll(db, 'SELECT * FROM users WHERE username = ?', [username])[0];
      if (!row) return { success: false, message: '用户不存在' };
      const ok = bcrypt.compareSync(oldPwd, row.password_hash);
      if (!ok) return { success: false, message: '原密码输入错误' };
      const hash = bcrypt.hashSync(newPwd, 10);
      runStmt(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.id]);
      save(db);
      return { success: true };
    }
    default:
      return { success: false, message: '未知接口' };
  }
}

