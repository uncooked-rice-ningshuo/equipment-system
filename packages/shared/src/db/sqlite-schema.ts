/**
 * SQLite 数据库 Schema (用于 Electron)
 * 保持与 PostgreSQL schema 结构一致
 */

import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ==================== 设备表 ====================
export const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull().default(''),
  brand: text('brand').default(''),
  model: text('model').default(''),
  price: real('price').default(0),
  location: text('location').default(''),
  status: text('status').notNull().default('available'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 借还记录表 ====================
export const borrowRecords = sqliteTable('borrow_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: integer('device_id')
    .notNull()
    .references(() => devices.id),
  deviceCode: text('device_code').notNull(),
  deviceName: text('device_name').notNull(),
  borrowerName: text('borrower_name').notNull(),
  borrowerClass: text('borrower_class').default(''),
  borrowerStudentId: text('borrower_student_id').default(''),
  borrowerPhone: text('borrower_phone').default(''),
  borrowTime: integer('borrow_time', { mode: 'timestamp' }).notNull(),
  returnDeadline: integer('return_deadline', { mode: 'timestamp' }).notNull(),
  actualReturnTime: integer('actual_return_time', { mode: 'timestamp' }),
  notified: integer('notified', { mode: 'boolean' }).default(false),
  notifyTime: integer('notify_time', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 用户表 ====================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').default(''),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 会话表 ====================
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 类型导出 ====================
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

export type BorrowRecord = typeof borrowRecords.$inferSelect;
export type NewBorrowRecord = typeof borrowRecords.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
