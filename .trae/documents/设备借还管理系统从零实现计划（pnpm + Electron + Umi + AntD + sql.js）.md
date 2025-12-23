## 项目目标与范围

* 交付一款本地离线运行的设备借还管理桌面应用，满足登录、首页看板、借出记录、已还记录、设备管理、个人中心（改密）、逾期提醒弹窗。

* 技术栈：Electron（主进程/渲染进程）、Umi.js + React + Ant Design（渲染层）、sql.js（主进程本地库，WASM版SQLite），IPC通信桥接。

* 包管理统一使用 `pnpm`，所有初始化、安装、构建脚本严格以 `pnpm` 运行。

## 技术关键决策

* 安全：启用 `contextIsolation: true` 与 `nodeIntegration: false`，通过 `preload` 以 `contextBridge` 暴露受限 API，渲染层不直接 `require('electron')`。

* 数据：在主进程使用 `sql.js` 内存库 + 定时/退出持久化到 `app.getPath('userData')/database.sqlite`；初始化时自动建表与索引。

* 认证：使用 `bcryptjs` 在主进程对密码做哈希存储与校验，避免明文密码。

* 时间：统一用 `dayjs` 处理时间、剩余天数、逾期判断。

* 构建：开发态 Electron 依赖 Umi dev server（端口 8000）；生产态用 `electron-builder` 打包 Windows 安装包。

## 项目初始化（pnpm）

* 创建 Umi 项目骨架：`pnpm create umi@latest`，选择 React + Ant Design 模板（空白基础模板更轻量，后续自行加路由/页面）。

* 初始化 Git 忽略（可选）：添加构建产物与打包中间文件（如 `dist/`, `out/`, `node_modules/`）。

## 依赖与脚本规划

* 运行依赖：`electron`, `sql.js`, `bcryptjs`, `dayjs`。

* 开发依赖：`@umijs/preset-electron`, `electron-is-dev`, `concurrently`, `wait-on`, `typescript`, `ts-node`, `@types/node`。

* 脚本：

  * `dev:web`: `umi dev`（默认端口 8000）

  * `dev:electron`: `wait-on http://localhost:8000 && electron ./electron/main.ts`（结合 `concurrently` 同时启动）

  * `dev`: `concurrently "pnpm dev:web" "pnpm dev:electron"`

  * `build:web`: `umi build` 输出到 `dist/`

  * `build:electron`: TypeScript 编译 `electron/` 源码到 `out/electron`

  * `build:win`: 使用 `electron-builder` 打包 Windows（配置见下文）

## 目录结构

* `electron/` 主进程与预加载：`main.ts`, `preload.ts`, `services/database.ts`

* `src/` 渲染层：`pages/`, `components/`, `models/`（或 `useModel`），`services/`（IPC 封装），`app.tsx`

* `.umirc.ts` Umi 配置（路由、antd、dva/useModel、locale）

## Electron 集成（开发/生产）

* `electron/main.ts`：创建窗口，按环境加载：开发 `http://localhost:8000`，生产 `file://.../dist/index.html`；启用 `preload.ts`。

* `electron/preload.ts`：通过 `contextBridge` 暴露受限 API：`ipc.invoke(channel, ...args)`，并定义允许的 `channel` 白名单，保证类型与安全。

* Windows 兼容：窗口图标、任务栏、关闭事件前持久化；异常捕获与统一错误返回。

## 数据层设计（sql.js 主进程）

* 表结构：

  * `devices(id, code UNIQUE, name, type, brand, model, price, location, status, created_at)`

  * `borrow_records(id, device_id FK, borrower_name, borrower_class, borrower_student_id, borrower_phone, borrow_time, return_deadline, actual_return_time, notified INT, notify_time DATETIME)`

  * `users(id, username UNIQUE, password_hash, created_at)`

* 索引：`devices(code)`, `devices(type)`, `borrow_records(device_id)`, `borrow_records(return_deadline)`, `users(username)`。

* 初始化：

  * 首次运行建表并插入默认管理员（如 `admin` / 初始密码可在首次登录时强制改密）。

  * 定期持久化（如每 5 分钟）与退出前持久化。

