const { sqliteTable, text, integer, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Devices table
const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  brand: text('brand'),
  model: text('model'),
  price: real('price'),
  location: text('location'),
  status: text('status').notNull().default('available'),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// Borrow Records table
const borrowRecords = sqliteTable('borrow_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  device_id: integer('device_id')
    .notNull()
    .references(() => devices.id, { onDelete: 'restrict' }),
  device_code: text('device_code').notNull(),
  device_name: text('device_name').notNull(),
  device_type: text('device_type').notNull(),
  device_brand: text('device_brand'),
  borrower_name: text('borrower_name').notNull(),
  borrower_class: text('borrower_class').notNull(),
  borrower_student_id: text('borrower_student_id').notNull(),
  borrower_phone: text('borrower_phone').notNull(),
  borrow_time: integer('borrow_time', { mode: 'timestamp' }).notNull(),
  return_deadline: integer('return_deadline', { mode: 'timestamp' }).notNull(),
  actual_return_time: integer('actual_return_time', { mode: 'timestamp' }),
  notified: integer('notified', { mode: 'boolean' }).default(false),
  notify_time: integer('notify_time', { mode: 'timestamp' }),
});

// Users table (for Electron local auth)
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').default('user'),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

module.exports = {
  devices,
  borrowRecords,
  users,
};
