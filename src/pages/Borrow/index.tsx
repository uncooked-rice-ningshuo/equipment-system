import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message } from 'antd';
import { invoke } from '@/services/ipc';
import dayjs from 'dayjs';

export default function Borrow() {
  const [records, setRecords] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const data = await invoke<any[]>('borrow:list');
    setRecords(data);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (values: any) => {
    const payload = {
      device_id: Number(values.device_id),
      borrower_name: values.borrower_name,
      borrower_class: values.borrower_class,
      borrower_student_id: values.borrower_student_id,
      borrower_phone: values.borrower_phone,
      borrow_time: dayjs(values.borrow_time).toISOString(),
      return_deadline: dayjs(values.return_deadline).toISOString(),
    };
    const res = await invoke('borrow:create', payload);
    if (res?.success) { message.success('借出成功'); setVisible(false); form.resetFields(); load(); }
    else { message.error(res?.message || '借出失败'); }
  };

  const handleReturn = async (id: number) => {
    const res = await invoke('borrow:return', id);
    if (res?.success) { message.success('归还成功'); load(); }
    else { message.error(res?.message || '归还失败'); }
  };

  const columns = [
    { title: '设备编号', dataIndex: 'device_code' },
    { title: '设备名称', dataIndex: 'device_name' },
    { title: '借用人', dataIndex: 'borrower_name' },
    { title: '班级', dataIndex: 'borrower_class' },
    { title: '学号', dataIndex: 'borrower_student_id' },
    { title: '联系方式', dataIndex: 'borrower_phone' },
    { title: '借出时间', dataIndex: 'borrow_time' },
    { title: '应还时间', dataIndex: 'return_deadline' },
    { title: '操作', render: (_: any, r: any) => (<Button type="link" onClick={() => handleReturn(r.id)}>归还</Button>) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={() => setVisible(true)}>新增借出</Button>
      <Table columns={columns} dataSource={records} rowKey="id" style={{ marginTop: 16 }} />
      <Modal title="借出设备" open={visible} onCancel={() => setVisible(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={handleCreate} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="device_id" label="设备ID" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="borrower_name" label="借出人" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="borrower_class" label="班级" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="borrower_student_id" label="学号" rules={[{ required: true, len: 10 }]}> <Input /> </Form.Item>
          <Form.Item name="borrower_phone" label="联系方式" rules={[{ required: true, len: 11 }]}> <Input /> </Form.Item>
          <Form.Item name="borrow_time" label="借出时间" rules={[{ required: true }]}> <DatePicker showTime /> </Form.Item>
          <Form.Item name="return_deadline" label="应还时间" rules={[{ required: true }]}> <DatePicker showTime /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

