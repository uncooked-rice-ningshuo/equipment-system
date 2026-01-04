import { invoke } from '@/services/ipc';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
} from 'antd';
import { useEffect, useState } from 'react';

export default function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async (filters: any = {}) => {
    setLoading(true);
    try {
      const data = await invoke<any[]>('device:list', filters);
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const res = await invoke('device:create', values);
      if (res?.success) {
        message.success('新增设备成功');
        setModalVisible(false);
        form.resetFields();
        loadDevices(filters);
      } else {
        message.error(res?.message || '新增设备失败');
      }
    } catch (error) {
      message.error('新增设备失败');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await invoke('device:delete', id);
    if (result.success) {
      message.success('删除成功');
      loadDevices(filters);
    } else {
      message.error(result.message);
    }
  };

  const handleFilter = (values: any) => {
    const newFilters = {
      type: values.type,
      status: values.status === '' ? undefined : values.status,
      code: values.code,
      brand: values.brand,
    };
    setFilters(newFilters);
    loadDevices(newFilters);
  };

  const handleReset = () => {
    filterForm.resetFields();
    setFilters({});
    loadDevices();
  };

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      ellipsis: true,
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      ellipsis: true,
    },
    {
      title: '设备厂商',
      dataIndex: 'brand',
      key: 'brand',
      width: 150,
      ellipsis: true,
    },
    {
      title: '规格/型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      ellipsis: true,
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      ellipsis: true,
      render: (text: any) => {
        if (typeof text === 'number') {
          return text.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        return text;
      },
    },
    {
      title: '存放地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      ellipsis: true,
      render: (status: string) => {
        const statusMap: any = {
          available: '可用',
          borrowed: '已借出',
          maintenance: '维修中',
          scrap: '已报废',
        };
        const displayStatus = statusMap[status] || status;

        let statusColor = '#52c41a'; // 可用 - 绿色 (Ant Design 成功色)
        if (status === 'borrowed') statusColor = '#6366F1'; // 已借出 - 紫色 (主题主色)
        if (status === 'maintenance') statusColor = '#faad14'; // 维修中 - 黄色 (Ant Design 警告色)
        if (status === 'scrap') statusColor = '#ff4d4f'; // 已报废 - 红色 (Ant Design 错误色)

        return (
          <span style={{ color: statusColor, fontWeight: 500 }}>
            {displayStatus}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '可用', value: 'available' },
    { label: '已借出', value: 'borrowed' },
    { label: '维修中', value: 'maintenance' },
    { label: '已报废', value: 'scrap' },
  ];

  // 设备类型选项，根据Figma原型添加
  const typeOptions = [
    { label: '柜式空调', value: '柜式空调' },
    { label: '数字示波器', value: '数字示波器' },
    { label: '笔记本电脑', value: '笔记本电脑' },
    { label: '服务器', value: '服务器' },
    { label: '打印机', value: '打印机' },
  ];

  return (
    <div>
      {/* 筛选卡片 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleFilter}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'end',
          }}
        >
          <Form.Item name="code" label="设备编号">
            <Input placeholder="请输入设备编号" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="type" label="设备类型">
            <Select
              placeholder="请选择设备类型"
              style={{ width: '100%' }}
              options={typeOptions}
            />
          </Form.Item>

          <Form.Item name="brand" label="设备厂商">
            <Input placeholder="请输入设备厂商" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="status" label="设备状态">
            <Select
              placeholder="请选择设备状态"
              style={{ width: '100%' }}
              options={statusOptions}
            />
          </Form.Item>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'end',
              marginTop: '24px',
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              筛选
            </Button>
            <Button
              onClick={handleReset}
              icon={<ReloadOutlined />}
              style={{
                borderRadius: '8px',
                padding: '6px 16px',
                fontSize: '14px',
              }}
            >
              重置
            </Button>
          </div>
        </Form>
      </div>

      {/* 设备列表卡片 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {/* 列表头部 */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            设备列表
          </h2>
          <Button
            type="primary"
            onClick={() => setModalVisible(true)}
            icon={<PlusOutlined />}
            style={{
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            新增设备
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={devices}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
          style={{ margin: 0 }}
          size="middle"
          className="device-table"
        />
      </div>

      {/* 新增设备模态框 */}
      <Modal
        title="新增设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={600}
        style={{ borderRadius: '12px' }}
        centered
      >
        <Form
          form={form}
          onFinish={handleCreate}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          layout="horizontal"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="设备类型"
            rules={[{ required: true, message: '请输入设备类型' }]}
          >
            <Select
              placeholder="请选择设备类型"
              style={{ width: '100%' }}
              options={typeOptions}
            />
          </Form.Item>
          <Form.Item
            name="brand"
            label="设备厂商"
            rules={[{ required: true, message: '请输入设备厂商' }]}
          >
            <Input placeholder="请输入设备厂商" />
          </Form.Item>
          <Form.Item
            name="model"
            label="规格型号"
            rules={[{ required: true, message: '请输入规格型号' }]}
          >
            <Input placeholder="请输入规格型号" />
          </Form.Item>
          <Form.Item
            name="price"
            label="单价"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              placeholder="请输入单价"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              formatter={(value) => `¥ ${value}`}
              parser={(value) => value?.replace(/¥\s?/, '') || ''}
            />
          </Form.Item>
          <Form.Item
            name="location"
            label="存放地点"
            rules={[{ required: true, message: '请输入存放地点' }]}
          >
            <Input placeholder="请输入存放地点" />
          </Form.Item>
          <Form.Item name="status" label="设备状态">
            <Select
              placeholder="请选择设备状态"
              style={{ width: '100%' }}
              options={statusOptions.filter((opt) => opt.value !== '')}
              defaultValue="available"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
