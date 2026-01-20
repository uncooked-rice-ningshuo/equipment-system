# Dashboard Charts Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement real-time updates for dashboard charts (Device Type Distribution, Borrow Trends, Due Soon Timeline) with error handling and loading states.

**Architecture:** Event-driven pub/sub pattern using EventBus for cross-component communication. Charts subscribe to data change events and auto-refresh. Backend emits events after successful mutations. Loading states and error handling improve UX.

**Tech Stack:** React 18, TypeScript, ECharts, Ant Design, Electron IPC, SQLite, lodash

## Prerequisites

**Install Dependencies:**

```bash
pnpm add lodash
pnpm add -D @types/lodash
```

---

### Task 1: Create EventBus Utility

**Files:**

- Create: `src/utils/eventBus.ts`

**Step 1: Write EventBus class**

```typescript
class EventBus {
  private events: Map<string, Set<Function>> = new Map();

  subscribe(event: string, callback: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        // Clean up empty event sets
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
```

**Step 2: Test EventBus works**

Run: `npm run dev:web` Check: No TypeScript errors in src/utils/eventBus.ts

**Step 3: Commit**

```bash
git add src/utils/eventBus.ts
git commit -m "feat: create EventBus utility for pub/sub pattern"
```

---

### Task 2: Create UI Components

**Files:**

- Create: `src/components/ChartSkeleton.tsx`
- Create: `src/components/ChartError.tsx`

**Step 1: Write ChartSkeleton component**

```typescript
import { Spin } from 'antd';

interface ChartSkeletonProps {
  height?: number;
}

export default function ChartSkeleton({ height = 320 }: ChartSkeletonProps) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" tip="加载中..." />
    </div>
  );
}
```

**Step 2: Write ChartError component**

```typescript
import { Alert, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ChartErrorProps {
  message: string;
  onRetry: () => void;
}

export default function ChartError({ message, onRetry }: ChartErrorProps) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <ExclamationCircleOutlined
        style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}
      />
      <Alert
        message="加载失败"
        description={message}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={onRetry}>
            重试
          </Button>
        }
      />
    </div>
  );
}
```

**Step 3: Verify no TypeScript errors**

Run `npm run dev:web` and check for compilation errors

**Step 4: Commit**

```bash
git add src/components/ChartSkeleton.tsx src/components/ChartError.tsx
git commit -m "feat: add ChartSkeleton and ChartError components"
```

---

### Task 3: Add Database Indexes

**Files:**

- Modify: `electron/services/database.js`

**Step 1: Add indexes to initializeDatabase function**

Find the `initializeDatabase()` function in `electron/services/database.js` and add these indexes after table creation:

```javascript
// Add after table creation statements
runStmt(
  db,
  'CREATE INDEX IF NOT EXISTS idx_borrow_device ON borrow_records(device_id)',
);
runStmt(
  db,
  'CREATE INDEX IF NOT EXISTS idx_borrow_time ON borrow_records(borrow_time)',
);
runStmt(
  db,
  'CREATE INDEX IF NOT EXISTS idx_borrow_deadline ON borrow_records(return_deadline)',
);
```

**Step 2: Test database initialization**

Run: `npm run dev` Check: No SQLite errors in console

**Step 3: Commit**

```bash
git add electron/services/database.js
git commit -m "perf: add database indexes for better query performance"
```

---

### Task 4: Update IPC Service with Event Emission

**Files:**

- Modify: `src/services/ipc.ts`

**Step 1: Add import for eventBus and lodash**

```typescript
import { eventBus } from '@/utils/eventBus';
import { debounce } from 'lodash';
```

**Step 2: Create invokeWithEvent wrapper**

Add after existing imports:

```typescript
const EVENT_MAP: Record<string, string> = {
  'borrow:create': 'device:borrowed',
  'borrow:return': 'device:returned',
  'device:create': 'device:added',
  'device:update': 'device:updated',
  'device:delete': 'device:deleted',
};

export const invokeWithEvent = async (channel: string, ...args: any[]) => {
  const result = await invoke(channel, ...args);

  if (EVENT_MAP[channel]) {
    eventBus.emit(EVENT_MAP[channel], result);
  }

  return result;
};
```

**Step 3: Verify TypeScript compilation**

Run: `npm run dev:web`

**Step 4: Commit**

```bash
git add src/services/ipc.ts
git commit -m "feat: add invokeWithEvent wrapper for event emission"
```

---

### Task 5: Enhance DeviceTypeChart Component

**Files:**

- Modify: `src/pages/Dashboard/components/DeviceTypeChart.tsx`

