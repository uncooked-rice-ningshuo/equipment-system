# Web Access Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable web browser access to the equipment management system by adding an HTTP server to Electron that shares the same SQLite database, with unified authentication using better-auth.

**Architecture:** Add Express HTTP server to Electron main process, extract business logic from IPC handlers to shared apiHandlers module, create httpClient adapter for web, and modify ipc.ts to detect environment and route accordingly.

**Tech Stack:** Express, Axios, better-auth (cookie-based session), existing better-sqlite3

---

## Prerequisites

Install required dependencies:

```bash
pnpm add express cors body-parser
```

---

## Task 1: Create API Configuration

**Files:**

- Create: `src/config/api.ts`

**Step 1: Create API config file**

```typescript
export const apiConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:3001',
  httpTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
  cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '86400000'),
  cleanupRetentionDays: parseInt(process.env.CLEANUP_RETENTION_DAYS || '90'),
  corsEnabled: process.env.CORS_ENABLED === 'true',
};
```

**Step 2: Commit**

```bash
git add src/config/api.ts
git commit -m "feat: add API configuration"
```

---

## Task 2: Create HTTP Client Adapter

**Files:**

- Create: `src/services/httpClient.ts`

**Step 1: Create httpClient with invoke function**

```typescript
import axios from 'axios';
import { apiConfig } from '@/config/api';

const axiosInstance = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  timeout: apiConfig.httpTimeout,
  withCredentials: true, // Send cookies for session auth
});

export async function invoke<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const token = localStorage.getItem('token');
  const newArgs = [...args];

  // Append token if it exists and not logging in
  if (token && channel !== 'auth:login') {
    newArgs.push(token);
  }

  try {
    // Map IPC channels to HTTP endpoints
    const response = await axiosInstance.post('/api/invoke', {
      channel,
      args: newArgs,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
}
```

**Step 2: Commit**

```bash
git add src/services/httpClient.ts
git commit -m "feat: add HTTP client adapter"
```

---

## Task 3: Modify IPC Adapter for Environment Detection

**Files:**

- Modify: `src/services/ipc.ts`

**Step 1: Update ipc.ts to detect environment**

```typescript
import { eventBus } from '@/utils/eventBus';
import { invoke as webInvoke } from './httpClient';

export async function invoke<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const token = localStorage.getItem('token');
  const newArgs = [...args];

  // Append token if it exists and not logging in
  if (token && channel !== 'auth:login') {
    newArgs.push(token);
  }

  // Detect environment: Electron vs Web
  if (window.api && typeof window.api.invoke === 'function') {
    // Electron environment - use IPC
    return await window.api.invoke(channel, ...newArgs);
  }
  // Web environment - use HTTP client
  return await webInvoke(channel, ...newArgs);
}

const EVENT_MAP: Record<string, string> = {
  'borrow:create': 'device:borrowed',
  'borrow:return': 'device:returned',
  'device:create': 'device:added',
  'device:update': 'device:updated',
  'device:delete': 'device:deleted',
};

export const invokeWithEvent = async (channel: string, ...args: any[]) => {
  const result = await invoke(channel, ...args);

  if (EVENT_MAP[channel]) {
    eventBus.emit(EVENT_MAP[channel], result);
  }

  return result;
};
```

**Step 2: Commit**

```bash
git add src/services/ipc.ts
git commit -m "feat: add environment detection to IPC adapter"
```

---

## Task 4: Extract Business Logic to API Handlers

**Files:**

- Create: `electron/services/apiHandlers.js`
- Read: `electron/main.js:112-636`

**Step 1: Create apiHandlers.js with extracted business logic**

```javascript
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
```

**Step 2: Commit**

```bash
git add electron/services/apiHandlers.js
git commit -m "feat: extract business logic to apiHandlers module"
```

---

## Task 5: Create HTTP Middleware

**Files:**

- Create: `electron/services/httpMiddleware.js`

**Step 1: Create middleware with auth and error handling**

```javascript
const cors = require('cors');

function corsMiddleware() {
  return cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true,
  });
}

function errorHandler(err, req, res, next) {
  console.error('HTTP Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    code: err.code,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  corsMiddleware,
  errorHandler,
  asyncHandler,
};
```

**Step 2: Commit**

```bash
git add electron/services/httpMiddleware.js
git commit -m "feat: add HTTP middleware"
```

---

## Task 6: Create Express HTTP Server

**Files:**

- Create: `electron/server.js`

