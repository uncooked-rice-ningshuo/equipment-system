const { queryAll, runStmt, getDatabase } = require('./database');
const dayjs = require('dayjs');

// Device handlers
function deviceList(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM devices WHERE 1=1';
  const params = [];
  if (filters?.code) {
    sql += ' AND code LIKE ?';
    params.push(`%${filters.code}%`);
  }
  if (filters?.name) {
    sql += ' AND name LIKE ?';
    params.push(`%${filters.name}%`);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters?.brand) {
    sql += ' AND brand LIKE ?';
    params.push(`%${filters.brand}%`);
  }
  const rows = queryAll(db, sql, params);
  return rows;
}

function deviceCreate(device) {
  const db = getDatabase();
  const { code, name, type, brand, model, price, location } = device;
  try {
    runStmt(
      db,
      'INSERT INTO devices (code, name, type, brand, model, price, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        code,
        name,
        type || '',
        brand || '',
        model || '',
        price || 0,
        location || '',
        'available',
      ],
    );
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deviceUpdate(device) {
  const db = getDatabase();
  const { id, code, name, type, brand, model, price, location, status } =
    device;
  try {
    runStmt(
      db,
      'UPDATE devices SET code=?, name=?, type=?, brand=?, model=?, price=?, location=?, status=? WHERE id=?',
      [
        code,
        name,
        type || '',
        brand || '',
        model || '',
        price || 0,
        location || '',
        status,
        id,
      ],
    );
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deviceDelete(id) {
  const db = getDatabase();
  const status = queryAll(db, 'SELECT status FROM devices WHERE id = ?', [
    id,
  ])[0]?.status;
  if (status === 'borrowed') {
    return { success: false, message: '设备已借出，无法删除' };
  }
  try {
    runStmt(db, 'DELETE FROM devices WHERE id = ?', [id]);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Borrow handlers
function borrowCreate(record) {
  const db = getDatabase();
  const {
    device_code,
    borrower_name,
    borrower_class,
    borrower_student_id,
    borrower_phone,
    borrow_time,
    return_deadline,
  } = record;
  try {
    const device = queryAll(db, 'SELECT * FROM devices WHERE code = ?', [
      device_code,
    ])[0];

    if (!device) {
      return { success: false, message: '设备不存在' };
    }

    if (device.status === 'borrowed') {
      return { success: false, message: '该设备当前不可借，请选择其他设备' };
    }

    runStmt(
      db,
      `INSERT INTO borrow_records
       (device_id, device_code, device_name, device_type, device_brand,
        borrower_name, borrower_class, borrower_student_id, borrower_phone,
        borrow_time, return_deadline, notified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        device.id,
        device.code,
        device.name,
        device.type,
        device.brand,
        borrower_name,
        borrower_class,
        borrower_student_id,
        borrower_phone,
        borrow_time,
        return_deadline,
      ],
    );

    runStmt(db, 'UPDATE devices SET status = ? WHERE code = ?', [
      'borrowed',
      device_code,
    ]);

    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function borrowReturn(recordId) {
  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    const record = queryAll(db, 'SELECT * FROM borrow_records WHERE id = ?', [
      recordId,
    ])[0];

    if (!record) {
      return { success: false, message: '借出记录不存在' };
    }

    const deviceId = record.device_id;
    runStmt(
      db,
      'UPDATE borrow_records SET actual_return_time = ? WHERE id = ?',
      [now, recordId],
    );

    if (deviceId) {
      runStmt(db, 'UPDATE devices SET status = ? WHERE id = ?', [
        'available',
        deviceId,
      ]);
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function borrowList(filters = {}) {
  const db = getDatabase();
  let sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
             FROM borrow_records br JOIN devices d ON d.id = br.device_id`;
  const params = [];

  if (filters?.returned === true) {
    sql += ' WHERE br.actual_return_time IS NOT NULL';
  } else {
    sql += ' WHERE br.actual_return_time IS NULL';
  }

  if (filters?.deviceCode) {
    sql += ' AND d.code LIKE ?';
    params.push(`%${filters.deviceCode}%`);
  }
  if (filters?.device_name) {
    sql += ' AND d.name LIKE ?';
    params.push(`%${filters.device_name}%`);
  }
  if (filters?.deviceName) {
    sql += ' AND d.name LIKE ?';
    params.push(`%${filters.deviceName}%`);
  }
  if (filters?.deviceType) {
    sql += ' AND d.type = ?';
    params.push(filters.deviceType);
  }
  if (filters?.borrowerName) {
    sql += ' AND br.borrower_name LIKE ?';
    params.push(`%${filters.borrowerName}%`);
  }
  if (filters?.borrowerClass) {
    sql += ' AND br.borrower_class LIKE ?';
    params.push(`%${filters.borrowerClass}%`);
  }
  if (filters?.borrower_student_id) {
    sql += ' AND br.borrower_student_id = ?';
    params.push(filters.borrower_student_id);
  }
  if (filters?.borrowTimeStart) {
    sql += ' AND br.borrow_time >= ?';
    params.push(filters.borrowTimeStart);
  }
  if (filters?.borrowTimeEnd) {
    sql += ' AND br.borrow_time <= ?';
    params.push(filters.borrowTimeEnd);
  }
  if (filters?.returnTimeStart) {
    sql += ' AND br.actual_return_time >= ?';
    params.push(filters.returnTimeStart);
  }
  if (filters?.returnTimeEnd) {
    sql += ' AND br.actual_return_time <= ?';
    params.push(filters.returnTimeEnd);
  }

  const rows = queryAll(db, sql, params);
  return rows;
}

function borrowDelete(recordId) {
  const db = getDatabase();
  try {
    runStmt(db, 'DELETE FROM borrow_records WHERE id = ?', [recordId]);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function borrowListOverdue() {
  const db = getDatabase();
  const sql = `SELECT br.*, d.code as device_code, d.name as device_name, d.brand as device_brand
               FROM borrow_records br JOIN devices d ON d.id = br.device_id
               WHERE br.actual_return_time IS NULL`;
  const rows = queryAll(db, sql, []);
  const now = dayjs();
  const overdue = [];
  const dueSoon = [];
  rows.forEach((r) => {
    const ddl = dayjs(r.return_deadline);
    const diff = ddl.diff(now, 'day');
    const item = { ...r, remaining_days: diff };
    if (diff < 0) overdue.push(item);
    else if (diff <= 5) dueSoon.push(item);
  });
  overdue.sort((a, b) => a.remaining_days - b.remaining_days);
  dueSoon.sort((a, b) => a.remaining_days - b.remaining_days);
  return { overdue, dueSoon };
}

function borrowDueSoon7days() {
  const db = getDatabase();
  const now = dayjs();
  const sevenDaysLater = now.add(7, 'day');

  const sql = `SELECT
    br.id,
    d.code as device_code,
    d.name as device_name,
    d.brand as device_brand,
    br.borrower_name,
    br.borrower_phone,
    br.return_deadline,
    br.borrow_time
  FROM borrow_records br
  JOIN devices d ON d.id = br.device_id
  WHERE br.actual_return_time IS NULL
    AND datetime(br.return_deadline) >= datetime('now')
    AND datetime(br.return_deadline) <= datetime(?)
  ORDER BY br.return_deadline ASC`;

  const rows = queryAll(db, sql, [sevenDaysLater.toISOString()]);

  const data = rows.map((r) => {
    const ddl = dayjs(r.return_deadline);
    const remainingDays = ddl.diff(now, 'day');
    return {
      ...r,
      remaining_days: remainingDays,
      deadline: ddl.format('YYYY-MM-DD HH:mm'),
    };
  });

  return data;
}

function notifyMark(recordId) {
  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    runStmt(
      db,
      'UPDATE borrow_records SET notified = 1, notify_time = ? WHERE id = ?',
      [now, recordId],
    );
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Stats handlers
function statsDashboard() {
  const db = getDatabase();
  const totalDevices =
    queryAll(db, 'SELECT COUNT(*) as c FROM devices')[0]?.c || 0;
  const borrowedDevices =
    queryAll(
      db,
      "SELECT COUNT(*) as c FROM devices WHERE status = 'borrowed'",
    )[0]?.c || 0;
  const overdueDevices =
    queryAll(
      db,
      `SELECT COUNT(*) as c FROM borrow_records
    WHERE actual_return_time IS NULL AND datetime(return_deadline) < datetime('now')`,
    )[0]?.c || 0;
  return {
    totalDevices,
    borrowedDevices,
    availableDevices: totalDevices - borrowedDevices,
    overdueDevices,
  };
}

function statsDeviceTypeDistribution() {
  const db = getDatabase();
  const rows = queryAll(
    db,
    'SELECT type, COUNT(*) as count FROM devices GROUP BY type ORDER BY count DESC',
  );
  return rows.map((r) => ({
    name: r.type || '未分类',
    value: r.count,
  }));
}

function statsBorrowedByType(period = 'week') {
  const db = getDatabase();
  let days;

  switch (period) {
    case 'week':
      days = 7;
      break;
    case 'month':
      days = 30;
      break;
    case 'year':
      days = 365;
      break;
    default:
      days = 7;
  }

  const startDate = dayjs().subtract(days, 'day');

  const rows = queryAll(
    db,
    `SELECT d.type, COUNT(*) as count
     FROM borrow_records br
     JOIN devices d ON d.id = br.device_id
     WHERE br.borrow_time >= ?
     GROUP BY d.type
     ORDER BY count DESC`,
    [startDate.toISOString()],
  );

  return rows.map((r) => ({
    name: r.type || '未分类',
    value: r.count,
  }));
}

// Auth handlers
function authChangePassword(username, oldPwd, newPwd) {
  const { getAuth } = require('./auth');

  let email = username;
  if (username === 'admin') {
    email = 'admin@example.com';
  }

  try {
    getAuth().api.signInEmail({
      body: {
        email,
        password: oldPwd,
      },
    });
  } catch (e) {
    return { success: false, message: '原密码输入错误' };
  }

  try {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM user WHERE email = ?').get(email);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const ctx = getAuth().$context;
    const hashed = ctx.password.hash(newPwd);
    const now = new Date().toISOString();

    const account = db
      .prepare('SELECT * FROM account WHERE userId = ? AND providerId = ?')
      .get(user.id, 'credential');

    if (account) {
      db.prepare(
        'UPDATE account SET password = ?, updatedAt = ? WHERE id = ?',
      ).run(hashed, now, account.id);
    } else {
      const id = ctx.utils.generateId();

      db.prepare(
        'INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(id, email, 'credential', user.id, hashed, now, now);
    }

    db.prepare('DELETE FROM session WHERE userId = ?').run(user.id);

    return { success: true };
  } catch (e) {
    return { success: false, message: '修改密码失败' };
  }
}

module.exports = {
  deviceList,
  deviceCreate,
  deviceUpdate,
  deviceDelete,
  borrowCreate,
  borrowReturn,
  borrowList,
  borrowDelete,
  borrowListOverdue,
  borrowDueSoon7days,
  notifyMark,
  statsDashboard,
  statsDeviceTypeDistribution,
  statsBorrowedByType,
  authChangePassword,
};