* sql.js WASM文件定位：`initSqlJs({ locateFile: (file) => path.join(__dirname, 'sql-wasm.wasm') })`，确保打包/运行时能找到 WASM（开发态复制到 `electron/services/`，生产态通过打包资源配置）。

## IPC API 设计（主进程）

* 设备：`device:list(filters)`, `device:create(device)`, `device:update(id, device)`, `device:delete(id)`（已借出不可删）。

* 借还：`borrow:create(record)`, `borrow:return(recordId)`（更新设备状态，并记录归还时间）。

* 看板：`stats:dashboard()`（总数、在借、可借、逾期），后续可加类型分布与状态分组统计。

* 认证：`auth:login(username, password)`, `auth:changePassword(old, next)`。

* 通知：`notify:mark(recordId)`（设置 `notified=1` 与 `notify_time`）。

* 统一错误：所有 `ipcMain.handle` try/catch，返回 `{success:false,message}`。

## 渲染层实现（Umi + AntD）

* 路由：

  * `/login` 登录页 → 成功后跳转 `/dashboard` 并弹出逾期提醒弹窗。

  * `/dashboard` 首页看板（关键指标卡片 + 图表 + 归还倒计时列表）。

  * `/borrow` 借出设备记录（查询、分页、新增借出弹窗、归还确认弹窗）。

  * `/returned` 已还设备记录（查询、删除记录）。

  * `/devices` 设备管理（查询、增、改、删；新增两种模式）。

  * `/profile` 个人中心（修改密码）。

* 状态：`useModel('auth')` 管理登录态与路由守卫；通用 `useModel('stats')` 获取看板数据。

* IPC 封装：`src/services/*` 提供 `invoke(channel, args)` 的类型安全包装，调用 `preload` 暴露的 API。

* 逾期提醒弹窗：登录成功后拉取逾期/临期（≤5天）列表，默认先显示逾期；支持“未通知/已通知”。

* 表单校验：手机号 11 位、学号 10 位、应还时间晚于借出时间。

## 构建与打包（仅 pnpm）

* 开发：`pnpm dev` 并自动打开 Electron 窗口；渲染层热更新。

* 生产网页：`pnpm build:web` 输出 `dist/`（Umi）。

* Electron 打包：`electron-builder` 配置：

  * `appId`、`productName`、`win.icon`、`files`（包含 `dist/` 与 `out/electron`）、`extraResources`（包含 `sql-wasm.wasm`）。

  * 产出 `win-unpacked/` 与 `.exe` 安装包。

## 常见构建/运行问题与解决

* sql.js 找不到 WASM：确保 `locateFile` 指向打包后的资源路径，并在 `extraResources` 中复制；开发态将 `sql-wasm.wasm` 放在可读取路径。

* Electron 无法加载渲染页：开发态确认 Umi server 8000 已启动；使用 `wait-on` 防止抢跑。

* `contextIsolation` 下无法访问 `ipcRenderer`：通过 `preload.ts` 暴露受限 API，不在渲染层使用 `window.require`。

* Windows 打包签名/权限：若未签名，允许无签名本地安装；若需自动更新，后续再集成。

## 验证与测试

* 冒烟测试：登录、弹窗、增删改查、借出/归还流程、统计卡片数值正确。

* 边界：删除已借出设备应失败；归还更新状态与列表流转；逾期与临期计算正确。

* 单元测试（可选）：对主进程核心服务进行最小测试（抽象出纯函数部分）。

## 时间线与里程碑

* 第1天：项目初始化、Electron联调、数据库初始化、认证基础完成。

* 第2-3天：设备管理、借出/归还、看板与提醒弹窗。

* 第4天：打包配置与 Windows 安装包产出、联调与修正。

## 交付物

* 可运行的开发环境（`pnpm dev` 一键起）、`.exe` 安装包、基本使用说明（内嵌到应用“帮助”页或 README）。

## 下一步

* 若确认本计划，开始按步骤创建项目、编写主/渲染进程代码、配置打包，并在每个阶段用 `pnpm` 验证运行与解决问题。

