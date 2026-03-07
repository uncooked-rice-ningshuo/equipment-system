'use client';

import type { IDataService } from '@equipment/shared';
import { Button, Divider, Input, Select, Space, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';

type DeviceTypeService = Pick<
  IDataService,
  'getDeviceTypes' | 'createDeviceType'
>;

export interface DeviceTypeSelectProps {
  dataService: DeviceTypeService;
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

export default function DeviceTypeSelect({
  dataService,
  value,
  onChange,
  placeholder,
  allowClear,
  disabled,
}: DeviceTypeSelectProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    if (!dataService.getDeviceTypes) return;
    setLoading(true);
    try {
      const res = await dataService.getDeviceTypes({
        pagination: { page: 1, pageSize: 1000 },
      });
      setItems((res.data || []).map((t) => t.name).filter(Boolean));
    } catch (e: any) {
      message.error(e?.message || '获取设备类型失败');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const options = useMemo(() => {
    const set = new Set<string>();
    for (const name of items) {
      const n = typeof name === 'string' ? name.trim() : '';
      if (n) set.add(n);
    }
    const current = typeof value === 'string' ? value.trim() : '';
    if (current) set.add(current);
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
      .map((name) => ({ label: name, value: name }));
  }, [items, value]);

  const addItem = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;

    if (options.some((o) => o.value.trim() === name)) {
      message.info('该类型已存在');
      onChange?.(name);
      setNewName('');
      return;
    }

    if (!dataService.createDeviceType) {
      message.error('当前数据服务不支持新增设备类型');
      return;
    }

    setCreating(true);
    try {
      await dataService.createDeviceType({ name });
      onChange?.(name);
      setNewName('');
      await refresh();
      message.success('设备类型已添加');
    } catch (e: any) {
      message.error(e?.message || '新增设备类型失败');
    } finally {
      setCreating(false);
    }
  }, [dataService, newName, onChange, options, refresh]);

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      showSearch
      optionFilterProp="label"
      options={options}
      onDropdownVisibleChange={(open) => {
        if (open) refresh();
      }}
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Space style={{ padding: '0 8px 8px' }}>
            <Input
              value={newName}
              placeholder="新增设备类型"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <Button
              type="primary"
              onClick={addItem}
              loading={creating}
              disabled={!newName.trim()}
            >
              新增
            </Button>
          </Space>
        </>
      )}
    />
  );
}
