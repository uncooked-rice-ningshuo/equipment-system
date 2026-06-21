import { RollbackOutlined } from '@ant-design/icons';
import type { BorrowRecord } from '@equipment/shared';
import { getUserErrorMessage } from '@equipment/ui/legacy';
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { ipc } from '../utils/ipc';

export const Return: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(
    null,
  );
  const [form] = Form.useForm();

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result = await ipc.borrows.getAll({ status: 'active' });
      setRecords(result.data);
    } catch (error) {
      message.error('加载借出记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleReturn = (record: BorrowRecord) => {
    setSelectedRecord(record);
    form.resetFields();
    form.setFieldsValue({
      returnDate: dayjs(),
    });
    setReturnModalVisible(true);
  };

  const handleReturnSubmit = async (values: any) => {
    if (!selectedRecord) return;
    try {
      await ipc.borrows.returnDevice({
        borrowId: selectedRecord.id,
        returnDate: values.returnDate.toDate(),
        notes: values.notes,
      });
      message.success('归还成功');
      setReturnModalVisible(false);
      loadRecords();
    } catch (error: any) {
      message.error(getUserErrorMessage(error, '归还失败'));
    }
  };

  const isOverdue = (expectedReturnDate: Date) => {
    return dayjs().isAfter(dayjs(expectedReturnDate), 'day');
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '设备', dataIndex: ['device', 'name'] },
    { title: '借用人', dataIndex: ['user', 'username'] },
    {
      title: '借出日期',
      dataIndex: 'borrowDate',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '应还日期',
      dataIndex: 'expectedReturnDate',
      render: (date: Date) => (
        <span style={{ color: isOverdue(date) ? 'red' : 'inherit' }}>
          {dayjs(date).format('YYYY-MM-DD')}
          {isOverdue(date) && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              已逾期
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BorrowRecord) => (
        <Button
          type="primary"
          icon={<RollbackOutlined />}
          onClick={() => handleReturn(record)}
        >
          归还
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>归还设备</h2>
      <Table
        columns={columns}
        dataSource={records}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="确认归还"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleReturnSubmit} layout="vertical">
          <Form.Item
            name="returnDate"
            label="归还日期"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="归还备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
