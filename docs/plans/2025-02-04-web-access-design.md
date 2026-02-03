# Web 端访问支持设计方案

**日期**: 2025-02-04 **版本**: 1.0 **方案**: 方案 1 - Electron 内置 HTTP 服务器

---

## 概述

当前项目使用 `better-sqlite3` 数据库，该库只能在 Node.js 环境运行，导致浏览器端无法直接访问数据库。本方案通过在 Electron 主进程中内置 HTTP 服务器，使 Web 端能够通过 HTTP 请求访问同一套数据库，实现桌面端和 Web 端功能完全一致。

### 核心目标

- 使用同一套 SQLite 数据库，数据实时同步
- 桌面端和 Web 端功能完全一致
- 前端代码改动最小
- 可独立部署 Web 端（完全独立模式）

---

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────┐
│                  应用前端                         │
│  ┌─────────────┐    ┌──────────────┐            │
│  │   桌面端    │    │   Web 端     │            │
│  │ (Electron)  │    │   (浏览器)   │            │
│  └──────┬──────┘    └──────┬───────┘            │
│         │ IPC               │ HTTP               │
└─────────┼───────────────────┼────────────────────┘
          │                   │
    ┌─────▼───────────────────▼─────┐
    │      Electron 主进程           │
    │  ┌─────────────┐  ┌───────────┐│
    │  │  IPC 处理器  │  │HTTP Server ││
    │  └──────┬──────┘  └─────┬─────┘│
    │         │                 │     │
    │         └────────┬────────┘     │
    │                  ▼              │
    │         better-sqlite3          │
    │         (同一数据库)             │
    └─────────────────────────────────┘
```

### 访问方式

**桌面端**：

- 通过 Electron 的 IPC 通信
- 使用 `window.api.invoke()` 调用主进程
- 通过 token 参数传递认证信息

**Web 端**：

- 通过浏览器访问独立的 Web 前端
- 使用 HTTP 请求调用 Electron 的 API 服务器
- 使用 better-auth 的 cookie-based session 认证

---

## 技术选型

| 组件        | 选型           | 说明                           |
| ----------- | -------------- | ------------------------------ |
| HTTP 服务器 | Express        | 成熟稳定的 Node.js Web 框架    |
| HTTP 客户端 | Axios          | 前端 HTTP 请求库，已在项目中   |
| 认证        | better-auth    | 统一认证，cookie-based session |
| 数据库      | better-sqlite3 | 现有方案，保持不变             |
| 定时任务    | setInterval    | Electron 主进程定时清理任务    |

---

## 项目结构

### 新增文件

```
equipment-system/
├── electron/
│   ├── main.js                    # 现有主进程，重构 handleSecured
│   ├── preload.js                 # 现有预加载脚本，保持不变
│   ├── server.js                  # [新增] Express HTTP 服务器
│   └── services/
│       ├── database.js            # 现有数据库服务
│       ├── auth.js                # 现有认证服务
│       ├── apiHandlers.js         # [新增] 业务逻辑函数（从 main.js 提取）
│       └── httpMiddleware.js      # [新增] HTTP 中间件（CORS、认证）
├── src/
│   ├── services/
│   │   ├── ipc.ts                 # 现有 IPC 适配器，修改为环境检测
│   │   └── httpClient.ts          # [新增] HTTP 客户端适配器
│   └── config/
│       └── api.ts                 # [新增] API 配置（基础 URL、超时等）
└── docs/
    └── plans/
        └── 2025-02-04-web-access-design.md  # 本设计文档