**Step 1: Add imports and state**

Replace imports section with:

```typescript
import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { eventBus } from '@/utils/eventBus';
import { Card, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import { debounce } from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import ChartSkeleton from '@/components/ChartSkeleton';
import ChartError from '@/components/ChartError';
```

**Step 2: Add loading and error state**

Add after existing state variables:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Step 3: Update load function with error handling**

Replace the existing `load` function with:

```typescript
const load = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await invoke('stats:deviceTypeDistribution');
    setData(result || []);
  } catch (err: any) {
    setError(err.message || '加载设备类型分布失败');
  } finally {
    setLoading(false);
  }
};
```

**Step 4: Add debounced load and event subscriptions**

Add after the `load` function:

```typescript
const debouncedLoad = useMemo(() => debounce(load, 300), []);

useEffect(() => {
  load();

  const unsub1 = eventBus.subscribe('device:added', debouncedLoad);
  const unsub2 = eventBus.subscribe('device:updated', debouncedLoad);
  const unsub3 = eventBus.subscribe('device:deleted', debouncedLoad);

  return () => {
    unsub1();
    unsub2();
    unsub3();
    debouncedLoad.cancel();
  };
}, []);
```

**Step 5: Update return statement with loading/error states**

Replace the empty state check with:

```typescript
if (loading) {
  return (
    <ChartCard $theme={theme} title="设备类型分布">
      <ChartSkeleton />
    </ChartCard>
  );
}

if (error) {
  return (
    <ChartCard $theme={theme} title="设备类型分布">
      <ChartError message={error} onRetry={load} />
    </ChartCard>
  );
}

if (data.length === 0) {
  return (
    <ChartCard $theme={theme} title="设备类型分布">
      <Empty description="暂无数据" />
    </ChartCard>
  );
}
```

**Step 6: Verify component compiles**

Run: `npm run dev:web`

**Step 7: Commit**

```bash
git add src/pages/Dashboard/components/DeviceTypeChart.tsx
git commit -m "feat: enhance DeviceTypeChart with real-time updates"
```

---

### Task 6: Enhance BorrowTrendsChart Component

**Files:**

- Modify: `src/pages/Dashboard/components/BorrowTrendsChart.tsx`

**Step 1: Add imports**

Replace imports with:

```typescript
import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { eventBus } from '@/utils/eventBus';
import { Card, Empty, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import { debounce } from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import ChartSkeleton from '@/components/ChartSkeleton';
import ChartError from '@/components/ChartError';
```

**Step 2: Add loading and error state**

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Step 3: Update load function**

```typescript
const load = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await invoke('stats:borrowedByType', period);
    setData(result || []);
  } catch (err: any) {
    setError(err.message || '加载借用统计失败');
  } finally {
    setLoading(false);
  }
};
```

**Step 4: Add debounced load and event subscriptions**

Add after `load` function:

```typescript
const debouncedLoad = useMemo(() => debounce(load, 300), [period]);

useEffect(() => {
  load();

  const unsub1 = eventBus.subscribe('device:borrowed', debouncedLoad);
  const unsub2 = eventBus.subscribe('device:returned', debouncedLoad);

  return () => {
    unsub1();
    unsub2();
    debouncedLoad.cancel();
  };
}, [period]);
```

**Step 5: Update return statement**

Replace empty state check with:

```typescript
if (loading) {
  return (
    <ChartCard $theme={theme} title="借用统计">
      <StyledTabs
        $theme={theme}
        activeKey={period}
        onChange={(key) => setPeriod(key as 'week' | 'month' | 'year')}
        items={[
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
          { key: 'year', label: '本年' },
        ]}
      />
      <ChartSkeleton />
    </ChartCard>
  );
}

if (error) {
  return (
    <ChartCard $theme={theme} title="借用统计">
      <StyledTabs
        $theme={={theme}
        activeKey={period}
        onChange={(key) => setPeriod(key as 'week' | 'month' | 'year')}
        items={[
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
          { key: 'year', label: '本年' },
        ]}
      />
      <ChartError message={error} onRetry={load} />
    </ChartCard>
  );
}

if (data.length === 0) {
  return (
    <ChartCard $theme={theme} title="借用统计">
      <StyledTabs
        $theme={theme}
        activeKey={period}
        onChange={(key) => setPeriod(key as 'week' | 'month' | 'year')}
        items={[
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
          { key: 'year', label: '本年' },
        ]}
      />
      <Empty description="暂无数据" />
    </ChartCard>
  );
}
```

**Step 6: Verify compiles**

Run: `npm run dev:web`

**Step 7: Commit**

