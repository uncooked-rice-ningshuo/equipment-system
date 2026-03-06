# 重构后技术架构（Monorepo + Electron/Web 双端）

本文档描述当前仓库“重构后主线”的技术架构：以 `packages/*` 为核心（shared/ui/electron-app/web），通过共享域模型与服务接口实现跨端一致的业务能力，并分别落地到离线桌面端（Electron）与在线 Web 全栈端（Next.js）。

## 0. 快速索引

- 工作区与编排
  - [pnpm-workspace.yaml](../pnpm-workspace.yaml)
  - [turbo.json](../turbo.json)
  - [package.json](../package.json)
- Electron（入口与安全边界）
  - 主进程入口：[packages/electron-app/src/main/index.ts](../packages/electron-app/src/main/index.ts)
  - IPC 注册聚合：[packages/electron-app/src/main/ipc/index.ts](../packages/electron-app/src/main/ipc/index.ts)
  - Preload 白名单与 API 暴露：[packages/electron-app/src/preload.ts](../packages/electron-app/src/preload.ts)
  - 渲染入口：[packages/electron-app/src/renderer/index.tsx](../packages/electron-app/src/renderer/index.tsx)
- Web（页面、API、认证、DB）
  - App Router 根布局：[packages/web/src/app/layout.tsx](../packages/web/src/app/layout.tsx)
  - API 示例（设备）：[packages/web/src/app/api/devices/route.ts](../packages/web/src/app/api/devices/route.ts)
  - 认证配置（better-auth）：[packages/web/src/lib/auth/index.ts](../packages/web/src/lib/auth/index.ts)
  - DB 连接（Drizzle + Postgres）：[packages/web/src/lib/db/index.ts](../packages/web/src/lib/db/index.ts)
  - API 返回与鉴权工具：[packages/web/src/lib/utils.ts](../packages/web/src/lib/utils.ts)
- Shared（统一域模型与接口）
  - 统一数据接口（IDataService）：[packages/shared/src/services/core/IDataService.ts](../packages/shared/src/services/core/IDataService.ts)
  - 统一错误类型：[packages/shared/src/utils/error.ts](../packages/shared/src/utils/error.ts)
- CI/CD
  - CI/Release（自动）：[.github/workflows/ci.yml](../.github/workflows/ci.yml)
  - Release（手动）：[.github/workflows/release-electron.yml](../.github/workflows/release-electron.yml)
  - Web 部署（手动/自动）：[.github/workflows/deploy-web.yml](../.github/workflows/deploy-web.yml)
  - 工作流说明：[.github/workflows/README.md](../.github/workflows/README.md)

## 1. 架构目标与原则

- **双模式一致性**：同一套业务概念（设备、借还、统计、通知标记）在 Electron/Web 端保持接口与类型一致（shared 定义、平台实现）。
- **平台差异可控**：Electron 以本地 SQLite 离线运行，Web 以 Postgres 在线运行；差异集中在“实现层”，上层页面尽量不感知数据库/鉴权细节。
- **复用优先**：UI 组件、图表、主题与通用工具尽量沉到 `@equipment/ui` 与 `@equipment/shared`。
- **可部署与可发布**：Web 端支持 Docker 一键部署；Electron 端支持多平台打包与 Release 流水线。

## 2. 仓库结构与依赖关系

### 2.1 Monorepo 工作区

- workspace：`pnpm-workspace.yaml`
- 任务编排：`turbo.json`
- 根脚本：`package.json`

### 2.2 核心包说明（重构后主线）

```
packages/
  shared/        # 共享域：schema/types/services 接口
  ui/            # 共享 UI：组件/主题/图表/legacy 兼容层
  electron-app/  # Electron：主进程 + preload + renderer
  web/           # Next.js：App Router + API Route Handlers + Docker
```

依赖方向（建议理解为“只能向下依赖”）：

```
@equipment/web         @equipment/electron-app
        │                     │
        ├───────┐     ┌───────┤
        ▼       ▼     ▼       ▼
    @equipment/ui   @equipment/shared
```

### 2.3 旧实现的定位（非主线）