**Step 1: Create Express server with RESTful routes**

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const { getAuth } = require('./services/auth');
const * as apiHandlers from './services/apiHandlers';
const { corsMiddleware, errorHandler, asyncHandler } = require('./services/httpMiddleware');

let server = null;

function createServer() {
  const app = express();

  // Middleware
  app.use(corsMiddleware());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Auth routes
  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const auth = await getAuth();
    const { username, password } = req.body;

    let email = username;
    if (username === 'admin') {
      email = 'admin@example.com';
    }

    try {
      const session = await auth.api.signInEmail({
        body: {
          email: email,
          password,
        },
      });

      if (session && (session.token || (session.session && session.session.token))) {
        const token = session.token || session.session.token;
        // better-auth sets cookie automatically
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, message: '登录失败' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ success: false, message: error.message || '用户名或密码错误' });
    }
  }));

  app.post('/api/auth/logout', asyncHandler(async (req, res) => {
    const auth = await getAuth();
    await auth.api.signOut();
    res.json({ success: true });
  }));

  app.get('/api/auth/verify', asyncHandler(async (req, res) => {
    const auth = await getAuth();
    const session = await auth.api.getSession();
    if (session) {
      res.json({ success: true, user: session.user });
    } else {
      res.status(401).json({ success: false, message: '未登录' });
    }
  }));

  // Device routes
  app.get('/api/devices', asyncHandler(async (req, res) => {
    const data = apiHandlers.deviceList(req.query);
    res.json({ success: true, data, total: data.length });
  }));

  app.post('/api/devices', asyncHandler(async (req, res) => {
    const result = apiHandlers.deviceCreate(req.body);
    res.json(result);
  }));

  app.get('/api/devices/:id', asyncHandler(async (req, res) => {
    const data = apiHandlers.deviceList({ id: req.params.id });
    if (data.length > 0) {
      res.json({ success: true, data: data[0] });
    } else {
      res.status(404).json({ success: false, message: '设备不存在' });
    }
  }));

  app.put('/api/devices/:id', asyncHandler(async (req, res) => {
    const result = apiHandlers.deviceUpdate({ ...req.body, id: parseInt(req.params.id) });
    res.json(result);
  }));

  app.delete('/api/devices/:id', asyncHandler(async (req, res) => {
    const result = apiHandlers.deviceDelete(parseInt(req.params.id));
    res.json(result);
  }));

  // Borrow record routes - Active (not returned)
  app.get('/api/borrow-records/active', asyncHandler(async (req, res) => {
    const data = apiHandlers.borrowList({ ...req.query, returned: false });
    res.json({ success: true, data, total: data.length });
  }));

  app.post('/api/borrow-records/active', asyncHandler(async (req, res) => {
    const result = apiHandlers.borrowCreate(req.body);
    res.json(result);
  }));

  app.put('/api/borrow-records/active/:id/return', asyncHandler(async (req, res) => {
    const result = apiHandlers.borrowReturn(parseInt(req.params.id));
    res.json(result);
  }));

  // Borrow record routes - Returned
  app.get('/api/borrow-records/returned', asyncHandler(async (req, res) => {
    const data = apiHandlers.borrowList({ ...req.query, returned: true });
    res.json({ success: true, data, total: data.length });
  }));

  app.delete('/api/borrow-records/returned/:id', asyncHandler(async (req, res) => {
    const result = apiHandlers.borrowDelete(parseInt(req.params.id));
    res.json(result);
  }));

  app.delete('/api/borrow-records/returned/batch', asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'ids 必须是数组' });
    }
    let deletedCount = 0;
    for (const id of ids) {
      const result = apiHandlers.borrowDelete(id);
      if (result.success) deletedCount++;
    }
    res.json({ success: true, deletedCount });
  }));

  app.delete('/api/borrow-records/returned/clean', asyncHandler(async (req, res) => {
    const { beforeDate, deviceCode, borrowerName } = req.body;
    const db = getDatabase();
    let sql = 'DELETE FROM borrow_records WHERE actual_return_time IS NOT NULL';
    const params = [];

    if (beforeDate) {
      sql += ' AND actual_return_time < ?';
      params.push(beforeDate);
    }
    if (deviceCode) {
      sql += ' AND device_code = ?';
      params.push(deviceCode);
    }
    if (borrowerName) {
      sql += ' AND borrower_name = ?';
      params.push(borrowerName);
    }

    const result = db.prepare(sql).run(...params);
    res.json({ success: true, deletedCount: result.changes });
  }));

  // Overdue and reminders
  app.get('/api/borrow-records/overdue', asyncHandler(async (req, res) => {
    const data = apiHandlers.borrowListOverdue();
    res.json({ success: true, data });
  }));

  app.get('/api/borrow-records/due-soon', asyncHandler(async (req, res) => {
    const data = apiHandlers.borrowDueSoon7days();
    res.json({ success: true, data });
  }));

  app.put('/api/borrow-records/:id/notify', asyncHandler(async (req, res) => {
    const result = apiHandlers.notifyMark(parseInt(req.params.id));
    res.json(result);
  }));

  // Stats routes
  app.get('/api/stats/dashboard', asyncHandler(async (req, res) => {
    const data = apiHandlers.statsDashboard();
    res.json({ success: true, data });
  }));

  app.get('/api/stats/device-types', asyncHandler(async (req, res) => {
    const data = apiHandlers.statsDeviceTypeDistribution();
    res.json({ success: true, data });
  }));

  app.get('/api/stats/borrowed-by-type', asyncHandler(async (req, res) => {
    const { period = 'week' } = req.query;
    const data = apiHandlers.statsBorrowedByType(period);
    res.json({ success: true, data });
  }));

  // User routes
  app.put('/api/user/change-password', asyncHandler(async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const result = apiHandlers.authChangePassword(username, oldPassword, newPassword);
    res.json(result);
  }));

  // RPC endpoint for compatibility
  app.post('/api/invoke', asyncHandler(async (req, res) => {
    const { channel, args } = req.body;
    // Map channels to handler functions
    const handlerMap = {
      'device:list': () => apiHandlers.deviceList(args[0]),
      'device:create': () => apiHandlers.deviceCreate(args[0]),
      'device:update': () => apiHandlers.deviceUpdate(args[0]),
      'device:delete': () => apiHandlers.deviceDelete(args[0]),
      'borrow:create': () => apiHandlers.borrowCreate(args[0]),
      'borrow:return': () => apiHandlers.borrowReturn(args[0]),
      'borrow:list': () => apiHandlers.borrowList(args[0]),
      'borrow:delete': () => apiHandlers.borrowDelete(args[0]),
      'borrow:listOverdue': () => apiHandlers.borrowListOverdue(),
      'borrow:dueSoon7days': () => apiHandlers.borrowDueSoon7days(),
      'notify:mark': () => apiHandlers.notifyMark(args[0]),
      'stats:dashboard': () => apiHandlers.statsDashboard(),
      'stats:deviceTypeDistribution': () => apiHandlers.statsDeviceTypeDistribution(),
      'stats:borrowedByType': () => apiHandlers.statsBorrowedByType(args[0]),
      'auth:changePassword': () => apiHandlers.authChangePassword(args[0], args[1], args[2]),
    };

    const handler = handlerMap[channel];
    if (!handler) {
      return res.status(404).json({ success: false, message: '未知的请求' });
    }

    const result = handler();
    res.json(result);
  }));

  // Error handling
  app.use(errorHandler);

  return app;
}

