# Dashboard Charts Enhancement Design

**Project:** Equipment Borrowing Management System  
**Feature:** Dashboard Charts Enhancement  
**Version:** v1.1.0  
**Date:** 2026-01-20

## Overview

Enhance the three dashboard charts (Device Type Distribution, Borrow Trends, Due Soon Timeline) to support real-time updates when data changes in the system. Add proper error handling, loading states, and improve user experience.

## Problem Statement

**Current Issues:**

1. Charts load data only on mount - don't refresh when devices are borrowed/returned
2. No loading state indicators during data fetching
3. No error handling for failed API calls
4. Changes in other parts of the app don't reflect in dashboard
5. Missing manual refresh capability

**User Impact:**

- Teachers must manually refresh the page to see updated statistics
- Confusion when dashboard shows stale data
- No feedback during loading or errors
- Poor UX for real-time monitoring

## Solution Architecture

### Event Bus Pattern

Implement a publish-subscribe system for cross-component communication:

**Event Types:**

- `device:borrowed` - Emitted when a device is borrowed
- `device:returned` - Emitted when a device is returned
- `device:added` - Emitted when a new device is created
- `device:updated` - Emitted when a device is modified
- `device:deleted` - Emitted when a device is deleted

**EventBus Class:**

```typescript
class EventBus {
  private events: Map<string, Set<Function>> = new Map();

  subscribe(event: string, callback: Function): () => void;
  emit(event: string, data?: any): void;
}
```

### Component Subscription Model

Each chart subscribes to relevant events and auto-refreshes:

**DeviceTypeChart**:

- Subscribes to: `device:added`, `device:updated`, `device:deleted`
- Refreshes entire distribution on any device change

**BorrowTrendsChart**:

- Subscribes to: `device:borrowed`, `device:returned`
- Refreshes borrow statistics on borrow/return operations

**DueSoonTimeline**:

- Subscribes to: `device:borrowed`, `device:returned`
- Refreshes due soon list on borrow/return operations

## Technical Design

### 1. Event Bus Implementation

**File:** `src/utils/eventBus.ts`

```typescript
class EventBus {
  private events: Map<string, Set<Function>> = new Map();

  subscribe(event: string, callback: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    return () => this.events.get(event)!.delete(callback);
  }

  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

export const eventBus = new EventBus();
```

### 2. IPC Service Enhancement

**File:** `src/services/ipc.ts`

Wrap IPC calls to emit events on successful operations:

```typescript
export const invokeWithEvent = async (channel: string, ...args: any[]) => {
  const result = await invoke(channel, ...args);

  const eventMap = {
    'borrow:create': 'device:borrowed',
    'borrow:return': 'device:returned',
    'device:create': 'device:added',
    'device:update': 'device:updated',
    'device:delete': 'device:deleted',
  };

  if (eventMap[channel]) {
    eventBus.emit(eventMap[channel], result);
  }

  return result;
};
```

### 3. Backend Modifications

**File:** `electron/main.js`

**Database Indexes:**

