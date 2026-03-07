function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function cjsDefault(mod) {
  return mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
}

function runCase({ mode, Database, fs, os, path }) {
  const file = path.join(
    os.tmpdir(),
    `equipment-db-verify-${mode}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.sqlite`,
  );

  const db = new Database(file);
  if (mode === 'integer') {
    db.exec(
      `CREATE TABLE borrow_records (id INTEGER PRIMARY KEY AUTOINCREMENT, actual_return_time INTEGER);`,
    );
    db.prepare(`INSERT INTO borrow_records(actual_return_time) VALUES (?)`).run(
      Date.now(),
    );
  } else {
    db.exec(
      `CREATE TABLE borrow_records (id INTEGER PRIMARY KEY AUTOINCREMENT, actual_return_time TEXT);`,
    );
    db.prepare(`INSERT INTO borrow_records(actual_return_time) VALUES (?)`).run(
      new Date().toISOString(),
    );
  }
  db.close();

  const reopened = new Database(file);
  const row = reopened
    .prepare(
      'SELECT actual_return_time AS v FROM borrow_records WHERE actual_return_time IS NOT NULL LIMIT 1',
    )
    .get();
  assert(row && row.v != null, `${mode}: inserted row not found after reopen`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoff =
    typeof row.v === 'number' ? cutoffDate.getTime() : cutoffDate.toISOString();

  const before = reopened
    .prepare('SELECT COUNT(1) AS c FROM borrow_records')
    .get().c;
  reopened
    .prepare(
      'DELETE FROM borrow_records WHERE actual_return_time IS NOT NULL AND actual_return_time < ?',
    )
    .run(cutoff);
  const after = reopened
    .prepare('SELECT COUNT(1) AS c FROM borrow_records')
    .get().c;
  assert(before === after, `${mode}: cleanup deleted recent row unexpectedly`);

  reopened.close();
  try {
    fs.unlinkSync(file);
  } catch (err) {
    void err;
  }
}

async function main() {
  const Database = cjsDefault(await import('better-sqlite3'));
  const fs = cjsDefault(await import('node:fs'));
  const os = cjsDefault(await import('node:os'));
  const path = cjsDefault(await import('node:path'));

  runCase({ mode: 'integer', Database, fs, os, path });
  runCase({ mode: 'text', Database, fs, os, path });
}

main()
  .then(() => {
    console.log('OK');
  })
  .catch((err) => {
    process.stderr.write(
      `${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
