'use client';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type {
  BorrowRecord,
  Device,
  DeviceStatus,
  IDataService,
  NewBorrowRecord,
} from '@equipment/shared';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const { Option } = Select;

export default function BorrowPage({
  dataService,
}: {
  dataService: IDataService;
}) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await dataService.getBorrowRecords({
        filters: { returned: false },
      });
      setRecords(data);
    } catch {
      message.error('加载借出记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const { data } = await dataService.getDevices({
        filters: { status: 'available' as DeviceStatus },
      });
      setDevices(data);
    } catch {
      setDevices([]);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!searchText) return records;
    const q = searchText.toLowerCase();
    return records.filter((r) => {
      return (
        r.deviceCode.toLowerCase().includes(q) ||
        r.deviceName.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q)
      );
    });
  }, [records, searchText]);

  const openCreate = async () => {
    await loadDevices();
    form.resetFields();
    form.setFieldsValue({
      borrowTime: dayjs(),
      returnDeadline: dayjs().add(7, 'day'),
    });
    setCreateOpen(true);
  };

  const handleCreate = async (values: any) => {
    const deviceId = Number(values.deviceId);
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      message.error('请选择有效设备');
      return;
    }

    const payload: NewBorrowRecord = {
      deviceId,
      deviceCode: device.code,
      deviceName: device.name,
      borrowerName: values.borrowerName,
      borrowerClass: values.borrowerClass || '',
      borrowerStudentId: values.borrowerStudentId || '',
      borrowerPhone: values.borrowerPhone || '',
      borrowTime: values.borrowTime.toDate(),
      returnDeadline: values.returnDeadline.toDate(),
      notified: false,
      notifyTime: null,
      actualReturnTime: null,
      createdAt: new Date(),
    };

    try {
      await dataService.createBorrowRecord(payload);
      message.success('借出成功');
      setCreateOpen(false);
      await loadRecords();
    } catch (error: any) {
      message.error(error.message || '借出失败');
    }
  };

  const handleReturn = async (record: BorrowRecord) => {
    try {
      await dataService.returnBorrowRecord(record.id);
      message.success('归还成功');
      await loadRecords();
    } catch (error: any) {
      message.error(error.message || '归还失败');
    }
  };

  const columns = [
    { title: '设备编号', dataIndex: 'deviceCode', key: 'deviceCode' },
    { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName' },
    { title: '借用人', dataIndex: 'borrowerName', key: 'borrowerName' },
    {
      title: '借用时间',
      dataIndex: 'borrowTime',
      key: 'borrowTime',
      render: (time: Date) => new Date(time).toLocaleString(),
    },
    {
      title: '应还时间',
      dataIndex: 'returnDeadline',
      key: 'returnDeadline',
      render: (time: Date) => new Date(time).toLocaleString(),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: BorrowRecord) => {
        const now = new Date();
        const deadline = new Date(record.returnDeadline);
        const isOverdue = deadline < now;
        return (
          <Tag color={isOverdue ? 'error' : 'processing'}>
            {isOverdue ? '已逾期' : '借用中'}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BorrowRecord) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => handleReturn(record)}
          >
            归还
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="借出管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增借出
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索设备/借用人"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" onClick={loadRecords}>
            查询
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新增借出"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          autoComplete="off"
        >
          <Form.Item
            name="deviceId"
            label="设备"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select
              placeholder="选择可借设备"
              showSearch
              optionFilterProp="label"
            >
              {devices.map((d) => (
                <Option key={d.id} value={d.id} label={`${d.code} ${d.name}`}>
                  {d.code} - {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="borrowerName"
            label="借用人"
            rules={[{ required: true, message: '请输入借用人' }]}
          >
            <Input placeholder="姓名" />
          </Form.Item>

          <Form.Item name="borrowerClass" label="班级">
            <Input placeholder="班级（可选）" />
          </Form.Item>

          <Form.Item name="borrowerStudentId" label="学号">
            <Input placeholder="学号（可选）" />
          </Form.Item>

          <Form.Item name="borrowerPhone" label="电话">
            <Input placeholder="电话（可选）" />
          </Form.Item>

          <Form.Item
            name="borrowTime"
            label="借出时间"
            rules={[{ required: true, message: '请选择借出时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="returnDeadline"
            label="应还时间"
            rules={[{ required: true, message: '请选择应还时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
