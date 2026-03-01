import { dataService } from '@/services';
import { eventBus } from '@/utils/eventBus';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Form, Input, message, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const typeOptions = [
  { label: '柜式空调', value: '柜式空调' },
  { label: '数字示波器', value: '数字示波器' },
  { label: '笔记本电脑', value: '笔记本电脑' },
  { label: '服务器', value: '服务器' },
  { label: '打印机', value: '打印机' },
];

const GlobalSelectStyles = createGlobalStyle<{ $theme: 'light' | 'dark' }>`
  ${(props) =>
    props.$theme === 'dark'
      ? `
    .ant-select-dropdown {
      background: #2d3748 !important;
      border: 1px solid #4a5568 !important;
    }

    .ant-select-item {
      color: #ffffff !important;

      &:hover {
        background: #4a5568 !important;
      }

      &.ant-select-item-option-selected {
        background: #2d3748 !important;
        color: #667eea !important;
      }
    }

    .ant-select-item-option-active {
      background: #4a5568 !important;
    }
  `
      : ''}
`;

const GlobalDatePickerStyles = createGlobalStyle<{ $theme: 'light' | 'dark' }>`
  ${(props) =>
    props.$theme === 'dark'
      ? `
    .ant-picker-dropdown {
      background: #2d3748 !important;
      border: 1px solid #4a5568 !important;
    }

    .ant-picker-panel {
      background: #2d3748 !important;
      color: #ffffff !important;
    }

    .ant-picker-header {
      color: #ffffff !important;
      border-bottom-color: #4a5568 !important;
    }

    .ant-picker-footer {
      border-top-color: #4a5568 !important;
    }

    .ant-picker-cell {
      color: #ffffff !important;

      &:hover {
        background: #4a5568 !important;
      }

      &.ant-picker-cell-selected {
        background: #667eea !important;
      }

      &.ant-picker-cell-in-view {
        color: #ffffff !important;
      }

      &.ant-picker-cell-disabled {
        color: #718096 !important;
      }
    }

    .ant-picker-cell-inner {
      color: #ffffff !important;
    }

    .ant-picker-suffix {
      color: #ffffff !important;
    }

    .ant-picker-clear {
      color: #ffffff !important;
    }

    .ant-picker-separator {
      color: #ffffff !important;
    }

    .ant-picker-today-btn {
      color: #667eea !important;

      &:hover {
        color: #667eea !important;
      }
    }
  `
      : ''}
`;

const StyledModal = styled(Modal)<{ $theme: 'light' | 'dark' }>`
  .ant-modal-content {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
  }

  .ant-modal-header {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};

    .ant-modal-title {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-modal-close-x {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-modal-body {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-form-item-label > label {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-input,
  .ant-input-password {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &::placeholder {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
    }
  }

  .ant-input:focus,
  .ant-input-password:focus {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#4096ff' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(64, 150, 255, 0.2)'
        : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
  }

  .ant-select {
    .ant-select-selector {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#2d3748'};
      border-color: ${(props) =>
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      .ant-select-selection-placeholder {
        color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
      }

      .ant-select-selection-item {
        color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      }
    }

    &:hover .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
    }

    &.ant-select-focused .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(64, 150, 255, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-select-arrow {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }
  }

  .ant-picker {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &::placeholder {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
    }
  }

  .ant-picker-focused {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#4096ff' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(64, 150, 255, 0.2)'
        : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
  }

  .ant-select-dropdown {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};

    .ant-select-item {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      &:hover {
        background: ${(props) =>
          props.$theme === 'light' ? '#f5f5f5' : '#4a5568'};
      }

      &.ant-select-item-option-selected {
        background: ${(props) =>
          props.$theme === 'light' ? '#e6f7ff' : '#2d3748'};
      }
    }
  }

  .ant-picker-dropdown {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};

    .ant-picker-panel {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#2d3748'};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }

    .ant-picker-cell {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      &:hover {
        background: ${(props) =>
          props.$theme === 'light' ? '#f5f5f5' : '#4a5568'};
      }

      &.ant-picker-cell-selected {
        background: ${(props) =>
          props.$theme === 'light' ? '#1890ff' : '#667eea'};
      }
    }

    .ant-picker-header {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }

    .ant-picker-footer {
      border-top-color: ${(props) =>
        props.$theme === 'light' ? '#f0f0f0' : '#4a5568'};
    }
  }

  .ant-input-number {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
    }

    &:focus-within {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#4096ff' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(64, 150, 255, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-input-number-input {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }
`;