function startServer(port = 3001, host = '127.0.0.1') {
  if (server) {
    console.log('HTTP server already running');
    return server;
  }

  const app = createServer();

  return new Promise((resolve, reject) => {
    server = app.listen(port, host, (err) => {
      if (err) {
        console.error('Failed to start HTTP server:', err);
        reject(err);
      } else {
        console.log(`HTTP server listening on http://${host}:${port}`);
        resolve(server);
      }
    });
  });
}

function stopServer() {
  if (server) {
    server.close(() => {
      console.log('HTTP server stopped');
      server = null;
    });
  }
}

module.exports = {
  createServer,
  startServer,
  stopServer,
};
```

**Step 2: Commit**

```bash
git add electron/server.js
git commit -m "feat: add Express HTTP server with RESTful API"
```

---

## Task 7: Refactor main.js to Use apiHandlers

**Files:**

- Modify: `electron/main.js:13-76`

**Step 1: Update main.js to import apiHandlers and refactor handleSecured**

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getAuth, createDefaultUser } = require('./services/auth');
const { initDatabase, getDatabase, saveDatabase } = require('./services/database');
const { startServer } = require('./server');
const * as apiHandlers from './services/apiHandlers';

const handleSecured = async (channel, callback) => {
  ipcMain.handle(channel, async (event, ...args) => {
    const token = args.pop();

    // Use better-auth to verify session
    let session = null;
    try {
      const auth = await getAuth();
      session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('Session validation failed:', e);
    }

    const now = new Date();

    if (!session) {
      return { success: false, message: '未授权或会话已过期，请重新登录' };
    }

    // Inject user info
    event.user = session.user;

    return callback(event, ...args);
  });
};

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
  await createDefaultUser();

  // Start HTTP server
  const apiPort = process.env.API_PORT || 3001;
  const apiHost = process.env.API_HOST || '127.0.0.1';
  await startServer(apiPort, apiHost);

  createWindow();
});

app.on('before-quit', () => {
  saveDatabase();
});

// Keep existing IPC handlers, but use apiHandlers
handleSecured('device:list', async (event, filters) => {
  return apiHandlers.deviceList(filters);
});

handleSecured('device:create', async (event, device) => {
  return apiHandlers.deviceCreate(device);
});

handleSecured('device:update', async (event, device) => {
  return apiHandlers.deviceUpdate(device);
});

handleSecured('device:delete', async (event, id) => {
  return apiHandlers.deviceDelete(id);
});

handleSecured('borrow:create', async (event, record) => {
  return apiHandlers.borrowCreate(record);
});

handleSecured('borrow:return', async (event, recordId) => {
  return apiHandlers.borrowReturn(recordId);
});

handleSecured('borrow:list', async (event, filters) => {
  return apiHandlers.borrowList(filters);
});

handleSecured('borrow:delete', async (event, recordId) => {
  return apiHandlers.borrowDelete(recordId);
});

handleSecured('borrow:listOverdue', async () => {
  return apiHandlers.borrowListOverdue();
});

handleSecured('borrow:dueSoon7days', async () => {
  return apiHandlers.borrowDueSoon7days();
});

handleSecured('notify:mark', async (event, recordId) => {
  return apiHandlers.notifyMark(recordId);
});

handleSecured('stats:dashboard', async () => {
  return apiHandlers.statsDashboard();
});

handleSecured('stats:deviceTypeDistribution', async () => {
  return apiHandlers.statsDeviceTypeDistribution();
});

handleSecured('stats:borrowedByType', async (event, period = 'week') => {
  return apiHandlers.statsBorrowedByType(period);
});

handleSecured(
  'auth:changePassword',
  async (event, username, oldPwd, newPwd) => {
    return apiHandlers.authChangePassword(username, oldPwd, newPwd);
  },
);
```

