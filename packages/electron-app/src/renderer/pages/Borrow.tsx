import { PlusOutlined } from '@ant-design/icons';
import type { Device, User } from '@equipment/shared';
import { getUserErrorMessage } from '@equipment/ui/legacy';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  List,
  message,
  Select,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { ipc } from '../utils/ipc';

const { Option } = Select;

export const Borrow: React.FC = () => {
  const [form] = Form.useForm();
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devicesResult, usersResult] = await Promise.all([
        ipc.devices.getAvailable(),
        ipc.users.getAll({ pageSize: 1000 }),
      ]);
      setDevices(devicesResult);
      setUsers(usersResult.data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await ipc.borrows.create({
        deviceId: values.deviceId,
        userId: values.userId,
        borrowDate: values.borrowDate.toDate(),
        expectedReturnDate: values.expectedReturnDate.toDate(),
        notes: values.notes,
      });
      message.success('借出成功');
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(getUserErrorMessage(error, '借出失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>借出设备</h2>
      <Card>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="deviceId"
            label="选择设备"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select placeholder="选择可借设备">
              {devices.map((device) => (
                <Option key={device.id} value={device.id}>
                  {device.name} ({device.model})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="userId"
            label="借用人"
            rules={[{ required: true, message: '请选择借用人' }]}
          >
            <Select placeholder="选择借用人">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="borrowDate"
            label="借出日期"
            rules={[{ required: true }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expectedReturnDate"
            label="预计归还日期"
            rules={[{ required: true }]}
            initialValue={dayjs().add(7, 'day')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
            >
              确认借出
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="可借设备列表" style={{ marginTop: 24 }}>
        <List
          dataSource={devices.slice(0, 5)}
          renderItem={(device) => (
            <List.Item>
              <List.Item.Meta
                title={device.name}
                description={`${device.model} | ${
                  device.serialNumber || '无序列号'
                }`}
              />
              <Tag color="green">可借</Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
