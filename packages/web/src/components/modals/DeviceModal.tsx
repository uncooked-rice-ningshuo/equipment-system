'use client';

import { dataService } from '@/services';
import type { Device, IDataService, NewDevice } from '@equipment/shared';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Option } = Select;

function DeviceTypeSelect({
  dataService,
  value,
  onChange,
  placeholder,
  allowClear,
  disabled,
}: {
  dataService: IDataService;
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}) {
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

interface DeviceModalProps {
  open: boolean;
  device?: Device | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeviceModal({
  open,
  device,
  onClose,
  onSuccess,
}: DeviceModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!device;

  useEffect(() => {
    if (open && device) {
      form.setFieldsValue({
        code: device.code,
        name: device.name,
        type: device.type,
        brand: device.brand,
        model: device.model,
        price: device.price,
        location: device.location,
        status: device.status,
      });
    } else {
      form.resetFields();
    }
  }, [open, device, form]);

  const handleSubmit = async (values: NewDevice) => {
    setLoading(true);
    try {
      if (isEdit && device) {
        await dataService.updateDevice(device.id, values);
        message.success('设备更新成功');
      } else {
        await dataService.createDevice(values);
        message.success('设备创建成功');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑设备' : '新增设备'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="设备编号"
          name="code"
          rules={[{ required: true, message: '请输入设备编号' }]}
        >
          <Input placeholder="如: PC-001" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          label="设备名称"
          name="name"
          rules={[{ required: true, message: '请输入设备名称' }]}
        >
          <Input placeholder="如: 笔记本电脑" />
        </Form.Item>

        <Form.Item label="类型" name="type">
          <DeviceTypeSelect
            dataService={dataService}
            placeholder="选择设备类型"
            allowClear
          />
        </Form.Item>

        <Form.Item label="品牌" name="brand">
          <Input placeholder="如: Apple, Dell, HP" />
        </Form.Item>

        <Form.Item label="型号" name="model">
          <Input placeholder="如: MacBook Pro 16" />
        </Form.Item>

        <Form.Item label="价格" name="price">
          <InputNumber
            style={{ width: '100%' }}
            placeholder="设备价格"
            min={0}
            precision={2}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item label="存放位置" name="location">
          <Input placeholder="如: 实验室 A 栋 301" />
        </Form.Item>

        {isEdit && (
          <Form.Item label="状态" name="status">
            <Select placeholder="选择设备状态">
              <Option value="available">可用</Option>
              <Option value="borrowed">已借出</Option>
              <Option value="maintenance">维修中</Option>
              <Option value="scrap">已报废</Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
