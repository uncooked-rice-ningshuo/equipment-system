/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseMode(argv) {
  if (argv.includes('--apply')) return 'apply';
  return 'dry-run';
}

function makeFallbackEmail(username) {
  const safe = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');
  return `${safe || 'unknown'}@local.auth`;
}

async function main() {
  loadDotEnv();
  const mode = parseMode(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(connectionString, { max: 1 });
  const summary = {
    mode,
    scanned: 0,
    insertedUsers: 0,
    insertedAccounts: 0,
    skippedExistingUsers: 0,
    skippedExistingAccounts: 0,
    conflicts: [],
  };

  try {
    const legacyUsers = await sql`
      SELECT id, username, password_hash, display_name, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `;

    summary.scanned = legacyUsers.length;

    for (const legacy of legacyUsers) {
      const username = legacy.username;
      const email = makeFallbackEmail(username);

      const existingByEmail = await sql`
        SELECT id, username, email FROM "user" WHERE email = ${email} LIMIT 1
      `;
      const existingByUsername = await sql`
        SELECT id, username, email FROM "user" WHERE username = ${username} LIMIT 1
      `;

      let authUserId = null;
      if (existingByEmail.length > 0 || existingByUsername.length > 0) {
        const existing = existingByEmail[0] || existingByUsername[0];
        authUserId = existing.id;

        if (existing.username && username && existing.username !== username) {
          summary.conflicts.push({
            type: 'username_mismatch',
            legacyUsername: username,
            existingUserId: existing.id,
            existingUsername: existing.username,
            existingEmail: existing.email,
          });
          continue;
        }

        summary.skippedExistingUsers += 1;
      } else if (mode === 'apply') {
        authUserId = crypto.randomUUID();
        const createdAt = legacy.created_at || new Date();
        const updatedAt = legacy.updated_at || createdAt;

        await sql`
          INSERT INTO "user" (
            id, name, email, "emailVerified", username, "createdAt", "updatedAt"
          ) VALUES (
            ${authUserId},
            ${legacy.display_name || username || 'User'},
            ${email},
            ${false},
            ${username},
            ${createdAt},
            ${updatedAt}
          )
        `;
        summary.insertedUsers += 1;
      }

      const accountId = email;
      const existingAccount = await sql`
        SELECT id FROM account
        WHERE "providerId" = 'credential' AND "accountId" = ${accountId}
        LIMIT 1
      `;

      if (existingAccount.length > 0) {
        summary.skippedExistingAccounts += 1;
        continue;
      }

      if (mode === 'apply') {
        if (!authUserId) {
          summary.conflicts.push({
            type: 'missing_auth_user',
            legacyUsername: username,
            accountId,
          });
          continue;
        }

        const now = new Date();
        await sql`
          INSERT INTO account (
            id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
          ) VALUES (
            ${crypto.randomUUID()},
            ${accountId},
            'credential',
            ${authUserId},
            ${legacy.password_hash},
            ${now},
            ${now}
          )
        `;
        summary.insertedAccounts += 1;
      }
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('auth migration failed:', error);
  process.exitCode = 1;
});