```bash
git add src/pages/Dashboard/components/BorrowTrendsChart.tsx
git commit -m "feat: enhance BorrowTrendsChart with real-time updates"
```

---

### Task 7: Enhance DueSoonTimeline Component

**Files:**

- Modify: `src/pages/Dashboard/components/DueSoonTimeline.tsx`

**Step 1: Add imports**

Replace imports with:

```typescript
import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { eventBus } from '@/utils/eventBus';
import { ClockCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Row, Space, Tag, Timeline } from 'antd';
import { debounce } from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import ChartSkeleton from '@/components/ChartSkeleton';
import ChartError from '@/components/ChartError';
```

**Step 2: Update load function**

Replace existing `load` function with:

```typescript
const load = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await invoke('borrow:dueSoon7days');
    setData(result || []);
  } catch (err: any) {
    setError(err.message || '加载归还倒计时失败');
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Add error state and event subscriptions**

After `loading` state, add:

```typescript
const [error, setError] = useState<string | null>(null);

const debouncedLoad = useMemo(() => debounce(load, 300), []);

useEffect(() => {
  load();

  const unsub1 = eventBus.subscribe('device:borrowed', debouncedLoad);
  const unsub2 = eventBus.subscribe('device:returned', debouncedLoad);

  return () => {
    unsub1();
    unsub2();
    debouncedLoad.cancel();
  };
}, []);
```

**Step 4: Update return statement**

Replace empty state check with:

```typescript
if (loading) {
  return (
    <TimelineCard $theme={theme} title="归还倒计时">
      <ChartSkeleton />
    </TimelineCard>
  );
}

if (error) {
  return (
    <TimelineCard $theme={theme} title="归还倒计时">
      <ChartError message={error} onRetry={load} />
    </TimelineCard>
  );
}

if (!loading && data.length === 0) {
  return (
    <TimelineCard $theme={theme} title="归还倒计时">
      <Empty description="暂无待归还设备" />
    </TimelineCard>
  );
}
```

**Step 5: Verify compiles**

Run: `npm run dev:web`

**Step 6: Commit Commit**

```bash
git add src/pages/Dashboard/components/DueSoonTimeline.tsx
git commit -m "feat: enhance DueSoonTimeline with real-time updates"
```

---

### Task 8: Update Dashboard Main Component

**Files:**

- Modify: `src/pages/Dashboard/index.tsx`

**Step 1: Add eventBus import**

```typescript
import { eventBus } from '@/utils/eventBus';
```

**Step 2: Update load functions to emit events**

Find the load and loadReminders functions. After successful IPC calls, emit events.

```typescript
const load = async () => {
  const data = await invoke('stats:dashboard');
  setStats(data);
  eventBus.emit('dashboard:updated', data);
};

