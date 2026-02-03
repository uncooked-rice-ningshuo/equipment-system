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
