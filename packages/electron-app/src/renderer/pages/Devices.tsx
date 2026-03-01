import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { Device } from '@equipment/shared';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { ipc } from '../utils/ipc';

const { Option } = Select;

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();

  const loadDevices = async () => {
    setLoading(true);
    try {
      const result = await ipc.devices.getAll();
      setDevices(result.data);
    } catch (error) {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue(device);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await ipc.devices.delete(id);
      message.success('删除成功');
      loadDevices();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDevice) {
        await ipc.devices.update(editingDevice.id, values);
        message.success('更新成功');
      } else {
        await ipc.devices.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadDevices();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '型号', dataIndex: 'model' },
    { title: '序列号', dataIndex: 'serialNumber' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'available'
              ? 'green'
              : status === 'borrowed'
              ? 'blue'
              : 'orange'
          }
        >
          {status === 'available'
            ? '可借'
            : status === 'borrowed'
            ? '借出中'
            : '维修中'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确认删除"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2>设备管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加设备
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={devices}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input />
          </Form.Item>
          <Form.Item name="serialNumber" label="序列号">
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="available">
            <Select>
              <Option value="available">可借</Option>
              <Option value="maintenance">维修中</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
