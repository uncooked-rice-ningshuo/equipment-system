const express = require('express');
const bodyParser = require('body-parser');
const { getAuth } = require('./services/auth');
const { getDatabase } = require('./services/database');
const apiHandlers = require('./services/apiHandlers');
const {
  corsMiddleware,
  errorHandler,
  asyncHandler,
} = require('./services/httpMiddleware');

let server = null;

function createServer() {
  const app = express();

  app.use(corsMiddleware());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post(
    '/api/auth/login',
    asyncHandler(async (req, res) => {
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

        if (
          session &&
          (session.token || (session.session && session.session.token))
        ) {
          const token = session.token || session.session.token;
          res.json({ success: true, token });
        } else {
          res.status(401).json({ success: false, message: '登录失败' });
        }
      } catch (error) {
        console.error('Login error:', error);
        res
          .status(401)
          .json({
            success: false,
            message: error.message || '用户名或密码错误',
          });
      }
    }),
  );

  app.post(
    '/api/auth/logout',
    asyncHandler(async (req, res) => {
      const auth = await getAuth();
      await auth.api.signOut();
      res.json({ success: true });
    }),
  );

  app.get(
    '/api/auth/verify',
    asyncHandler(async (req, res) => {
      const auth = await getAuth();
      const session = await auth.api.getSession();
      if (session) {
        res.json({ success: true, user: session.user });
      } else {
        res.status(401).json({ success: false, message: '未登录' });
      }
    }),
  );

  app.get(
    '/api/devices',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.deviceList(req.query);
      res.json({ success: true, data, total: data.length });
    }),
  );

  app.post(
    '/api/devices',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.deviceCreate(req.body);
      res.json(result);
    }),
  );

  app.get(
    '/api/devices/:id',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.deviceList({ id: req.params.id });
      if (data.length > 0) {
        res.json({ success: true, data: data[0] });
      } else {
        res.status(404).json({ success: false, message: '设备不存在' });
      }
    }),
  );

  app.put(
    '/api/devices/:id',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.deviceUpdate({
        ...req.body,
        id: parseInt(req.params.id),
      });
      res.json(result);
    }),
  );

  app.delete(
    '/api/devices/:id',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.deviceDelete(parseInt(req.params.id));
      res.json(result);
    }),
  );

  app.get(
    '/api/borrow-records/active',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.borrowList({ ...req.query, returned: false });
      res.json({ success: true, data, total: data.length });
    }),
  );

  app.post(
    '/api/borrow-records/active',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.borrowCreate(req.body);
      res.json(result);
    }),
  );

  app.put(
    '/api/borrow-records/active/:id/return',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.borrowReturn(parseInt(req.params.id));
      res.json(result);
    }),
  );

  app.get(
    '/api/borrow-records/returned',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.borrowList({ ...req.query, returned: true });
      res.json({ success: true, data, total: data.length });
    }),
  );

  app.delete(
    '/api/borrow-records/returned/:id',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.borrowDelete(parseInt(req.params.id));
      res.json(result);
    }),
  );

  app.delete(
    '/api/borrow-records/returned/batch',
    asyncHandler(async (req, res) => {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res
          .status(400)
          .json({ success: false, message: 'ids 必须是数组' });
      }
      let deletedCount = 0;
      for (const id of ids) {
        const result = apiHandlers.borrowDelete(id);
        if (result.success) deletedCount++;
      }
      res.json({ success: true, deletedCount });
    }),
  );

  app.delete(
    '/api/borrow-records/returned/clean',
    asyncHandler(async (req, res) => {
      const { beforeDate, deviceCode, borrowerName } = req.body;
      const db = getDatabase();
      let sql =
        'DELETE FROM borrow_records WHERE actual_return_time IS NOT NULL';
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
    }),
  );

  app.get(
    '/api/borrow-records/overdue',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.borrowListOverdue();
      res.json({ success: true, data });
    }),
  );

  app.get(
    '/api/borrow-records/due-soon',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.borrowDueSoon7days();
      res.json({ success: true, data });
    }),
  );

  app.put(
    '/api/borrow-records/:id/notify',
    asyncHandler(async (req, res) => {
      const result = apiHandlers.notifyMark(parseInt(req.params.id));
      res.json(result);
    }),
  );

  app.get(
    '/api/stats/dashboard',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.statsDashboard();
      res.json({ success: true, data });
    }),
  );

  app.get(
    '/api/stats/device-types',
    asyncHandler(async (req, res) => {
      const data = apiHandlers.statsDeviceTypeDistribution();
      res.json({ success: true, data });
    }),
  );

  app.get(
    '/api/stats/borrowed-by-type',
    asyncHandler(async (req, res) => {
      const { period = 'week' } = req.query;
      const data = apiHandlers.statsBorrowedByType(period);
      res.json({ success: true, data });
    }),
  );

  app.put(
    '/api/user/change-password',
    asyncHandler(async (req, res) => {
      const { username, oldPassword, newPassword } = req.body;
      const result = apiHandlers.authChangePassword(
        username,
        oldPassword,
        newPassword,
      );
      res.json(result);
    }),
  );

  app.post(
    '/api/invoke',
    asyncHandler(async (req, res) => {
      const { channel, args } = req.body;
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
        'stats:deviceTypeDistribution': () =>
          apiHandlers.statsDeviceTypeDistribution(),
        'stats:borrowedByType': () => apiHandlers.statsBorrowedByType(args[0]),
        'auth:changePassword': () =>
          apiHandlers.authChangePassword(args[0], args[1], args[2]),
      };

      const handler = handlerMap[channel];
      if (!handler) {
        return res.status(404).json({ success: false, message: '未知的请求' });
      }

      const result = handler();
      res.json(result);
    }),
  );

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
