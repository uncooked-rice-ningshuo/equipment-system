'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Device, DeviceStatus, IDataService } from '@equipment/shared';
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { DeviceModal } from '../components/modals';

const { Option } = Select;

const statusMap: Record<DeviceStatus, { text: string; color: string }> = {
  available: { text: '可用', color: 'success' },
  borrowed: { text: '已借出', color: 'processing' },
  maintenance: { text: '维修中', color: 'warning' },
  scrap: { text: '已报废', color: 'default' },
};

export default function DevicesPage({
  dataService,
}: {
  dataService: IDataService;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [filters, setFilters] = useState({
    code: '',
    status: undefined as DeviceStatus | undefined,
  });

  const loadDevices = async () => {
    setLoading(true);
    try {
      const { data } = await dataService.getDevices({
        filters: filters.status ? { status: filters.status } : undefined,
      });
      setDevices(data);
    } catch {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleAdd = () => {
    setCurrentDevice(null);
    setModalOpen(true);
  };

  const handleEdit = (device: Device) => {
    setCurrentDevice(device);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await dataService.deleteDevice(id);
      message.success('设备删除成功');
      loadDevices();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const filteredDevices = devices.filter((device) => {
    if (!filters.code) return true;
    const q = filters.code.toLowerCase();
    return (
      device.code.toLowerCase().includes(q) ||
      device.name.toLowerCase().includes(q)
    );
  });

  const columns = [
    { title: '设备编号', dataIndex: 'code', key: 'code' },
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '存放位置', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeviceStatus) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个设备吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="设备管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增设备
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索设备编号/名称"
            prefix={<SearchOutlined />}
            value={filters.code}
            onChange={(e) => setFilters({ ...filters, code: e.target.value })}
            style={{ width: 250 }}
          />
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="available">可用</Option>
            <Option value="borrowed">已借出</Option>
            <Option value="maintenance">维修中</Option>
            <Option value="scrap">已报废</Option>
          </Select>
          <Button type="primary" onClick={loadDevices}>
            查询
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredDevices}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <DeviceModal
        open={modalOpen}
        device={currentDevice}
        dataService={dataService}
        onClose={() => setModalOpen(false)}
        onSuccess={loadDevices}
      />
    </div>
  );
}