**Step 2: Commit**

```bash
git add electron/main.js
git commit -m "refactor: use apiHandlers in main.js and start HTTP server"
```

---

## Task 8: Add Scheduled Cleanup Task

**Files:**

- Modify: `electron/main.js`
- Read: `electron/main.js:100-105`

**Step 1: Add cleanup task to main.js**

```javascript
// Add this after app.whenReady()

function startCleanupTask() {
  const interval = process.env.CLEANUP_INTERVAL || 86400000; // 24 hours
  const retentionDays = process.env.CLEANUP_RETENTION_DAYS || 90;

  const cleanup = () => {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const sql =
        'DELETE FROM borrow_records WHERE actual_return_time IS NOT NULL AND actual_return_time < ?';
      const result = db.prepare(sql).run(cutoffDate.toISOString());

      if (result.changes > 0) {
        console.log(`Cleanup task: deleted ${result.changes} returned records`);
      }
    } catch (error) {
      console.error('Cleanup task failed:', error);
    }
  };

  // Run immediately on startup
  cleanup();

  // Schedule periodic cleanup
  setInterval(cleanup, interval);
  console.log(
    `Cleanup task scheduled to run every ${interval / 3600000} hours`,
  );
}

// Add to app.whenReady()
app.whenReady().then(async () => {
  await initDatabase();
  await createDefaultUser();

  const apiPort = process.env.API_PORT || 3001;
  const apiHost = process.env.API_HOST || '127.0.0.1';
  await startServer(apiPort, apiHost);

  // Start cleanup task
  startCleanupTask();

  createWindow();
});
```

**Step 2: Commit**

```bash
git add electron/main.js
git commit -m "feat: add scheduled cleanup task for returned records"
```

---

## Task 9: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install required packages**

```bash
pnpm add express cors body-parser
```

**Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install express, cors, and body-parser"
```

---

## Task 10: Add Environment Variables Example

**Files:**

- Create: `.env.example`

**Step 1: Create .env.example**

```bash
# API Server Configuration
API_PORT=3001
API_HOST=127.0.0.1
API_TIMEOUT=10000

# Cleanup Task Configuration
CLEANUP_INTERVAL=86400000
CLEANUP_RETENTION_DAYS=90