根目录仍保留 `src/`（Umi 单体）与 `electron/`（旧 Electron/Node 实现）。它们更多用于历史兼容与参考；当前主线以 `packages/*` 为准。

## 3. 共享域层（@equipment/shared）

共享域层承载“跨端一致”的核心内容：

### 3.1 Schema & Types

- 业务实体（示例）：`Device`、`BorrowRecord` 等
- 查询与列表抽象：`ListOptions`、`ListResult`、`DeviceFilter`、`BorrowFilter` 等

入口与位置：

- `packages/shared/src/db/schema.ts`
- `packages/shared/src/db/types.ts`

### 3.2 服务接口（Services Core）

以 `IDataService` 为代表定义跨端能力边界：设备管理、借还管理、统计查询、通知标记等。

- `packages/shared/src/services/core/IDataService.ts`
- `packages/shared/src/services/core/IAuthService.ts`

这层的价值在于：

- Web/Electron 可各自演进数据库与鉴权实现，但**对上层暴露的能力保持一致**
- UI/页面与数据来源解耦，便于迁移与测试

## 4. Electron 离线架构（@equipment/electron-app）

Electron 端目标是“纯离线、单机可运行”，不依赖 HTTP 后端服务。

### 4.1 进程划分与职责

```
┌──────────────────────────────┐
│ Renderer (React UI)          │
│  - 页面/组件                 │
│  - 调用 Electron*Service     │
└───────────────┬──────────────┘
                │ window.electronAPI.invoke
┌───────────────▼──────────────┐
│ Preload (ContextBridge)      │
│  - 白名单通道                │
│  - 暴露 invoke 到 window     │
└───────────────┬──────────────┘
                │ IPC
┌───────────────▼──────────────┐
│ Main Process                 │
│  - 数据库连接/迁移/任务       │
│  - IPC handlers（业务入口）  │
└───────────────┬──────────────┘
                │ SQL/ORM
┌───────────────▼──────────────┐
│ SQLite (better-sqlite3)      │
│ Drizzle ORM                  │
└──────────────────────────────┘
```

关键入口：

- 主进程入口：[packages/electron-app/src/main/index.ts](../packages/electron-app/src/main/index.ts)
- preload：[packages/electron-app/src/preload.ts](../packages/electron-app/src/preload.ts)
- 渲染入口：[packages/electron-app/src/renderer/index.tsx](../packages/electron-app/src/renderer/index.tsx)

### 4.2 IPC 分层（按业务模块拆分）

主进程集中注册 IPC，再按业务模块拆分实现：

- 注册聚合：`packages/electron-app/src/main/ipc/index.ts`
- 认证：`packages/electron-app/src/main/ipc/auth.ts`
- 设备：`packages/electron-app/src/main/ipc/devices.ts`
- 借还：`packages/electron-app/src/main/ipc/borrow.ts`
- 统计：`packages/electron-app/src/main/ipc/stats.ts`

渲染侧通过服务封装调用（避免页面直接碰 IPC）：

- [packages/electron-app/src/renderer/services/ElectronDataService.ts](../packages/electron-app/src/renderer/services/ElectronDataService.ts)
- [packages/electron-app/src/renderer/services/ElectronAuthService.ts](../packages/electron-app/src/renderer/services/ElectronAuthService.ts)

### 4.3 本地数据库与数据访问

- DB 文件位置：`app.getPath('userData')/equipment.db`
- 技术栈：better-sqlite3 + Drizzle ORM
- 连接与初始化：`packages/electron-app/src/main/db/connection.ts`

典型链路：

1. Renderer 调用 `ElectronDataService.getDevices()`
2. 通过 preload invoke 到 Main IPC channel
3. Main IPC handler 使用 Drizzle/SQL 读写 SQLite
4. 结果返回 Renderer 更新 UI

### 4.4 Electron 本地认证

- 形态：本地 users/sessions 表 + token 存储（渲染侧 localStorage）
- 校验：主进程 IPC 在敏感操作前校验 session 是否有效/过期

入口：

- [packages/electron-app/src/main/ipc/auth.ts](../packages/electron-app/src/main/ipc/auth.ts)
- [packages/electron-app/src/renderer/services/ElectronAuthService.ts](../packages/electron-app/src/renderer/services/ElectronAuthService.ts)

