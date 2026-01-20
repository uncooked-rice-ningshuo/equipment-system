const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function migrateDatabase(oldDbPath, newDbPath) {
  console.log('Starting database migration...');

  // 备份旧数据库
  const backupPath = oldDbPath + '.backup';
  fs.copyFileSync(oldDbPath, backupPath);
  console.log('✅ Backup created:', backupPath);

  // 打开旧数据库
  const oldDb = new Database(oldDbPath, { readonly: true });

  // 检查旧数据库 schema 版本
  const oldSchema = oldDb.pragma('table_info(devices)');
  const hasUpdatedAt = oldSchema.some((col) => col.name === 'updated_at');

  if (hasUpdatedAt) {
    console.log('ℹ️  Database is already at latest version');
    oldDb.close();
    return;
  }

  console.log('📦 Migration: v1.0 -> v2.0');

  // 创建新数据库
  const newDb = new Database(newDbPath);
  newDb.pragma('journal_mode = WAL');

  // 创建新 schema
  newDb.exec(`
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      price REAL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance', 'retired')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      device_code TEXT NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      device_brand TEXT,
      borrower_name TEXT NOT NULL,
      borrower_class TEXT NOT NULL,
      borrower_student_id TEXT NOT NULL,
      borrower_phone TEXT NOT NULL,
      borrow_time DATETIME NOT NULL,
      return_deadline DATETIME NOT NULL,
      actual_return_time DATETIME,
      notified INTEGER DEFAULT 0 CHECK (notified IN (0, 1)),
      notify_time DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE RESTRICT,
      CHECK (borrow_time < return_deadline),
      CHECK (actual_return_time IS NULL OR actual_return_time >= borrow_time)
    );

    CREATE INDEX idx_devices_code ON devices(code);
    CREATE INDEX idx_devices_status ON devices(status);
    CREATE INDEX idx_devices_type ON devices(type);
    CREATE INDEX idx_devices_brand ON devices(brand, type);
    CREATE INDEX idx_borrow_device ON borrow_records(device_id);
    CREATE INDEX idx_borrow_time ON borrow_records(borrow_time);
    CREATE INDEX idx_borrow_deadline ON borrow_records(return_deadline);
    CREATE INDEX idx_borrow_returned ON borrow_records(actual_return_time);
    CREATE INDEX idx_borrow_borrower ON borrow_records(borrower_name, borrower_student_id);
    CREATE INDEX idx_borrow_device_code ON borrow_records(device_code);

    CREATE TRIGGER update_devices
    AFTER UPDATE ON devices
    FOR EACH ROW
    BEGIN
      UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // 迁移 devices 表数据
  const oldDevices = oldDb.prepare('SELECT * FROM devices').all();
  console.log(`📊 Migrating ${oldDevices.length} devices...`);

  const insertDevice = newDb.prepare(`
    INSERT INTO devices (id, code, name, type, brand, model, price, location, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  newDb.transaction(() => {
    for (const device of oldDevices) {
      insertDevice.run(
        device.id,
        device.code,
        device.name,
        device.type || '未分类',
        device.brand,
        device.model,
        device.price,
        device.location,
        device.status || 'available',
        device.created_at,
        device.created_at,
      );
    }
  })();

  console.log('✅ Devices migrated successfully');

  // 迁移 borrow_records 表数据
  const oldBorrowRecords = oldDb.prepare('SELECT * FROM borrow_records').all();
  console.log(`📊 Migrating ${oldBorrowRecords.length} borrow records...`);

  const insertBorrowRecord = newDb.prepare(`
    INSERT INTO borrow_records (
      id, device_id, device_code, device_name, device_type, device_brand,
      borrower_name, borrower_class, borrower_student_id, borrower_phone,
      borrow_time, return_deadline, actual_return_time, notified, notify_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  newDb.transaction(() => {
    for (const record of oldBorrowRecords) {
      const device = oldDb
        .prepare('SELECT * FROM devices WHERE id = ?')
        .get(record.device_id);

      insertBorrowRecord.run(
        record.id,
        record.device_id,
        device?.code || '',
        device?.name || '',
        device?.type || '未分类',
        device?.brand,
        record.borrower_name,
        record.borrower_class,
        record.borrower_student_id,
        record.borrower_phone,
        record.borrow_time,
        record.return_deadline,
        record.actual_return_time,
        record.notified,
        record.notify_time,
      );
    }
  })();

  console.log('✅ Borrow records migrated successfully');

  oldDb.close();
  newDb.close();

  console.log('🎉 Migration completed successfully!');
  console.log(`📁 Old database: ${oldDbPath}`);
  console.log(`📁 New database: ${newDbPath}`);
  console.log(`💾 Backup: ${backupPath}`);
}

if (require.main === module) {
  const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
  migrateDatabase(dbPath, dbPath + '.new');
}

module.exports = { migrateDatabase };
