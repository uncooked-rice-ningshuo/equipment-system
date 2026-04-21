# 智能周报功能设计（Web + Electron 同步）

日期：2026-04-21  
状态：已确认（可进入实现）

## 1. 背景与目标

当前系统已具备借还记录、统计能力与双端（Web/Electron）运行基础，但缺少“基于近一周借用数据自动生成可打印管理报告”的能力。

本次目标：

- 查询时固定使用“最近 7 天”借用数据（不提供筛选条件）
- 调用云端大模型生成结构化报告
- 强制输出严格 JSON Schema
- 前端按统一模板渲染，并支持打印
- 每次查询结果持久化入库，可查看历史并再次渲染打印
- Web 与 Electron 双端口径一致、行为一致

非目标（本期不做）：

- 自动定时生成
- 多语言报告
- 可编辑富文本报告设计器

## 2. 方案选择结论

已确认方案：

- 端支持：Web + Electron 同步
- 模型方式：云端大模型 API
- 输出结构：严格 JSON Schema
- 架构路线：方案 A（共享核心服务 + 双端适配层）

对比结论：

- 方案 A 初期改动稍大，但长期维护成本最低，且能保证双端一致性。

## 3. 总体架构

采用“共享核心 + 双端适配”两层结构。

### 3.1 共享核心（packages/shared）

新增 `report` 领域，包含：

- `types.ts`：报告请求/响应与中间快照类型
- `schema.ts`：JSON Schema 常量与校验工具
- `aggregator.ts`：周数据聚合与锁定事实生成
- `prompt.ts`：结构化提示词组装
- `generateWeeklyReport.ts`：主流程（聚合 -> 生成 -> 校验 -> 重试/降级）

### 3.2 端侧适配

Web：

- 新增 API：`POST /api/reports/weekly`（生成并入库）
- 新增 API：`GET /api/reports/weekly/history`（历史列表）
- 新增 API：`GET /api/reports/weekly/:id`（历史详情）
- 复用现有鉴权 (`getAuth().api.getSession`) 与 DB 获取 (`getDb()`)
- 页面调用 API 生成报告、查看历史、按历史记录重渲染打印

Electron：

- 新增 IPC：`report:weeklyGenerate`
- 新增 IPC：`report:weeklyHistory`
- 新增 IPC：`report:weeklyGetById`
- 在 main 进程调用共享核心
- renderer 通过 `window.electronAPI.invoke` 生成和读取历史报告

## 4. 数据流

1. 前端点击“生成智能周报”（无需填写筛选条件）
2. 端适配层读取借还数据与设备数据
3. `aggregator` 产出 `WeeklyReportDataSnapshot`（含锁定事实）
4. 调用大模型并要求 `json_schema` 返回
5. 本地做 Schema 校验 + 一致性校验
6. 通过后将报告 JSON + 快照摘要写入 `report_queries`（新表）
7. 返回“本次生成结果 + recordId”给前端渲染
8. 历史页读取 `report_queries` 列表，支持再次打开并打印

## 5. 固定 JSON Schema（建议）

顶层结构：

- `meta`
- `kpis`
- `sections`
- `risks`
- `actions`

建议定义（示意）：

```json
{
  "meta": {
    "reportId": "string",
    "generatedAt": "ISO datetime",
    "periodStart": "ISO datetime",
    "periodEnd": "ISO datetime",
    "sampleSize": 0,
    "model": "string",
    "version": "v1"
  },
  "kpis": {
    "borrowTotal": 0,
    "returnTotal": 0,
    "overdueTotal": 0,
    "overdueRate": 0,
    "avgBorrowDurationHours": 0,
    "activeBorrowerCount": 0
  },
  "sections": [
    {
      "key": "overview|trend|byDeviceType|borrowerInsights",
      "title": "string",
      "summary": "string",
      "bullets": ["string"],
      "chartHint": "string"
    }
  ],
  "risks": [
    { "level": "high|medium|low", "title": "string", "detail": "string" }
  ],
  "actions": [{ "priority": "p0|p1|p2", "owner": "string", "action": "string" }]
}
```

关键约束：

- KPI 数值必须来自聚合结果（不可由模型自由编造）
- `sections.key` 固定枚举，避免前端模板分支膨胀
- `chartHint` 只传“图建议”，图数据由前端根据快照计算

## 6. 口径与聚合规则

周时间窗：

- 固定最近 7 天（含当日），不接收前端自定义时间范围
- 时区以请求端配置为准，统一转 UTC 存储比较

核心指标口径：

- `borrowTotal`：周期内借出记录数（`borrow_time` in range）
- `returnTotal`：周期内归还记录数（`actual_return_time` in range）
- `overdueTotal`：统计时点未归还且 `return_deadline < now`
- `overdueRate`：`overdueTotal / borrowTotal`（borrowTotal=0 时为 0）
- `activeBorrowerCount`：周期内去重借用人数量
- `avgBorrowDurationHours`：已归还记录平均借用时长（小时）

## 6.1 历史查询持久化模型

新增表建议：`report_queries`

字段建议：