### 4.5 安全边界（Preload 白名单 + 禁用 Node 集成）

Electron 端将敏感能力放在主进程，并通过 preload 暴露最小化 API：

- **BrowserWindow 安全配置**：`contextIsolation: true`、`nodeIntegration: false`、`webSecurity: true`（见主进程创建窗口）
- **IPC 通道白名单**：preload 中仅允许白名单 channel 被调用（阻断任意 IPC 调用）
- **统一入口**：渲染侧只使用 `window.electronAPI.invoke(...)` 与服务封装交互

相关实现：

- [packages/electron-app/src/main/index.ts](../packages/electron-app/src/main/index.ts)
- [packages/electron-app/src/preload.ts](../packages/electron-app/src/preload.ts)

## 5. Web 在线全栈架构（@equipment/web）

Web 端采用 Next.js App Router，同时在同一应用内提供 UI 与 API（Route Handlers）。

### 5.1 应用分层（UI 与 API 同仓）

```
Browser / Client Components
        │ fetch (include cookies)
        ▼
Next.js Route Handlers (/app/api/**/route.ts)
        │ AuthN/AuthZ + DB Access
        ▼
PostgreSQL (Drizzle ORM)
```

入口：

- 页面路由：`packages/web/src/app/**`
- API 路由：`packages/web/src/app/api/**/route.ts`

### 5.2 数据访问封装（WebDataService）

`WebDataService` 负责统一封装对 `/api` 的访问，集中处理：

- base URL / headers
- `credentials: 'include'`（携带 session cookie）
- 统一错误处理与返回结构

位置：

- [packages/web/src/services/WebDataService.ts](../packages/web/src/services/WebDataService.ts)

### 5.3 认证与会话（better-auth）

- 技术栈：better-auth + Drizzle adapter（Postgres）
- API 入口：`/api/auth/[...all]`

位置：

- Auth 配置：[packages/web/src/lib/auth/index.ts](../packages/web/src/lib/auth/index.ts)
- Auth Route：[packages/web/src/app/api/auth/[...all]/route.ts](../packages/web/src/app/api/auth/[...all]/route.ts)

### 5.4 数据库（Postgres + Drizzle）

连接与 DB 实例：

- `packages/web/src/lib/db/index.ts`

常见 API 形态：

- `GET /api/devices`（列表）
- `POST /api/devices`（创建）
- `PATCH /api/devices/:id`（更新）
- `DELETE /api/devices/:id`（删除）

示例位置：

- [packages/web/src/app/api/devices/route.ts](../packages/web/src/app/api/devices/route.ts)
- [packages/web/src/app/api/devices/[id]/route.ts](../packages/web/src/app/api/devices/[id]/route.ts)

### 5.5 API 返回规范与鉴权入口

Web API 采用统一 JSON 包装，便于前端稳定处理：

- 成功：`{ success: true, data }`
- 失败：`{ success: false, error }`

并通过 `requireAuth(request)` 在 Route Handler 内做“会话校验”：

- [packages/web/src/lib/utils.ts](../packages/web/src/lib/utils.ts)

## 6. UI 与状态管理（@equipment/ui + 各端 App）

### 6.1 UI 组件与样式

- 组件库：Ant Design
- 样式方案：styled-components
- 图表：ECharts（Web 端依赖 `echarts-for-react`）

位置：

- UI 组件：`packages/ui/src/components/**`
- 主题与全局样式：`packages/ui/src/styles/**`

### 6.2 legacy 兼容层（迁移策略）

`packages/ui/src/legacy/**` 提供旧页面/布局/路由/服务提供者等适配能力，用于逐步迁移到新的页面结构与组件体系：

- legacy 路由：`packages/ui/src/legacy/router/**`
- legacy 页面：`packages/ui/src/legacy/pages/**`
- legacy 服务注入：`packages/ui/src/legacy/services/**`

### 6.3 状态管理

- 轻量 UI 状态：多数场景使用 React state 即可
- 可共享持久化状态：目前明确使用 Zustand 做主题持久化（`useThemeStore`）