```

### 文件职责

#### electron/server.js

- 初始化 Express 服务器
- 从环境变量读取端口（默认 3001）和监听地址（默认 127.0.0.1）
- 注册 RESTful API 路由
- 集成 better-auth 的 session 中间件
- 在 `app.whenReady()` 时启动服务器

#### electron/services/apiHandlers.js

- 将 `main.js` 中的业务逻辑函数提取为独立模块
- 例如：`deviceList()`, `deviceCreate()`, `borrowCreate()` 等
- 接收数据库实例和请求参数，返回结果或错误

#### electron/services/httpMiddleware.js

- `corsMiddleware()`：处理跨域（虽然绑定 localhost，但为了兼容性）
- `authMiddleware()`：使用 better-auth 验证 session cookie
- `errorHandler()`：统一错误处理和响应格式

#### src/services/httpClient.ts

- 实现 `invoke()` 函数，与 IPC 接口保持一致
- 使用 `axios` 发送 HTTP 请求到本地 API 服务器
- 自动处理认证 cookie（通过 `withCredentials: true`）

#### src/services/ipc.ts

- 检测环境：`window.api` 存在 → Electron；不存在 → Web
- Electron 环境：调用现有 `window.api.invoke()`
- Web 环境：调用 `httpClient.invoke()`

#### src/config/api.ts

- API 配置中心
- 基础 URL、超时时间等配置
- 支持环境变量覆盖

---

## API 路由设计

### 认证相关

```
POST   /api/auth/login               - 用户登录
POST   /api/auth/logout              - 用户登出
GET    /api/auth/verify              - 验证当前 session
```

### 设备管理

```
GET    /api/devices                  - 获取设备列表（支持查询参数）
POST   /api/devices                  - 创建设备
GET    /api/devices/:id              - 获取设备详情
PUT    /api/devices/:id              - 更新设备
DELETE /api/devices/:id              - 删除设备
```

### 借出记录（未归还）

```
GET    /api/borrow-records/active       - 获取当前借出记录列表
POST   /api/borrow-records/active       - 创建借出记录
PUT    /api/borrow-records/active/:id/return- 归还设备
```

### 已还记录

```
GET    /api/borrow-records/returned     - 获取已还记录列表（支持查询参数）
DELETE /api/borrow-records/returned/:id - 删除指定已还记录
DELETE /api/borrow-records/returned/batch- 批量删除已还记录（传 id 数组）
DELETE /api/borrow-records/returned/clean- 清理指定日期之前的已还记录
```

### 逾期和提醒

```
GET    /api/borrow-records/overdue      - 获取逾期未还记录
GET    /api/borrow-records/due-soon     - 获取即将到期记录（7天内）
PUT    /api/borrow-records/:id/notify   - 标记已通知
```

### 统计

```
GET    /api/stats/dashboard          - 仪表板统计数据
GET    /api/stats/device-types       - 设备类型分布
GET    /api/stats/borrowed-by-type    - 按类型统计借出（period参数）
```

### 用户

```
PUT    /api/user/change-password     - 修改密码
```

---

## 请求/响应格式

### 成功响应

```javascript
{
  success: true,
  data: { ... },
  total?: number  // 列表查询时返回总数
}
```

### 错误响应

```javascript
{
  success: false,
  message: '错误描述',
  code: 'ERROR_CODE',    // 可选，便于前端识别
  details: {}            // 可选，详细错误信息
}
```

### 示例

#### 获取设备列表

```javascript
// GET /api/devices?status=borrowed&type=笔记本电脑
Response: {
  success: true,
  data: [
    { id: 1, code: 'NB001', name: 'MacBook Pro', ... }
  ],
  total: 10
}
```

#### 创建设备

```javascript
// POST /api/devices
Request: {
  code: 'NB002',
  name: 'Dell XPS',
  type: '笔记本电脑',
  brand: 'Dell',
  price: 9999,
  location: 'A区-1'
}
Response: { success: true, data: { id: 2, ... } }
```

#### 批量清理已还记录

```javascript
// DELETE /api/borrow-records/returned/clean
Request: {
  beforeDate: '2024-01-01',  // 删除此日期之前的已还记录
  deviceCode?: 'NB001',       // 可选：指定设备
  borrowerName?: '张三'       // 可选：指定借用人
}
Response: {
  success: true,
  deletedCount: 25
}
```

---

## 认证流程

### 统一认证

IPC 和 HTTP 统一使用 better-auth 的 session 验证 API。

#### 登录流程

```
1. 用户提交表单 → 前端调用 /api/auth/login
2. 后端 better-auth 验证 → 创建 session
3. 返回 session cookie（HTTP）/ token（IPC 回退兼容）
4. 前端存储认证信息
```

#### HTTP 请求

```
1. 浏览器自动发送 session cookie
2. httpMiddleware.authMiddleware() 使用 better-auth 验证
3. 验证通过 → 调用 apiHandlers
4. 返回结果
```

#### IPC 请求

```
1. 前端发送 token（从 cookie 或 localStorage）
2. handleSecured() 使用 better-auth 验证 token
3. 验证通过 → 调用 apiHandlers
4. 返回结果
```

---

## 数据流

```
前端请求 → 适配器层（ipc.ts/httpClient.ts）→
传输层（IPC 或 HTTP）→ 业务逻辑层（apiHandlers.js）→
数据访问层（database.js）→ SQLite 数据库
```

---

## 定期清理任务

### 任务流程

```
1. 应用启动时初始化 cleanupTask
2. 每 24 小时执行一次（可配置）
3. 查询 actual_return_time IS NOT NULL 且日期超过保留期的记录
4. 批量删除
5. 记录日志
```

### 配置

```javascript
{
  cleanupInterval: 24 * 60 * 60 * 1000,    // 24小时清理一次
  cleanupRetentionDays: 90,                 // 保留90天的已还记录
}
```

---

## 错误处理

### 错误分类

| 类型       | HTTP 状态码 | 说明                                   |
| ---------- | ----------- | -------------------------------------- |
| 认证错误   | 401/403     | 未登录或权限不足                       |
| 验证错误   | 400         | 参数不合法                             |
| 资源错误   | 404         | 资源不存在                             |
| 业务错误   | 400         | 业务逻辑错误（设备已借出、编号重复等） |
| 服务器错误 | 500         | 服务器内部错误                         |

### 全局错误处理

- **HTTP**：Express 错误处理中间件捕获所有异常
- **IPC**：try-catch 包裹所有处理器，返回友好错误信息

---

## 配置

### 环境变量

```bash
API_PORT=3001                    # HTTP 服务器端口
API_HOST=127.0.0.1              # HTTP 服务器监听地址
API_TIMEOUT=10000                # 请求超时时间（毫秒）
CLEANUP_INTERVAL=86400000       # 清理间隔（毫秒）
CLEANUP_RETENTION_DAYS=90       # 保留天数
```

### 配置文件（src/config/api.ts）

```javascript
export const apiConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:3001',
  httpTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
  cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '86400000'),
  cleanupRetentionDays: parseInt(process.env.CLEANUP_RETENTION_DAYS || '90'),
  corsEnabled: process.env.CORS_ENABLED === 'true',
};
```

---

## 部署和使用流程

### 开发和测试

```bash
1. 启动开发环境
   npm run dev          # 同时启动 Web(8000) 和 Electron

