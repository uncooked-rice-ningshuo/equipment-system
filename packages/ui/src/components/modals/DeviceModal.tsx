'use client';

import type { Device, IDataService, NewDevice } from '@equipment/shared';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import DeviceTypeSelect from '../fields/DeviceTypeSelect';

const { Option } = Select;

export interface DeviceModalProps {
  open: boolean;
  device?: Device | null;
  dataService: IDataService;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeviceModal({
  open,
  device,
  dataService,
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
      return;
    }
    if (open) {
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