位置：

- `packages/ui/src/hooks/useTheme.ts`

## 7. 构建、发布与部署

### 7.1 本地开发与构建（Turbo 编排）

根目录脚本通过 Turbo 统一驱动：

- `dev` / `dev:web` / `dev:electron`
- `build` / `build:web` / `build:electron`
- `db:*`（用于 Web/Postgres 的迁移相关任务）

位置：

- 根 `package.json`

### 7.2 Electron 打包发布（electron-builder）

- 编译：`tsc(main/preload) + vite(renderer)`
- 打包：electron-builder 输出至 `packages/electron-app/dist-electron`

配置与脚本：

- `packages/electron-app/electron-builder.yml`
- `packages/electron-app/package.json`

### 7.3 Web 部署（Docker / Standalone）

Web 构建开启 `output: 'standalone'`，Dockerfile 以 standalone 方式运行：

- `packages/web/next.config.js`
- `packages/web/Dockerfile`
- `packages/web/docker-compose.yml`

### 7.4 CI/CD（GitHub Actions）

工作流目录：`.github/workflows/`

- `ci.yml`：CI（lint/build）+ Release（按分支/tag 触发的构建与产物上传）
- `release-electron.yml`：手动触发的 Electron 发布工作流（包含 Release assets 与通知）
- `deploy-web.yml`：Web 镜像构建/推送与部署相关

#### 7.4.1 CI（PR / main / develop）

触发范围：PR 以及 push 到 `main/develop`。

- `lint`：安装依赖（`--ignore-scripts`）→ build shared → lint
- `build-electron`：ubuntu/windows/macos 矩阵 build（不打包安装包），上传 `packages/electron-app/dist-electron/` 作为 artifact
- `build-web`：`next build`，上传 `packages/web/.next/` 作为 artifact

对应配置文件：

- [.github/workflows/ci.yml](../.github/workflows/ci.yml)

#### 7.4.2 Electron Release（main / tag v\*）

触发范围：push 到 `main` 或 tag `v*`。

核心链路（按阶段）：

1. `build-installers`：windows/macos 矩阵执行 `release:electron:*`，产物上传为 `release-${os}` artifact
2. `release`：生成 release tag（若不是 tag push，则从根 `package.json` 版本拼出 `v${version}`），创建/更新 GitHub Release
3. `upload_release_assets`：下载各 OS 的 release artifacts，作为 Release assets 上传
4. `notify_feishu_release`：读取产物文件名（`.exe/.dmg`）拼消息，推送到飞书 webhook

对应配置文件：

- [.github/workflows/ci.yml](../.github/workflows/ci.yml)

#### 7.4.3 手动发布与手动部署

- Electron 手动发布：`.github/workflows/release-electron.yml`（适合需要“手动点一次跑发布”的场景）
- Web 部署：`.github/workflows/deploy-web.yml`（Docker Hub / Vercel 等部署动作聚合）

建议从这里理解“产物如何生成/上传/发布”：

- `.github/workflows/ci.yml`
- `.github/workflows/release-electron.yml`
- `.github/workflows/deploy-web.yml`

## 8. 扩展点（新增能力的推荐路径）

### 8.1 新增一项业务能力（以数据接口为中心）

1. 在 `packages/shared/src/services/core/*` 增加/调整接口方法与类型（例如 `IDataService`）
2. Electron：实现对应 IPC handler（`packages/electron-app/src/main/ipc/*`），并在渲染侧 `ElectronDataService` 暴露方法
3. Web：新增/调整 Route Handler（`packages/web/src/app/api/**/route.ts`），并在 `WebDataService` 增加调用封装
4. UI：在 `packages/ui` 抽象可复用组件/图表，在 `web/electron-app` 组合页面

### 8.2 新增页面

- Web：在 `packages/web/src/app/(main)/` 新建路由目录
- Electron：在 `packages/electron-app/src/renderer/pages/` 增加页面，并在 `App.tsx`/路由侧挂载（当前使用 hash 路由风格）
- 共享 UI 优先放到 `packages/ui/src/pages` 或 `packages/ui/src/components`