export default function Borrow() {
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [selectedDeviceName, setSelectedDeviceName] = useState<
    string | undefined
  >();
  const theme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

  useEffect(() => {
    loadAvailableDevices();
  }, []);

  const loadAvailableDevices = async () => {
    try {
      const data = await dataService.getDevices({ status: 'available' });
      setAvailableDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载可用设备列表失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    // 根据 device_code 查询设备 id
    const device = availableDevices.find((d) => d.code === values.device_code);
    if (!device) {
      message.error('设备不存在，请重新选择');
      return;
    }

    const payload = {
      device_id: device.id, // 使用 device_id 而不是 device_code
      device_code: device.code,
      device_name: device.name,
      device_type: device.type,
      device_brand: device.brand,
      borrower_name: values.borrower_name,
      borrower_class: values.borrower_class,
      borrower_student_id: values.borrower_student_id,
      borrower_phone: values.borrower_phone,
      borrow_time: dayjs(values.borrow_time).toDate(),
      return_deadline: dayjs(values.return_deadline).toDate(),
    };

    try {
      await dataService.createBorrowRecord(payload);
      eventBus.emit('device:borrowed', payload);
      message.success('借出成功');
      setVisible(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '借出失败');
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await dataService.updateBorrowRecord(id, {
        actual_return_time: new Date(),
      });
      eventBus.emit('device:returned', id);
      message.success('归还成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '归还失败');
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
      // Drizzle or DB layer might need adjustment for date ranges in filters if strict typing is used
      // For now, assuming basic filter support

      // We need to filter returned=false for this active borrow list
      filters.returned = false;

      const list = await dataService.getBorrowRecords(filters);

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
      const list: any[] = await dataService.getBorrowRecords({
        returned: false,
      });
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
    <>
      <GlobalSelectStyles $theme={theme} />
      <GlobalDatePickerStyles $theme={theme} />
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
        <StyledModal
          $theme={theme}
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
            <Form.Item
              name="device_code"
              label="设备编号"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="请选择设备编号"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                // 根据选择的设备名称筛选设备编号
                options={
                  selectedDeviceName
                    ? availableDevices
                        .filter((device) => device.name === selectedDeviceName)
                        .map((device) => ({
                          label: device.code,
                          value: device.code,
                          id: device.id, // Include id for internal logic if needed
                        }))
                    : availableDevices.map((device) => ({
                        label: device.code,
                        value: device.code,
                        id: device.id,
                      }))
                }
                onChange={(value) => {
                  // 选择设备编号后，自动填充设备名称
                  if (value) {
                    const device = availableDevices.find(
                      (d) => d.code === value,
                    );
                    if (device) {
                      form.setFieldValue('device_name', device.name);
                      setSelectedDeviceName(device.name);
                    }
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="device_name"
              label="设备名称"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="请选择设备名称"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={availableDevices.map((device) => ({
                  label: device.name,
                  value: device.name,
                }))}
                onChange={(value) => {
                  // 选择设备名称后，自动填充设备编号
                  if (value) {
                    const device = availableDevices.find(
                      (d) => d.name === value,
                    );
                    if (device) {
                      form.setFieldValue('device_code', device.code);
                    }
                  }
                }}
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
        </StyledModal>
      </div>
    </>
  );
}