2. 桌面端访问
   直接使用 Electron 应用

3. Web 端访问
   浏览器打开 http://localhost:8000
   API 请求自动指向 http://127.0.0.1:3001
```

### 生产构建和部署

```bash
1. 构建 Web 前端
   npm run build:web   # 生成 dist 目录

2. 部署 Web 端（可选，完全独立访问）
   将 dist 部署到 Web 服务器（如 Nginx）
   修改 config/api.ts 中的 apiBaseUrl 指向实际服务器

3. 构建 Electron 应用
   npm run build:mac   # 或 win/linux
```

---

## 测试策略

### 单元测试

- `apiHandlers.js` 的业务逻辑函数
- 数据库操作函数

### 集成测试

- HTTP API 端到端测试
- IPC 通道测试

### 环境测试

- 桌面端：验证 IPC 调用正常
- Web 端：验证 HTTP 调用正常
- 混合测试：同时运行两个环境，数据一致性验证

---

## 实施计划

### 主要步骤

1. **安装依赖**：express, cors, body-parser
2. **创建服务层**：apiHandlers.js, httpMiddleware.js
3. **创建 HTTP 服务器**：server.js，实现 RESTful API
4. **重构 main.js**：提取业务逻辑到 apiHandlers.js，统一认证
5. **创建 HTTP 客户端**：httpClient.ts
6. **修改 IPC 适配器**：环境检测逻辑
7. **实现定时清理任务**
8. **测试和验证**

### 关键里程碑

- [ ] 完成设计文档
- [ ] 创建 API Handlers 层
- [ ] 实现 HTTP 服务器和路由
- [ ] 实现 HTTP 客户端适配器
- [ ] 统一认证机制
- [ ] 实现定时清理任务
- [ ] 测试桌面端功能
- [ ] 测试 Web 端功能
- [ ] 部署和验证

---

## 优势和局限性

### 优势

- 使用同一套数据库，数据实时同步
- 桌面端和 Web 端功能完全一致
- 前端代码改动最小
- 可独立部署 Web 端
- 认证机制统一使用 better-auth

### 局限性

- 需要启动 HTTP 服务器，Electron 应用占用更多资源
- Web 端访问需要 Electron 应用运行（除非部署独立后端）
- HTTP 服务器绑定 localhost，仅支持本机访问（安全考虑）

---

## 后续优化方向

1. **性能优化**：添加请求缓存、批量查询优化
2. **安全增强**：添加请求限流、日志审计
3. **监控和日志**：集成日志系统，添加性能监控
4. **API 文档**：使用 Swagger/OpenAPI 生成 API 文档
5. **数据备份**：添加定时数据库备份功能
