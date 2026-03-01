/**
 * Electron 主进程入口
 * 纯离线架构 - 无 HTTP 服务
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { closeDatabase, getDatabase, initDatabase } from './db/connection';
import { registerIpcHandlers } from './ipc';
import { registerAuthIpc } from './ipc/auth';

// 保持窗口对象的全局引用
let mainWindow: BrowserWindow | null = null;

/**
 * 创建主窗口
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '设备借还管理系统',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false, // 加载完成后显示
  });

  // 加载渲染进程
  // 开发环境使用 Vite dev server，生产环境使用打包后的文件
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 启动定期清理任务
 */
function startCleanupTask(): void {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
  const RETENTION_DAYS = 90;

  const cleanup = () => {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

      const result = db
        .prepare(
          'DELETE FROM borrow_records WHERE actual_return_time IS NOT NULL AND actual_return_time < ?',
        )
        .run(cutoffDate.toISOString());

      if (result.changes > 0) {
        console.log(`[Cleanup] Deleted ${result.changes} old records`);
      }
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  };

  // 立即执行一次，然后定时执行
  cleanup();
  setInterval(cleanup, CLEANUP_INTERVAL);

  console.log('[Cleanup] Task scheduled every 24 hours');
}

/**
 * 应用生命周期
 */
app.whenReady().then(() => {
  registerAuthIpc();

  // 初始化数据库
  initDatabase();

  // 注册 IPC handlers
  registerIpcHandlers();

  // 启动清理任务
  startCleanupTask();

  // 创建窗口
  createWindow();

  console.log('[App] Electron started in offline mode');
});

// macOS 重新激活时创建窗口
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

// 应用退出前关闭数据库
app.on('before-quit', () => {
  closeDatabase();
});

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});