const loadReminders = async () => {
  const data = await invoke('borrow:listOverdue');
  setOverdue(data?.overdue || []);
  setDueSoon(data?.dueSoon || []);
  setVisible(true);
  eventBus.emit('reminders:loaded', data);
};
```

**Step 3: Verify compiles**

Run: `npm run dev:web`

**Step 4: Commit**

```bash
git add src/pages/Dashboard/index.tsx
git commit -m "feat: update Dashboard to emit events"
```

---

### Task 9: Update Borrow Page to Emit Events

**Files:**

- Modify: `src/pages/Borrow/index.tsx`

**Step 1: Add invokeWithEvent import**

Replace invoke import with:

```typescript
import { invoke, invokeWithEvent } from '@/services/ipc';
```

**Step 2: Find borrow device creation call**

Search for where devices are borrowed (likely in a handleSubmit or handleBorrow function). Replace `invoke('borrow:create', ...)` with `invokeWithEvent('borrow:create', ...)`

**Step 3: Find return device call**

Search for where devices are returned. Replace `invoke('borrow:return', ...)` with `invokeWithEvent('borrow:return', ...)`

**Step 4: Test borrowing and returning**

Run: `npm run dev` Perform borrow and return operations, verify charts update

**Step 5: Commit**

```bash
git add src/pages/Borrow/index.tsx
git commit -m "feat: use invokeWithEvent in Borrow page"
```

---

### Task 10: Update Devices Page to Emit Events

**Files:**

- Modify: `src/pages/Devices/index.tsx`

**Step 1: Add invokeWithEvent import**

```typescript
import { invoke, invokeWithEvent } from '@/services/ipc';
```

**Step 2: Find device creation**

Replace `invoke('device:create', ...)` with `invokeWithEvent('device:create', ...)`

**Step 3: Find device update**

Replace `invoke('device:update', ...)` with `invokeWithEvent('device:update', ...)`

**Step 4: Find device delete**

Replace `invoke('device:delete', ...)` with `invokeWithEvent('device:delete', ...)`

**Step 5: Test CRUD operations**

Run: `npm run dev` Create, edit, and delete devices, verify DeviceTypeChart updates

**Step 6: Commit**

```bash
git add src/pages/Devices/index.tsx
git commit -m "feat: use invokeWithEvent in Devices page"
```

---

### Task 11: Manual Testing

**Step 1: Test Device Type Chart**

1. Open the application
2. Navigate to Dashboard
3. Add a new device in Devices page
4. Verify DeviceTypeChart updates automatically
5. Edit a device
6. Verify chart updates
7. Delete a device
8. Verify chart updates

**Step 2: Test Borrow Trends Chart**

1. Borrow a device
2. Verify BorrowTrendsChart shows updated count
3. Return a device
4. Verify chart updates
5. Switch between week/month/year tabs
6. Verify data changes correctly

**Step 3: Test Due Soon Timeline**

1. Borrow a device with due date within 7 days
2. Verify it appears in Due Soon Timeline
3. Return the device
4. Verify it disappears from timeline

**Step 4: Test Loading States**

1. Open Network tab in DevTools
2. Throttle network to "Slow 3G"
3. Refresh dashboard
4. Verify loading spinners appear on all charts
5. Verify charts load successfully

**Step 5: Test Error Handling**

1. Temporarily break the stats:deviceTypeDistribution endpoint
2. Refresh dashboard
3. Verify error message displays
4. Click retry button
5. Fix the endpoint
6. Verify retry works

**Step 6: Document test results**

Create `docs/plans/test-results-dashboard-charts.md` with pass/fail status for each test

**Step 7: Commit test results**

```bash
git add docs/plans/test-results-dashboard-charts.md
git commit -m "test: document manual testing results"
```

---

### Task 12: Update Documentation

**Files:**

- Modify: `项目文档.md`

**Step 1: Update v1.1.0 section**

Find the v1.1.0 section and update:

```markdown
#### v1.1.0 - 功能完善

- [x] 首页看板模块（图表展示 - 实时更新已实现）
- [x] 借出设备记录（归还操作）
- [x] 已还设备记录（归还时间范围筛选）
- [x] 设备管理模块（编辑功能）
- [x] 设备管理模块（批量导入）
- [x] 设备管理模块（删除二次确认）
- [x] 图表实时更新功能
- [x] 加载状态优化
- [x] 错误处理与重试
```

**Step 2: Add new feature description**

Add to functionality section:

```markdown
### 图表实时更新 (v1.1.0 新增)

**功能描述**: Dashboard 中的图表（设备类型分布、借用统计、归还倒计时）支持实时更新，无需刷新页面。

**实现方式**:

- 基于 EventBus 的发布-订阅模式
- 前端组件订阅数据变化事件
- 数据操作完成后自动触发事件
- 图表自动刷新显示最新数据

**事件类型**:

- `device:borrowed` - 设备借出时触发
- `device:returned` - 设备归还时触发
- `device:added` - 新增设备时触发
- `device:updated` - 编辑设备时触发
- `device:deleted` - 删除设备时触发

**性能优化**:

- 使用防抖机制避免频繁刷新
- 数据库索引优化查询性能
- 事件订阅自动清理防止内存泄漏
```

**Step 3: Commit documentation**

```bash
git add 项目文档.md
git commit -m "docs: update project documentation for v1.1.0"
```

---

### Task 13: Final Code Review and Cleanup

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors

**Step 2: Run linter**

```bash
npm run lint
```

Fix any linting errors

**Step 3: Test all functionality**

Perform comprehensive end-to-end testing

**Step 4: Remove debug logs**

Remove console.log statements added during development

**Step 5: Final commit**

```bash
git add .
git commit -m "refactor: final cleanup and code review for dashboard charts enhancement"
```

---

## Summary

This implementation plan adds real-time updates to all three dashboard charts through an event-driven architecture. Key components include:

1. **EventBus** - Pub/sub utility for cross-component communication
2. **UI Components** - Skeleton and Error components for better UX
3. **Database Optimization** - Indexes for improved query performance
4. **IPC Enhancement** - Event emission wrapper for data mutations
5. **Chart Enhancements** - Loading states, error handling, event subscriptions
6. **Page Updates** - Integration with invokeWithEvent for automatic events

**Total Estimated Time:** 2-3 hours **Total Commits:** 13 **Files Modified:** 7 **Files Created:** 4
