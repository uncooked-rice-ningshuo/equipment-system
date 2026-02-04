const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const { getAuth, createDefaultUser } = require('./services/auth');
const {
  initDatabase,
  getDatabase,
  saveDatabase,
  queryAll,
  runStmt,
} = require('./services/database');
const { startServer } = require('./server');
const apiHandlers = require('./services/apiHandlers');

const handleSecured = async (channel, callback) => {
  ipcMain.handle(channel, async (event, ...args) => {
    const token = args.pop();

    const db = getDatabase();
    const now = new Date().toISOString();

    let session = null;
    try {
      session = db
        .prepare(
          'SELECT s.*, u.* FROM session s JOIN user u ON s.userId = u.id WHERE s.token = ? AND s.expiresAt > ?',
        )
        .get(token, now);
    } catch (e) {
      console.error('Session query failed:', e);
    }

    if (!session) {
      return { success: false, message: '未授权或会话已过期，请重新登录' };
    }

    event.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      username: session.username,
    };

    return callback(event, ...args);
  });
};

// ... (rest of the file)

let mainWindow;

function startCleanupTask() {
  const interval = process.env.CLEANUP_INTERVAL || 86400000;
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

  cleanup();

  setInterval(cleanup, interval);
  console.log(
    `Cleanup task scheduled to run every ${interval / 3600000} hours`,
  );
}

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

  const apiPort = process.env.API_PORT || 3001;
  const apiHost = process.env.API_HOST || '127.0.0.1';
  await startServer(apiPort, apiHost);

  startCleanupTask();

  createWindow();
});

app.on('before-quit', () => {
  saveDatabase();
});

// 设备管理 API
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

// 借还记录 API
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

// 统计数据 API
handleSecured('stats:dashboard', async () => {
  return apiHandlers.statsDashboard();
});

handleSecured('stats:deviceTypeDistribution', async () => {
  return apiHandlers.statsDeviceTypeDistribution();
});

handleSecured('stats:borrowedByType', async (event, period = 'week') => {
  return apiHandlers.statsBorrowedByType(period);
});

// 认证 API（better-auth）
ipcMain.handle('auth:login', async (event, username, password) => {
  const { getAuth } = require('./services/auth');
  const auth = await getAuth();

  try {
    let email = username;
    // Fallback: if username is "admin" (not email), map it to default admin email
    if (username === 'admin') {
      email = 'admin@example.com';
    }

    // Sign in using better-auth
    const session = await auth.api.signInEmail({
      body: {
        email: email,
        password,
      },
    });

    // session object structure might vary depending on better-auth version/context
    // Observed structure: { token: "...", user: { ... }, redirect: false }
    if (session) {
      if (session.token) {
        return { success: true, token: session.token };
      }
      if (session.session && session.session.token) {
        return { success: true, token: session.session.token };
      }
    }
    return { success: false, message: '登录失败: 未获取到会话令牌' };
  } catch (error) {
    console.error('Login error:', error);
    // If user not found, better-auth throws or returns error
    // For backward compatibility during migration, we might want to check the old 'users' table
    // and migrate the user to better-auth tables on the fly?

    // For now, let's assume we are doing a fresh start or manual migration.
    // If the user wants to keep existing users, we need a migration script.
    return { success: false, message: error.message || '用户名或密码错误' };
  }
});

handleSecured(
  'auth:changePassword',
  async (event, username, oldPwd, newPwd) => {
    return apiHandlers.authChangePassword(username, oldPwd, newPwd);
  },
);
