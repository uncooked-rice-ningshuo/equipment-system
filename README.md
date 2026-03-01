# 设备借还管理系统

一个支持双模式（Electron 桌面版 + Web 在线版）的设备借还管理系统。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        共享层 (Shared)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  UI 组件    │  │  Drizzle    │  │  服务接口 (Services)│ │
│  │  (React)    │  │  Schema     │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────────┐                 ┌───────────────────────┐
│    Electron 桌面版     │                 │   Next.js Web 全栈    │
│    (纯离线·单机)       │                 │   (在线·一键部署)     │
├───────────────────────┤                 ├───────────────────────┤
│  • Main Process       │                 │  • Next.js 15 App     │
│    - IPC Handlers     │                 │    Router             │
│    - better-sqlite3   │                 │  • API Routes         │
│    - bcrypt 认证      │                 │  • better-auth        │
│  • Renderer (React)   │                 │  • PostgreSQL         │
│    - Ant Design       │                 │  • Ant Design         │
│    - ECharts 图表     │                 │  • ECharts 图表       │
└───────────────────────┘                 └───────────────────────┘
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+ (Web 版)
- Docker (可选)

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd equipment-system

# 安装依赖
pnpm install

# 构建共享包
pnpm --filter "@equipment/*" build
```

### 开发

**Electron 桌面版:**

```bash
pnpm dev:electron
```

**Web 在线版:**

```bash
# 配置环境变量
cp packages/web/.env.example packages/web/.env
# 编辑 .env 设置 DATABASE_URL

# 启动数据库
cd packages/web && docker-compose up -d db

# 运行迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev:web
```

## 项目结构

```
equipment-system/
├── packages/
│   ├── shared/              # 共享 Schema 和接口
│   │   ├── src/db/schema.ts # Drizzle PostgreSQL Schema
│   │   └── src/services/core/
│   │
│   ├── ui/                  # 共享 UI 组件
│   │   ├── src/styles/      # 主题配置
│   │   └── src/hooks/       # 业务 Hooks
│   │
│   ├── electron-app/        # Electron 桌面版
│   │   ├── src/main/        # 主进程
│   │   ├── src/renderer/    # 渲染进程
│   │   └── electron-builder.yml
│   │
│   └── web/                 # Next.js Web 全栈
│       ├── src/app/         # App Router
│       ├── src/lib/         # auth, db
│       ├── src/services/    # Web 服务实现
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── .github/workflows/       # CI/CD 工作流
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## 技术栈

### 共享

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Drizzle ORM** - 数据库 ORM
- **Zod** - 数据验证
- **Zustand** - 状态管理

### Electron 桌面版

- **Electron 30** - 桌面框架
- **better-sqlite3** - SQLite 数据库
- **bcryptjs** - 密码加密
- **IPC** - 进程通信

### Web 在线版

- **Next.js 15** - React 全栈框架
- **better-auth** - 认证系统
- **PostgreSQL** - 数据库
- **Docker** - 容器化

### UI

- **Ant Design 5** - 组件库
- **Styled Components** - CSS-in-JS
- **ECharts 6** - 图表库

## 功能特性

- ✅ 设备管理 (CRUD)
- ✅ 借还记录管理
- ✅ 逾期提醒
- ✅ 仪表盘统计
- ✅ 图表可视化
- ✅ 主题切换
- ✅ 响应式设计
- ✅ 离线支持 (Electron)
- ✅ 多平台支持 (Windows/macOS/Linux)

## 构建

**Electron:**

```bash
# 构建主进程
pnpm --filter @equipment/electron-app build

# 打包 (当前平台)
pnpm --filter @equipment/electron-app electron:build

# 打包 (特定平台)
pnpm --filter @equipment/electron-app electron:build:mac
pnpm --filter @equipment/electron-app electron:build:win
pnpm --filter @equipment/electron-app electron:build:linux
```

**Web:**

```bash
# 构建生产版本
pnpm --filter @equipment/web build

# Docker 构建
cd packages/web && docker-compose up --build
```

## 部署

### Web 版 Docker 部署

```bash
cd packages/web

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd packages/web
vercel --prod
```

## CI/CD

本项目使用 GitHub Actions 进行持续集成和部署：

- **CI** (`ci.yml`): 代码检查、构建测试
- **Release** (`release-electron.yml`): Electron 自动发布
- **Deploy** (`deploy-web.yml`): Web Docker 部署

查看 [工作流文档](.github/workflows/README.md) 了解详情。

## 数据库迁移

**Web 版 (PostgreSQL):**

```bash
cd packages/shared
pnpm db:generate  # 生成迁移文件
pnpm db:migrate   # 执行迁移
```

**Electron 版 (SQLite):**

- 自动在应用启动时创建表结构

## 开发指南

### 添加新页面

1. 在 `packages/web/src/app/(main)/` 创建页面目录
2. 实现页面组件
3. 更新侧边栏菜单 (layout.tsx)

### 添加新 API

1. 在 `packages/shared/src/services/core/` 定义接口
2. Electron: 在 `packages/electron-app/src/main/ipc/` 实现 IPC handler
3. Web: 在 `packages/web/src/app/api/` 创建 API Route

### 添加图表组件

1. 在 `packages/web/src/components/charts/` 创建组件
2. 使用 `echarts-for-react` 渲染图表
3. 在页面中引入使用

## 环境变量

### Web 版 (.env)

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/equipment"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 贡献

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 致谢

- [Ant Design](https://ant.design)
- [Next.js](https://nextjs.org)
- [Electron](https://electronjs.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [better-auth](https://github.com/better-auth/better-auth)