- `id`：主键
- `reportType`：固定 `weekly`
- `periodStart` / `periodEnd`：本次统计窗口
- `generatedAt`：生成时间
- `kpiSnapshot`：关键 KPI 快照（JSON）
- `reportJson`：完整结构化报告（JSON）
- `model`：模型标识
- `status`：`success|fallback|failed`
- `errorMessage`：失败信息（可空）

说明：

- “每次查询都入库”指每次用户点击生成，都落一条记录。
- 历史重渲染直接读取 `reportJson`，不再二次请求模型，保证可追溯与可复现。

## 7. 项目具体落点（文件级）

### 7.1 Shared

新增目录：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/shared/src/report/`

建议文件：

- `types.ts`
- `schema.ts`
- `aggregator.ts`
- `prompt.ts`
- `generateWeeklyReport.ts`

数据库 schema 扩展：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/shared/src/db/schema.ts`
- `/Users/ningshuo/code/my-projects/equipment-system/packages/shared/src/db/sqlite-schema.ts`

导出入口更新：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/shared/src/index.ts`

### 7.2 Web

新增 API：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/api/reports/weekly/route.ts`
- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/api/reports/weekly/history/route.ts`
- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/api/reports/weekly/[id]/route.ts`

新增页面：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/(main)/reports/weekly/page.tsx`
- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/(main)/reports/history/page.tsx`

菜单接入：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/app/(main)/layout.tsx`

服务层扩展：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/web/src/services/WebDataService.ts`

### 7.3 Electron

新增 IPC：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/electron-app/src/main/ipc/report.ts`

注册入口：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/electron-app/src/main/ipc/index.ts`

preload 白名单：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/electron-app/src/preload.ts`

renderer 服务扩展：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/electron-app/src/renderer/services/ElectronDataService.ts`

页面路由接入（复用 UI 页面）：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/electron-app/src/renderer/App.tsx`

### 7.4 UI 层（可复用）

建议新增共享页面组件，减少双端重复：

- `/Users/ningshuo/code/my-projects/equipment-system/packages/ui/src/legacy/pages/WeeklyReport/index.tsx`

## 8. AI 调用与安全策略

环境变量：

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_TIMEOUT_MS`（可选）

安全原则：

- API Key 仅在服务端（Next API / Electron main）使用
- renderer 与浏览器端不接触密钥
- Prompt 中仅传业务字段，不传敏感认证信息

## 9. 错误处理与降级策略

错误分类：

- `INSUFFICIENT_DATA`：周期数据为空或过少
- `LLM_REQUEST_FAILED`：网络/鉴权/超时/限流
- `SCHEMA_INVALID`：返回 JSON 不合规
- `FACT_MISMATCH`：关键数字与锁定事实不一致

处理流程：

1. 首次生成失败 -> 降温重试 1 次
2. 再失败 -> 输出“降级结构化报告”（由模板+聚合数据生成），并同样入库
3. 若最终失败（无可用降级数据）-> 仍写失败记录（`status=failed`）
4. 前端始终可查看历史记录状态，成功与降级记录均可打印

## 10. 前端渲染与打印

渲染要求：

- 使用固定模板渲染 `meta/kpis/sections/risks/actions`
- 图表按 `chartHint` 与聚合快照渲染
- 显示“生成时间、统计周期、数据量、模型版本”
- 提供“历史查询记录”列表（时间、状态、模型、核心 KPI）
- 点击历史记录可直接重渲染并打印

打印要求：

- `window.print()` + `@media print`
- A4 优化：页边距、分页断点控制、隐藏交互控件
- 支持 Web 浏览器打印与 Electron 打印

## 11. 测试策略

单元测试：

- `aggregator` 口径测试（借出/归还/逾期/平均时长/TopN）

合约测试：

- Schema 校验通过/失败样本
- 一致性校验失败样本
- 历史记录 JSON 反序列化与渲染兼容性

集成测试：

- Web API 生成 + 入库 + 历史读取主流程
- Electron IPC 生成 + 入库 + 历史读取主流程
- 同输入下双端输出结构一致

## 12. 分阶段上线

Phase 1（建议 1 周）：

- 手动生成周报
- 每次生成自动入库
- 历史列表与历史重渲染打印
- 页面渲染与打印
- 双端可用

Phase 2：

- 历史对比（可选）
- 导出 PDF（可选）
- 历史查询检索（可选）

## 13. 实施清单（可执行）

1. 创建 shared `report` 核心模块
2. 增加 `report_queries` 表（PG + SQLite）及迁移
3. Web API 与 Electron IPC 接入共享模块（生成/历史/详情）
4. 扩展双端 DataService 能力
5. 新增共享 UI 报表页与历史页并挂载菜单
6. 增加打印样式与打印按钮
7. 完成口径/合约/集成测试
8. 配置环境变量并灰度上线

---

该设计已按以下确认项收敛：  
`Web + Electron 同步`、`云端大模型 API`、`严格 JSON Schema`、`固定近一周无筛选`、`每次查询持久化并支持历史重渲染打印`、`方案 A`。