```javascript
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

**Mutation Endpoints:** Ensure all return complete data objects for event payload.

### 4. Loading States

**Chart Skeleton Component:**

```typescript
const ChartSkeleton = () => (
  <div
    style={{
      height: 320,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Spin size="large" />
  </div>
);
```

**Each Chart Component:**

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const load = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await invoke('stats:deviceTypeDistribution');
    setData(result || []);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

if (loading) return <ChartSkeleton />;
if (error) return <ChartError message={error} onRetry={load} />;
```

### 5. Error Handling

**Error Component:**

```typescript
const ChartError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
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
```

### 6. Debouncing Strategy

Prevent excessive refreshes during rapid operations:

```typescript
import { debounce } from 'lodash';

const debouncedLoad = useMemo(() => debounce(load, 300), []);
```

### 7. Chart Enhancements

**DeviceTypeChart Pattern:**

```typescript
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

**BorrowTrendsChart Pattern:**

```typescript
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

**DueSoonTimeline Pattern:**

```typescript
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

## Implementation Timeline

### Phase 1: Foundation (Day 1-2)

- [ ] Create EventBus class in `src/utils/eventBus.ts`
- [ ] Write unit tests for EventBus
- [ ] Create `ChartSkeleton` component
- [ ] Create `ChartError` component
- [ ] Add lodash to dependencies

### Phase 2: Backend Integration (Day 2-3)

- [ ] Add database indexes to `electron/services/database.js`
- [ ] Review and update mutation endpoints to return complete data
- [ ] Update `src/services/ipc.ts` with event emission wrapper
- [ ] Test IPC → event flow manually

### Phase 3: Chart Enhancements (Day 3-4)

- [ ] Update `DeviceTypeChart.tsx` with loading/error states
- [ ] Add event subscriptions to `DeviceTypeChart.tsx`
- [ ] Update `BorrowTrendsChart.tsx` with loading/error states
- [ ] Add event subscriptions to `BorrowTrendsChart.tsx`
- [ ] Update `DueSoonTimeline.tsx` with loading/error states
- [ ] Add event subscriptions to `DueSoonTimeline.tsx`
- [ ] Test each chart independently

### Phase 4: Integration Testing (Day 4-5)

- [ ] Test cross-borrow → charts update
- [ ] Test cross-return → charts update
- [ ] Test cross-add device → DeviceTypeChart updates
- [ ] Test cross-edit device → DeviceTypeChart updates
- [ ] Test cross-delete device → DeviceTypeChart updates
- [ ] Verify debouncing with rapid operations
- [ ] Test error scenarios with retry
- [ ] Test empty database states
- [ ] Performance test with 100+ devices

### Phase 5: Polish (Day 5)

- [ ] Add smooth loading animations
- [ ] Write integration tests
- [ ] Update project documentation
- [ ] Code review
- [ ] Final manual testing

## Success Criteria

### Functional Requirements

✅ All charts auto-refresh on relevant data changes ✅ Loading states display smoothly during data fetch ✅ Errors handled gracefully with retry functionality ✅ Event subscriptions clean up properly on unmount ✅ No memory leaks during component lifecycle

### Performance Requirements

✅ Debouncing prevents excessive refreshes ✅ Database indexes improve query performance ✅ No noticeable lag with 100+ devices ✅ Event overhead is minimal (<1ms per emit)

### User Experience Requirements

✅ Visual feedback for all states (loading, error, empty) ✅ Smooth transitions between states ✅ Retry button works correctly ✅ Empty states are informative ✅ Charts respond to user actions immediately

## Testing Strategy

### Unit Tests

- [ ] EventBus subscribe/unsubscribe
- [ ] EventBus emit with multiple subscribers
- [ ] EventBus cleanup on unsubscribe

### Integration Tests

- [ ] Borrow device → All charts update
- [ ] Return device → All charts update
- [ ] Add device → DeviceTypeChart updates
- [ ] Edit device → DeviceTypeChart updates
- [ ] Delete device → DeviceTypeChart updates
- [ ] Error state with retry works

### Manual Testing Checklist

- [ ] Device type chart shows correct distribution
- [ ] Borrow trends chart shows correct statistics
- [ ] Due soon timeline shows correct items
- [ ] Charts update without page refresh
- [ ] Loading spinner appears and disappears
- [ ] Error message shows on failure
- [ ] Retry button reloads data successfully
- [ ] Empty states display correctly
- [ ] Theme switching works properly

## Risks & Mitigations

### Risk 1: Event Storm

**Issue:** Rapid operations cause excessive chart re-renders **Mitigation:** Implement debouncing (300ms) on all chart refresh functions

### Risk 2: Memory Leaks

**Issue:** Event subscriptions not cleaned up **Mitigation:** Ensure all useEffect cleanup functions unsubscribe from events

### Risk 3: Performance Degradation

**Issue:** Many subscribers slow down event emission **Mitigation:** Use Set data structure for O(1) add/delete operations

### Risk 4: Race Conditions

**Issue:** Multiple rapid data updates cause inconsistent state **Mitigation:** Debouncing combined with React's rendering cycle prevents this

## Dependencies

**New Packages:**

- `lodash` - For debounce utility

**Existing Packages Used:**

- `echarts-for-react` - Chart rendering
- `antd` - UI components (Spin, Alert, Button)
- `react` - Hooks and lifecycle management

## Code Standards

**TypeScript:**

- Strict mode enabled
- All functions typed
- Event callbacks properly typed

**React:**

- Functional components with hooks
- Proper cleanup in useEffect
- useMemo/useCallback for performance

**Naming:**

- Events use `resource:action` pattern (e.g., `device:borrowed`)
- Functions use camelCase
- Components use PascalCase

## Documentation Updates

**To Update:**

- `项目文档.md` - Add v1.1.0 dashboard enhancements
- `设备借还管理系统 V1.0 开发文档.md` - Update architecture section
- `README.md` - Add real-time updates feature description

## Future Enhancements

**Potential Improvements:**

- Add WebSocket support for multi-client scenarios
- Implement data caching for offline support
- Add chart export functionality (PNG/PDF)
- Implement custom date range selectors
- Add drill-down capability on chart click
- Implement real-time push notifications

---

**Design Status:** ✅ Complete  
**Ready for Implementation:** Yes  
**Estimated Effort:** 5 days  
**Complexity:** Medium