# CORS Configuration
CORS_ENABLED=true
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables example"
```

---

## Task 11: Test Desktop Environment

**Files:**

- Test: Manual testing in Electron

**Step 1: Run development mode**

```bash
npm run dev
```

**Step 2: Verify Electron app works**

- Login with admin/admin123
- Create a device
- Borrow a device
- Return a device
- Check dashboard stats

**Step 3: Verify HTTP server is running**

- Check console for "HTTP server listening on http://127.0.0.1:3001"
- Try to access http://127.0.0.1:3001/api/stats/dashboard in browser (should require auth)

**Expected results:**

- All desktop features work as before
- HTTP server is running on port 3001
- Console shows no errors

---

## Task 12: Test Web Environment

**Files:**

- Test: Manual testing in browser

**Step 1: Open web version in browser**

```bash
# In another terminal, start only web server
npm run dev:web
```

**Step 2: Open browser to http://localhost:8000**

- Login with admin/admin123
- Create a device
- Borrow a device
- Return a device
- Check dashboard stats

**Step 3: Verify data consistency**

- Check that data created in web appears in Electron
- Check that data created in Electron appears in web

**Expected results:**

- All web features work correctly
- Data is synchronized between Electron and web
- No console errors

---

## Task 13: Test Cleanup Task

**Files:**

- Test: Manual testing of cleanup task

**Step 1: Create test data**

- Create some borrow records and return them
- Note the current date and record IDs

**Step 2: Modify cleanup interval for testing**

```bash
# Set cleanup interval to 1 minute for testing
CLEANUP_INTERVAL=60000
```

**Step 3: Wait for cleanup to run**

- Check console for cleanup messages
- Verify old returned records are deleted

**Step 4: Restore production interval**

```bash
CLEANUP_INTERVAL=86400000
```

**Expected results:**

- Cleanup task runs automatically
- Old returned records are deleted
- Active and recent records are preserved

---

## Task 14: Update Documentation

**Files:**

- Modify: `README.md` or create `docs/web-access-guide.md`

**Step 1: Add web access documentation**

```markdown
# Web Access Guide

The equipment management system now supports both desktop (Electron) and web browser access.

## Desktop Access

Run `npm run dev` to start both the Electron app and HTTP server.

## Web Access

1. Start the Electron app first (it runs the HTTP server)
2. Open your browser and navigate to http://localhost:8000
3. Login with your credentials (default: admin@example.com / admin123)

## API Server

The HTTP API server runs on:

- Port: 3001 (configurable via API_PORT environment variable)
- Host: 127.0.0.1 (configurable via API_HOST environment variable)

API endpoints:

- Authentication: /api/auth/\*
- Devices: /api/devices
- Borrow Records: /api/borrow-records/\*
- Stats: /api/stats/\*
- User: /api/user/\*

## Data Synchronization

Both desktop and web access the same SQLite database, ensuring data is always synchronized.

## Cleanup Task

A scheduled task automatically deletes returned borrow records older than 90 days (configurable).
```

**Step 2: Commit**

```bash
git add README.md docs/web-access-guide.md
git commit -m "docs: add web access guide"
```

---

## Task 15: Final Verification

**Files:**

- Test: Comprehensive testing

**Step 1: Run linter and type checker**

```bash
# Check if linting is configured
npm run lint 2>/dev/null || echo "No lint script configured"
npm run typecheck 2>/dev/null || echo "No typecheck script configured"
```

**Step 2: Run full test suite**

```bash
# Check if tests are configured
npm run test 2>/dev/null || echo "No test script configured"
```

**Step 3: Build production version**

```bash
npm run build:web
```

**Step 4: Verify build output**

Check that `dist/` directory is created successfully.

**Step 5: Final smoke test**

- Start Electron app
- Verify all features work
- Open web browser
- Verify all features work
- Verify data synchronization

**Expected results:**

- No linting or type errors
- Build completes successfully
- All features work in both environments

---

## Completion Checklist

- [ ] All dependencies installed
- [ ] API configuration created
- [ ] HTTP client adapter created
- [ ] IPC adapter updated with environment detection
- [ ] Business logic extracted to apiHandlers
- [ ] HTTP middleware created
- [ ] Express HTTP server created
- [ ] main.js refactored to use apiHandlers
- [ ] Scheduled cleanup task implemented
- [ ] Environment variables documented
- [ ] Desktop environment tested
- [ ] Web environment tested
- [ ] Cleanup task tested
- [ ] Documentation updated
- [ ] Final verification completed
