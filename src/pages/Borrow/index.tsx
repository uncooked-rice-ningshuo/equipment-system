import { invoke } from '@/services/ipc';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Form, Input, message, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

const typeOptions = [
  { label: '柜式空调', value: '柜式空调' },
  { label: '数字示波器', value: '数字示波器' },
  { label: '笔记本电脑', value: '笔记本电脑' },
  { label: '服务器', value: '服务器' },
  { label: '打印机', value: '打印机' },
];

export default function Borrow() {
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAvailableDevices();
  }, []);

  const loadAvailableDevices = async () => {
    try {
      const data = await invoke<any[]>('device:list', { status: 'available' });
      setAvailableDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载可用设备列表失败:', error);
    }
  };

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
    if (res?.success) {
      message.success('借出成功');
      setVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } else {
      message.error(res?.message || '借出失败');
    }
  };

  const handleReturn = async (id: number) => {
    const res = await invoke('borrow:return', id);
    if (res?.success) {
      message.success('归还成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.message || '归还失败');
    }
  };

  const fetchData = async (params: any) => {
    try {
      const { current, pageSize, ...restParams } = params;
      const filters: any = {};

      if (restParams.deviceCode) {
        filters.deviceCode = restParams.deviceCode;
      }
      if (restParams.deviceName) {
        filters.deviceName = restParams.deviceName;
      }
      if (restParams.borrowerName) {
        filters.borrowerName = restParams.borrowerName;
      }
      if (restParams.borrowerClass) {
        filters.borrowerClass = restParams.borrowerClass;
      }
      if (restParams.deviceType) {
        filters.deviceType = restParams.deviceType;
      }
      if (
        restParams.borrowTimeRange &&
        Array.isArray(restParams.borrowTimeRange)
      ) {
        filters.borrowTimeStart = dayjs(
          restParams.borrowTimeRange[0],
        ).toISOString();
        filters.borrowTimeEnd = dayjs(
          restParams.borrowTimeRange[1],
        ).toISOString();
      }
      if (
        restParams.returnDeadlineRange &&
        Array.isArray(restParams.returnDeadlineRange)
      ) {
        filters.returnDeadlineStart = dayjs(
          restParams.returnDeadlineRange[0],
        ).toISOString();
        filters.returnDeadlineEnd = dayjs(
          restParams.returnDeadlineRange[1],
        ).toISOString();
      }

      const data = await invoke<any[]>('borrow:list', filters);
      const list = Array.isArray(data) ? data : [];

      return {
        data: list,
        success: true,
        total: list.length,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const fetchUniqueValues = async (field: string) => {
    try {
      const data = await invoke<any[]>('borrow:list');
      const list = Array.isArray(data) ? data : [];
      return [...new Set(list.map((item) => item[field]).filter(Boolean))].map(
        (value) => ({ label: value, value }),
      );
    } catch {
      return [];
    }
  };

  const columns: ProColumns<any>[] = [
    {
      title: '设备编号',
      dataIndex: 'device_code',
      valueType: 'select',
      request: async () => fetchUniqueValues('device_code'),
      fieldProps: {
        placeholder: '请选择设备编号',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      hideInTable: true,
      valueType: 'select',
      request: async () => fetchUniqueValues('device_name'),
      fieldProps: {
        placeholder: '请选择设备名称',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      valueType: 'select',
      valueEnum: typeOptions.reduce((acc: any, item) => {
        acc[item.value] = { text: item.label };
        return acc;
      }, {}),
      fieldProps: {
        placeholder: '请选择设备类型',
      },
    },
    {
      title: '借用人',
      dataIndex: 'borrower_name',
      valueType: 'select',
      request: async () => fetchUniqueValues('borrower_name'),
      fieldProps: {
        placeholder: '请选择借用人',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '学号',
      dataIndex: 'borrower_student_id',
      width: 120,
      request: async () => fetchUniqueValues('borrower_student_id'),
      fieldProps: {
        placeholder: '请选择学号',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '班级',
      dataIndex: 'borrower_class',
      valueType: 'select',
      request: async () => fetchUniqueValues('borrower_class'),
      fieldProps: {
        placeholder: '请选择班级',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '联系方式',
      dataIndex: 'borrower_phone',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '借出时间',
      dataIndex: 'borrow_time',
      valueType: 'dateRange',
      fieldProps: {
        placeholder: ['开始时间', '结束时间'],
      },
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '应还时间',
      dataIndex: 'return_deadline',
      valueType: 'dateRange',
      fieldProps: {
        placeholder: ['开始时间', '结束时间'],
      },
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_: any, r: any) => (
        <Button type="link" onClick={() => handleReturn(r.id)}>
          归还
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<any>
        columns={columns}
        actionRef={actionRef}
        request={fetchData}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        scroll={{ x: 1300 }}
        dateFormatter="string"
        headerTitle="借出记录"
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            onClick={() => {
              loadAvailableDevices();
              setVisible(true);
            }}
          >
            新增借出
          </Button>,
        ]}
      />
      <Modal
        title="借出设备"
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          onFinish={handleCreate}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item name="device_id" label="设备" rules={[{ required: true }]}>
            <Select
              placeholder="请选择设备"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={availableDevices.map((device) => ({
                label: `${device.code} - ${device.name}`,
                value: device.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="borrower_name"
            label="借出人"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="borrower_class"
            label="班级"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="borrower_student_id"
            label="学号"
            rules={[{ required: true, len: 10 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="borrower_phone"
            label="联系方式"
            rules={[{ required: true, len: 11 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="borrow_time"
            label="借出时间"
            rules={[{ required: true }]}
          >
            <DatePicker showTime />
          </Form.Item>
          <Form.Item
            name="return_deadline"
            label="应还时间"
            rules={[{ required: true }]}
          >
            <DatePicker showTime />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
