const { getDatabase, getDbPath } = require('./database');
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

// Better-auth requires a database adapter.
// We'll create a simple adapter that uses our existing better-sqlite3 instance
// Or use the official better-auth sqlite adapter if available/compatible.
// Since we are in Electron main process, we can initialize it here.

// NOTE: better-auth is primarily designed for web servers (Next.js, etc.).
// Using it in Electron requires some adaptation, especially for the 'session' and 'request' handling.
// However, better-auth v1+ has a core that is framework agnostic.

// We need to define the schema for better-auth tables
// better-auth will handle migrations/table creation if we use its CLI or runtime methods properly.
// But here we are manually integrating.

let auth = null;

async function initAuth() {
  const { betterAuth } = await import('better-auth');
  const { username } = await import('better-auth/plugins');

  // Initialize better-auth
  auth = betterAuth({
    database: new Database(getDbPath()),
    plugins: [username()],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      maxPasswordLength: 32,
    },
    emailVerification: {
      enabled: false,
    },
    baseURL: 'http://localhost:3001',
    trustedOrigins: ['app://equipment-system', 'http://localhost:3001'],
    session: {
      expiresIn: 30 * 24 * 60 * 60, // 30 天 (seconds, not ms)
      updateAge: 24 * 60 * 60, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    logger: {
      level: 'debug',
    },
  });

  // Force migration/table creation on startup?
  // better-auth usually handles this if we use its migration tools.
  // But here we are using it programmatically.
  // We can try to sign in or access internal API to trigger table creation if it's lazy?
  // Or we define tables manually.

  // Let's manually create better-auth tables for better-sqlite3 to be safe
  // schema reference: https://better-auth.com/docs/concepts/database#schema
  const db = getDatabase();

  // Drop tables if they are missing columns (simple migration for dev)
  // In production, we should use proper migrations (ALTER TABLE ...)
  // Since we just added displayUsername, and we are in dev/setup phase, let's try to add column if missing or recreate.

  try {
    const userInfo = db.prepare('PRAGMA table_info(user)').all();

    if (userInfo.length > 0) {
      // Check and add displayUsername
      const hasDisplayUsername = userInfo.some(
        (col) => col.name === 'displayUsername',
      );
      if (!hasDisplayUsername) {
        console.log('Migrating user table: adding displayUsername column');
        try {
          db.prepare('ALTER TABLE user ADD COLUMN displayUsername TEXT').run();
        } catch (e) {
          console.error('Migration displayUsername failed:', e.message);
        }
      }

      // Check and add username
      const hasUsername = userInfo.some((col) => col.name === 'username');
      if (!hasUsername) {
        console.log('Migrating user table: adding username column');
        try {
          db.prepare('ALTER TABLE user ADD COLUMN username TEXT').run();
          // Try to add unique index
          db.prepare(
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON user(username)',
          ).run();
        } catch (e) {
          console.error('Migration username failed:', e.message);
        }
      }

      // Check and add emailVerified
      const hasEmailVerified = userInfo.some(
        (col) => col.name === 'emailVerified',
      );
      if (!hasEmailVerified) {
        console.log('Migrating user table: adding emailVerified column');
        try {
          db.prepare(
            'ALTER TABLE user ADD COLUMN emailVerified INTEGER DEFAULT 0',
          ).run();
        } catch (e) {
          console.error('Migration emailVerified failed:', e.message);
        }
      }
    }
  } catch (e) {
    console.error('Migration check failed:', e);
  }

  db.exec(`
     CREATE TABLE IF NOT EXISTS user (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT NOT NULL UNIQUE,
       emailVerified INTEGER NOT NULL,
       image TEXT,
       createdAt DATETIME NOT NULL,
       updatedAt DATETIME NOT NULL,
       username TEXT UNIQUE,
       displayUsername TEXT
     );
     CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt DATETIME NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id)
    );
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id),
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt DATETIME,
      refreshTokenExpiresAt DATETIME,
      scope TEXT,
      password TEXT,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME,
      updatedAt DATETIME
    );
  `);

  return auth;
}

async function createDefaultUser() {
  const auth = await getAuth();
  // Check if admin exists
  // We can't query auth tables easily without using internal API or raw SQL
  // Let's use raw SQL for check, it's faster and we have the db instance
  const db = getDatabase();

  // Table name is usually 'user' in better-auth
  try {
    const admin = db
      .prepare('SELECT * FROM user WHERE email = ?')
      .get('admin@example.com');

    if (!admin) {
      console.log('Creating default admin user...');
      await auth.api.signUpEmail({
        body: {
          email: 'admin@example.com',
          password: 'admin123',
          name: 'Admin',
          username: 'admin', // requires username plugin
        },
      });
      console.log('Default admin user created: admin@example.com / admin123');
    }
  } catch (e) {
    console.error('Failed to create default user:', e);
  }
}

async function getAuth() {
  if (!auth) {
    return await initAuth();
  }
  return auth;
}

module.exports = {
  initAuth,
  getAuth,
  createDefaultUser,
};
