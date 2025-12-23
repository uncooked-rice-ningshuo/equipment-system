const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, getDatabase, saveDatabase, queryAll, runStmt } = require('./services/database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = app.isPackaged
    ? `file://${path.join(__dirname, '../dist/index.html')}`
    : 'http://localhost:8000';

  mainWindow.loadURL(url);
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

app.on('before-quit', () => {
  saveDatabase();
});

// 设备管理 API
ipcMain.handle('device:list', async (event, filters) => {
  const db = getDatabase();
  let sql = 'SELECT * FROM devices WHERE 1=1';
  const params = [];
  if (filters?.code) {
    sql += ' AND code LIKE ?';
    params.push(`%${filters.code}%`);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  if (filters?.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }
  const rows = queryAll(db, sql, params);
  return rows;
});

ipcMain.handle('device:create', async (event, device) => {
  const db = getDatabase();
  const { code, name, type, brand, model, price, location } = device;
  try {
    runStmt(db,
      'INSERT INTO devices (code, name, type, brand, model, price, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [code, name, type || '', brand || '', model || '', price || 0, location || '', 'available']
    );
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('device:update', async (event, id, device) => {
  const db = getDatabase();
  const { code, name, type, brand, model, price, location } = device;
  try {
    runStmt(db,
      'UPDATE devices SET code=?, name=?, type=?, brand=?, model=?, price=?, location=? WHERE id=?',
      [code, name, type || '', brand || '', model || '', price || 0, location || '', id]
    );
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('device:delete', async (event, id) => {
  const db = getDatabase();
  const status = queryAll(db, 'SELECT status FROM devices WHERE id = ?', [id])[0]?.status;
  if (status === 'borrowed') {
    return { success: false, message: '设备已借出，无法删除' };
  }
  try {
    runStmt(db, 'DELETE FROM devices WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// 借还记录 API
ipcMain.handle('borrow:create', async (event, record) => {
  const db = getDatabase();
  const {
    device_id, borrower_name, borrower_class, borrower_student_id,
    borrower_phone, borrow_time, return_deadline,
  } = record;
  try {
    // 再次校验设备可借
    const st = queryAll(db, 'SELECT status FROM devices WHERE id = ?', [device_id])[0]?.status;
    if (st === 'borrowed') {
      return { success: false, message: '该设备当前不可借，请选择其他设备' };
    }

    runStmt(db,
      `INSERT INTO borrow_records 
       (device_id, borrower_name, borrower_class, borrower_student_id, borrower_phone, borrow_time, return_deadline, notified)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [device_id, borrower_name, borrower_class, borrower_student_id, borrower_phone, borrow_time, return_deadline]
    );
    runStmt(db, 'UPDATE devices SET status = ? WHERE id = ?', ['borrowed', device_id]);
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('borrow:return', async (event, recordId) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    const deviceId = queryAll(db, 'SELECT device_id FROM borrow_records WHERE id = ?', [recordId])[0]?.device_id;
    runStmt(db, 'UPDATE borrow_records SET actual_return_time = ? WHERE id = ?', [now, recordId]);
    if (deviceId) {
      runStmt(db, 'UPDATE devices SET status = ? WHERE id = ?', ['available', deviceId]);
    }
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('borrow:list', async (event, filters) => {
  const db = getDatabase();
  let sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
             FROM borrow_records br JOIN devices d ON d.id = br.device_id
             WHERE br.actual_return_time IS NULL`;
  const params = [];
  if (filters?.device_code) {
    sql += ' AND d.code LIKE ?'; params.push(`%${filters.device_code}%`);
  }
  const rows = queryAll(db, sql, params);
  return rows;
});

ipcMain.handle('borrow:listOverdue', async () => {
  const db = getDatabase();
  const sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
               FROM borrow_records br JOIN devices d ON d.id = br.device_id
               WHERE br.actual_return_time IS NULL`;
  const rows = queryAll(db, sql, []);
  const dayjs = require('dayjs');
  const now = dayjs();
  const overdue = [];
  const dueSoon = [];
  rows.forEach(r => {
    const ddl = dayjs(r.return_deadline);
    const diff = ddl.diff(now, 'day');
    const item = { ...r, remaining_days: diff };
    if (diff < 0) overdue.push(item);
    else if (diff <= 5) dueSoon.push(item);
  });
  overdue.sort((a,b) => a.remaining_days - b.remaining_days);
  dueSoon.sort((a,b) => a.remaining_days - b.remaining_days);
  return { overdue, dueSoon };
});

ipcMain.handle('notify:mark', async (event, recordId) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    runStmt(db, 'UPDATE borrow_records SET notified = 1, notify_time = ? WHERE id = ?', [now, recordId]);
    saveDatabase();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// 统计数据 API
ipcMain.handle('stats:dashboard', async () => {
  const db = getDatabase();
  const totalDevices = queryAll(db, 'SELECT COUNT(*) as c FROM devices')[0]?.c || 0;
  const borrowedDevices = queryAll(db, "SELECT COUNT(*) as c FROM devices WHERE status = 'borrowed'")[0]?.c || 0;
  const overdueDevices = queryAll(db, `SELECT COUNT(*) as c FROM borrow_records 
    WHERE actual_return_time IS NULL AND datetime(return_deadline) < datetime('now')`)[0]?.c || 0;
  return {
    totalDevices,
    borrowedDevices,
    availableDevices: totalDevices - borrowedDevices,
    overdueDevices,
  };
});

// 认证 API（bcryptjs）
ipcMain.handle('auth:login', async (event, username, password) => {
  const db = getDatabase();
  const row = queryAll(db, 'SELECT * FROM users WHERE username = ?', [username])[0];
  if (!row) return { success: false, message: '用户名或密码错误' };
  const bcrypt = require('bcryptjs');
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return { success: false, message: '用户名或密码错误' };
  return { success: true };
});

ipcMain.handle('auth:changePassword', async (event, username, oldPwd, newPwd) => {
  const db = getDatabase();
  const row = queryAll(db, 'SELECT * FROM users WHERE username = ?', [username])[0];
  if (!row) return { success: false, message: '用户不存在' };
  const bcrypt = require('bcryptjs');
  const ok = bcrypt.compareSync(oldPwd, row.password_hash);
  if (!ok) return { success: false, message: '原密码输入错误' };
  const hash = bcrypt.hashSync(newPwd, 10);
  runStmt(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.id]);
  saveDatabase();
  return { success: true };
});
