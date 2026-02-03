export const apiConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:3001',
  httpTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
  cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '86400000'),
  cleanupRetentionDays: parseInt(process.env.CLEANUP_RETENTION_DAYS || '90'),
  corsEnabled: process.env.CORS_ENABLED === 'true',
};
