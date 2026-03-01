# 重构修复清单

## 🔴 关键问题（必须修复）

### 1. 构建输出

```bash
# 执行构建
cd packages/shared && pnpm build
cd packages/ui && pnpm build
cd packages/electron-app && pnpm build
```

### 2. 修复 UI 包 hooks/index.ts

**文件**: `packages/ui/src/hooks/index.ts` **问题**: 引用了不存在的 `./useAuth` **修复**:

```typescript
export * from './useTheme';
// 删除或创建: export * from './useAuth';
```

### 3. Electron 渲染进程入口

**需要创建**:

- `packages/electron-app/src/renderer/index.html`
- `packages/electron-app/src/renderer/index.tsx` (或 main.tsx)
- `packages/electron-app/src/renderer/App.tsx`

**参考实现**:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>设备借还管理系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="./index.tsx"></script>
  </body>
</html>
```

### 4. 时间戳类型兼容

**问题**: PostgreSQL 和 SQLite 时间戳格式不同 **位置**:

- `packages/electron-app/src/main/ipc/devices.ts:46-50` 已有转换
- 需要确保所有 IPC handler 都进行转换

**修复方案**:

```typescript
// 在 shared 包创建时间戳工具函数
export function toDbTimestamp(date: Date): number {
  return date.getTime();
}

export function fromDbTimestamp(timestamp: number | Date): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}
```

---

## 🟡 次要问题（建议修复）

### 5. 完善 Web 页面

**文件**:

- `packages/web/src/app/(main)/returned/page.tsx` - 验证内容完整性
- `packages/web/src/app/(main)/profile/page.tsx` - 验证内容完整性

### 6. 添加专用 API 路由

**建议添加**:

- `GET /api/borrow/overdue`
- `GET /api/borrow/due-soon`

### 7. 创建测试

```bash
# 添加测试依赖
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# 创建测试文件结构
packages/
  shared/
    src/
      __tests__/
  ui/
    src/
      __tests__/
  web/
    src/
      __tests__/
```

---

## ✅ 验证步骤

### 步骤 1: 安装和构建

```bash
# 清理
rm -rf node_modules pnpm-lock.yaml
rm -rf packages/*/node_modules packages/*/dist

# 安装
pnpm install

# 构建共享包
pnpm build:shared
```

### 步骤 2: 验证 Web

```bash
# 启动数据库
cd packages/web && docker-compose up -d db

# 配置环境变量
cp packages/web/.env.example packages/web/.env
# 编辑 .env 设置 DATABASE_URL

# 运行迁移
cd packages/shared && pnpm db:migrate

# 启动开发服务器
pnpm dev:web
```

### 步骤 3: 验证 Electron

```bash
# 构建主进程
pnpm --filter @equipment/electron-app build

# 开发模式
pnpm dev:electron

# 测试构建
pnpm test:electron:build
```

---

## 📊 重构状态总览

| 组件              | 状态      | 备注             |
| ----------------- | --------- | ---------------- |
| Monorepo 配置     | ✅ 完成   | pnpm + turbo     |
| Shared 包         | ⚠️ 需构建 | 类型定义完整     |
| UI 包             | ⚠️ 需修复 | useAuth 引用错误 |
| Electron 主进程   | ✅ 完成   | IPC + 数据库     |
| Electron 渲染进程 | ❌ 未完成 | 缺少页面         |
| Web API           | ✅ 完成   | 6 个路由         |
| Web 页面          | ⚠️ 需验证 | 图表已集成       |
| CI/CD             | ✅ 完成   | GitHub Actions   |
| 文档              | ✅ 完成   | README + 示例    |

**总体进度**: 75% **预计剩余工作**: 4-6 小时
