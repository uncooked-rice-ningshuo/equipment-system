import { invoke } from '@/services/ipc';
import { Button, Form, Input, Modal, Table, message } from 'antd';
import { useEffect, useState } from 'react';

export default function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

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
        loadDevices();
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
      loadDevices();
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    { title: '设备编号', dataIndex: 'code', key: 'code' },
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '设备类型', dataIndex: 'type', key: 'type' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <>
          <Button type="link">编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={() => setModalVisible(true)}>
        新增设备
      </Button>
      <Table
        columns={columns}
        dataSource={devices}
        loading={loading}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      <Modal
        title="新增设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          onFinish={handleCreate}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item name="code" label="设备编号" rules={[{ required: true }]}>
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="type" label="设备类型">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="brand" label="设备品牌">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="model" label="规格型号">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item name="price" label="单价">
            {' '}
            <Input type="number" />{' '}
          </Form.Item>
          <Form.Item name="location" label="存放地点">
            {' '}
            <Input />{' '}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
