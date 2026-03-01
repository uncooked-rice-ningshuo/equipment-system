/**
 * 共享数据库 Schema
 * 支持 PostgreSQL (Web) 和 SQLite (Electron)
 */

import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// ==================== 设备表 ====================
export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 100 }).notNull().default(''),
  brand: varchar('brand', { length: 100 }).default(''),
  model: varchar('model', { length: 100 }).default(''),
  price: real('price').default(0),
  location: varchar('location', { length: 200 }).default(''),
  status: varchar('status', { length: 50 }).notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==================== 借还记录表 ====================
export const borrowRecords = pgTable('borrow_records', {
  id: serial('id').primaryKey(),
  deviceId: integer('device_id')
    .notNull()
    .references(() => devices.id),
  deviceCode: varchar('device_code', { length: 100 }).notNull(),
  deviceName: varchar('device_name', { length: 200 }).notNull(),
  borrowerName: varchar('borrower_name', { length: 100 }).notNull(),
  borrowerClass: varchar('borrower_class', { length: 100 }).default(''),
  borrowerStudentId: varchar('borrower_student_id', { length: 50 }).default(''),
  borrowerPhone: varchar('borrower_phone', { length: 50 }).default(''),
  borrowTime: timestamp('borrow_time').notNull(),
  returnDeadline: timestamp('return_deadline').notNull(),
  actualReturnTime: timestamp('actual_return_time'),
  notified: boolean('notified').default(false),
  notifyTime: timestamp('notify_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==================== 用户表 (Electron 本地认证) ====================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }).default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==================== 会话表 (Electron 本地认证) ====================
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
