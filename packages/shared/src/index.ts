/**
 * Equipment System Shared Package
 * 包含数据库 Schema、类型定义和服务接口
 */

// 数据库 Schema 和类型 (PostgreSQL - Web 版)
export * from './db/schema';
export * from './db/types';

// SQLite Schema (用于 Electron) - 从 @equipment/shared/db/sqlite-schema 导入

// 服务接口
export * from './services/core';
