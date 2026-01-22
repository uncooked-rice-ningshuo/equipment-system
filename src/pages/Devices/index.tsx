import { invoke, invokeWithEvent } from '@/services/ipc';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, message, Modal, Select } from 'antd';
import { useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '可用', value: 'available' },
  { label: '已借出', value: 'borrowed' },
  { label: '维修中', value: 'maintenance' },
  { label: '已报废', value: 'scrap' },
];

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

export default function Devices() {
  const actionRef = useRef<any>();
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const theme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

  const handleCreate = async (values: any) => {
    try {
      const res = await invokeWithEvent('device:create', values);
      if (res?.success) {
        message.success('新增设备成功');
        setCreateVisible(false);
        createForm.resetFields();
        actionRef.current?.reload();
      } else {
        message.error(res?.message || '新增设备失败');
      }
    } catch (error) {
      message.error('新增设备失败');
    }
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    editForm.setFieldsValue({
      ...record,
    });
    setEditVisible(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      const res = await invokeWithEvent('device:update', {
        id: currentRecord.id,
        ...values,
      });
      if (res?.success) {
        message.success('更新设备成功');
        setEditVisible(false);
        editForm.resetFields();
        setCurrentRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res?.message || '更新设备失败');
      }
    } catch (error) {
      message.error('更新设备失败');
    }
  };

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await invokeWithEvent('device:delete', currentRecord.id);
      if (result.success) {
        message.success('删除成功');
        setDeleteVisible(false);
        setCurrentRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const fetchData = async (params: any) => {
    try {
      const { current, pageSize, ...restParams } = params;
      const filters: any = {};

      if (restParams.code) {
        filters.code = restParams.code;
      }
      if (restParams.name) {
        filters.name = restParams.name;
      }
      if (restParams.type) {
        filters.type = restParams.type;
      }
      if (restParams.brand) {
        filters.brand = restParams.brand;
      }
      if (restParams.status && restParams.status !== '') {
        filters.status = restParams.status;
      }

      const data = await invoke<any[]>('device:list', filters);
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
      const data = await invoke<any[]>('device:list');
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
      dataIndex: 'code',
      valueType: 'select',
      request: async () => fetchUniqueValues('code'),
      fieldProps: {
        placeholder: '请选择设备编号',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      hideInTable: true,
      valueType: 'select',
      request: async () => fetchUniqueValues('name'),
      fieldProps: {
        placeholder: '请选择设备名称',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '设备类型',
      dataIndex: 'type',
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
      title: '设备厂商',
      dataIndex: 'brand',
      valueType: 'select',
      request: async () => fetchUniqueValues('brand'),
      fieldProps: {
        placeholder: '请选择设备厂商',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '规格型号',
      dataIndex: 'model',
      hideInSearch: true,
    },
    {
      title: '单价',
      dataIndex: 'price',
      hideInSearch: true,
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
      hideInSearch: true,
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      valueType: 'select',
      request: async () => statusOptions,
      fieldProps: {
        placeholder: '请选择设备状态',
      },
      render: (status: string) => {
        const statusMap: any = {
          available: '可用',
          borrowed: '已借出',
          maintenance: '维修中',
          scrap: '已报废',
        };
        const displayStatus = statusMap[status] || status;

        let statusColor = '#52c41a';
        if (status === 'borrowed') statusColor = '#6366F1';
        if (status === 'maintenance') statusColor = '#faad14';
        if (status === 'scrap') statusColor = '#ff4d4f';

        return (
          <span style={{ color: statusColor, fontWeight: 500 }}>
            {displayStatus}
          </span>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_: any, r: any) => [
        <Button type="link" key="r.edit" onClick={() => handleEdit(r)}>
          编辑
        </Button>,
        <Button
          type="link"
          danger
          key="r.delete"
          onClick={() => handleDelete(r)}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <>
      <GlobalSelectStyles $theme={theme} />
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
          scroll={{ x: 1000 }}
          headerTitle="设备管理"
          toolBarRender={() => [
            <Button
              type="primary"
              key="create"
              onClick={() => setCreateVisible(true)}
            >
              新增设备
            </Button>,
          ]}
        />
        <StyledModal
          $theme={theme}
          title="新增设备"
          open={createVisible}
          onCancel={() => {
            setCreateVisible(false);
            createForm.resetFields();
          }}
          onOk={() => createForm.submit()}
          destroyOnClose
          width={600}
        >
          <Form
            form={createForm}
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
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select placeholder="请选择设备类型" options={typeOptions} />
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
                parser={(value) => (value?.replace(/¥\s?/, '') || '') as any}
              />
            </Form.Item>
            <Form.Item
              name="location"
              label="存放地点"
              rules={[{ required: true, message: '请输入存放地点' }]}
            >
              <Input placeholder="请输入存放地点" />
            </Form.Item>
            <Form.Item name="status" label="设备状态" initialValue="available">
              <Select
                placeholder="请选择设备状态"
                options={statusOptions.filter((opt) => opt.value !== '')}
              />
            </Form.Item>
          </Form>
        </StyledModal>
        <StyledModal
          $theme={theme}
          title="编辑设备"
          open={editVisible}
          onCancel={() => {
            setEditVisible(false);
            editForm.resetFields();
            setCurrentRecord(null);
          }}
          onOk={() => editForm.submit()}
          destroyOnClose
          width={600}
        >
          <Form
            form={editForm}
            onFinish={handleUpdate}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            layout="horizontal"
            style={{ marginTop: 16 }}
          >
            <Form.Item name="code" label="设备编号">
              <Input disabled />
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
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select placeholder="请选择设备类型" options={typeOptions} />
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
                parser={(value) => (value?.replace(/¥\s?/, '') || '') as any}
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
                options={statusOptions.filter((opt) => opt.value !== '')}
              />
            </Form.Item>
          </Form>
        </StyledModal>
        <StyledModal
          $theme={theme}
          title="确认删除"
          open={deleteVisible}
          onOk={confirmDelete}
          onCancel={() => {
            setDeleteVisible(false);
            setCurrentRecord(null);
          }}
          okText="确认删除"
          cancelText="取消"
        >
          {currentRecord && (
            <div>
              <p>确认删除以下设备？</p>
              <p style={{ marginTop: 16 }}>
                <strong>设备编号：</strong>
                {currentRecord.code}
              </p>
              <p>
                <strong>设备名称：</strong>
                {currentRecord.name}
              </p>
              {currentRecord.status === 'borrowed' && (
                <p style={{ color: '#ff4d4f', marginTop: 16 }}>
                  该设备当前已借出，无法删除！
                </p>
              )}
              {currentRecord.status !== 'borrowed' && (
                <p style={{ color: '#ff4d4f', marginTop: 16 }}>
                  删除后数据不可恢复！
                </p>
              )}
            </div>
          )}
        </StyledModal>
      </div>
    </>
  );
}
