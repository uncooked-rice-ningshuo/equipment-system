import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, message, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import DeviceTypeSelect from '../../../components/fields/DeviceTypeSelect';
import { useTheme } from '../../components';
import { useLegacyServices } from '../../services';
import type { DeviceExcelRow, DeviceExcelRowError } from '../../utils';
import {
  buildDevicesTemplateWorkbookBuffer,
  buildDevicesWorkbookBuffer,
  downloadExcelBuffer,
  eventBus,
  parseDevicesWorkbookBuffer,
  toNewDeviceForCreate,
  toNewDeviceForUpdate,
} from '../../utils';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '可用', value: 'available' },
  { label: '已借出', value: 'borrowed' },
  { label: '维修中', value: 'maintenance' },
  { label: '已报废', value: 'scrap' },
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
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
  }

  .ant-input:focus,
  .ant-input-password:focus {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
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
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }

    &.ant-select-focused .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-select-arrow {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
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
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }

    &:focus-within {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-input-number-input {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }
`;

export default function Devices() {
  const { dataService } = useLegacyServices();
  const { theme } = useTheme();
  const actionRef = useRef<any>();
  const formRef = useRef<any>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [excelBusy, setExcelBusy] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importRows, setImportRows] = useState<DeviceExcelRow[]>([]);
  const [importErrors, setImportErrors] = useState<DeviceExcelRowError[]>([]);
  const [importFileName, setImportFileName] = useState('');

  const handleCreate = async (values: any) => {
    try {
      await dataService.createDevice(values);
      eventBus.emit('device:added', values);
      message.success('新增设备成功');
      setCreateVisible(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '新增设备失败');
    }
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    editForm.setFieldsValue({ ...record });
    setEditVisible(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      await dataService.updateDevice(currentRecord.id, values);
      eventBus.emit('device:updated', { id: currentRecord.id, ...values });
      message.success('更新设备成功');
      setEditVisible(false);
      editForm.resetFields();
      setCurrentRecord(null);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '更新设备失败');
    }
  };

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await dataService.deleteDevice(currentRecord.id);
      eventBus.emit('device:deleted', currentRecord.id);
      message.success('删除成功');
      setDeleteVisible(false);
      setCurrentRecord(null);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const getCurrentFilters = () => {
    const values = formRef.current?.getFieldsValue?.() ?? {};
    const filters: any = {};

    if (values.code) filters.code = values.code;
    if (values.name) filters.name = values.name;
    if (values.type) filters.type = values.type;
    if (values.brand) filters.brand = values.brand;
    if (values.status && values.status !== '') filters.status = values.status;

    return filters;
  };

  const handleDownloadTemplate = () => {
    const buffer = buildDevicesTemplateWorkbookBuffer();
    downloadExcelBuffer(
      buffer,
      `devices_template_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
    );
  };

  const handleExportExcel = async () => {
    setExcelBusy(true);
    try {
      const list = await dataService.getDevices(getCurrentFilters());
      const buffer = buildDevicesWorkbookBuffer(list as any);
      downloadExcelBuffer(
        buffer,
        `devices_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
      );
    } catch (error: any) {
      message.error(error.message || '导出失败');
    } finally {
      setExcelBusy(false);
    }
  };

  const handleImportExcelClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: any) => {
    const file: File | undefined = e?.target?.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      message.error('仅支持 .xlsx 文件');
      return;
    }

    setExcelBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseDevicesWorkbookBuffer(buffer);
      setImportFileName(file.name);
      setImportRows(result.rows);
      setImportErrors(result.errors);
      setImportPreviewOpen(true);
    } catch {
      message.error('Excel 解析失败');
    } finally {
      setExcelBusy(false);
    }
  };

  const stripUndefined = (input: any) => {
    if (!input || typeof input !== 'object') return input;
    const next: any = {};
    for (const [k, v] of Object.entries(input)) {
      if (v === undefined) continue;
      next[k] = v;
    }
    return next;
  };

  const handleConfirmImport = async () => {
    if (excelBusy) return;
    if (!importRows.length) {
      message.error('没有可导入的有效行');
      return;
    }

    const progressKey = 'deviceExcelImport';
    setExcelBusy(true);
    message.open({
      type: 'loading',
      content: `正在导入... (0/${importRows.length})`,
      key: progressKey,
      duration: 0,
    });

    try {
      const existingList: any[] = await dataService.getDevices();
      const deviceByCode = new Map<string, any>();
      for (const d of existingList) {
        if (!d?.code) continue;
        deviceByCode.set(String(d.code).trim(), d);
      }

      const writeErrors: DeviceExcelRowError[] = [];
      let successCount = 0;

      for (let i = 0; i < importRows.length; i++) {
        const row = importRows[i];
        const codeKey = String(row.code).trim();
        const existing = deviceByCode.get(codeKey);

        try {
          if (existing?.id) {
            const payload = stripUndefined(toNewDeviceForUpdate(row));
            await dataService.updateDevice(Number(existing.id), payload);
            successCount += 1;
          } else {
            const payload = stripUndefined(toNewDeviceForCreate(row));
            const created = await dataService.createDevice(payload);
            deviceByCode.set(codeKey, created);
            successCount += 1;
          }
        } catch (error: any) {
          writeErrors.push({
            rowNumber: row.rowNumber,
            message: error?.message || '写入失败',
          });
        }

        if ((i + 1) % 20 === 0 || i === importRows.length - 1) {
          message.open({
            type: 'loading',
            content: `正在导入... (${i + 1}/${importRows.length})`,
            key: progressKey,
            duration: 0,
          });
        }
      }

      const allErrors = [...importErrors, ...writeErrors];
      message.open({
        type: allErrors.length ? 'warning' : 'success',
        content: `导入完成：成功 ${successCount} 行，失败 ${allErrors.length} 行`,
        key: progressKey,
        duration: 3,
      });

      setImportPreviewOpen(false);
      actionRef.current?.reload();

      Modal.info({
        title: '导入结果',
        content: (
          <div style={{ lineHeight: 1.8 }}>
            <div>
              成功：{successCount} 行；失败：{allErrors.length} 行
            </div>
            {allErrors.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>失败明细</div>
                <div style={{ maxHeight: 280, overflow: 'auto' }}>
                  {allErrors.slice(0, 300).map((e) => (
                    <div key={`${e.rowNumber}-${e.message}`}>
                      第 {e.rowNumber} 行：{e.message}
                    </div>
                  ))}
                  {allErrors.length > 300 && (
                    <div style={{ marginTop: 8, opacity: 0.7 }}>
                      仅展示前 300 条错误
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ),
        width: 720,
      });
    } finally {
      setExcelBusy(false);
    }
  };

  const fetchData = async (params: any) => {
    try {
      const { current, pageSize, ...restParams } = params;
      void current;
      void pageSize;
      const filters: any = {};

      if (restParams.code) filters.code = restParams.code;
      if (restParams.name) filters.name = restParams.name;
      if (restParams.type) filters.type = restParams.type;
      if (restParams.brand) filters.brand = restParams.brand;
      if (restParams.status && restParams.status !== '')
        filters.status = restParams.status;

      const list = await dataService.getDevices(filters);

      return { data: list, success: true, total: list.length };
    } catch {
      return { data: [], success: false, total: 0 };
    }
  };

  const fetchUniqueValues = async (field: string) => {
    try {
      const list: any[] = await dataService.getDevices();
      return [...new Set(list.map((item) => item[field]).filter(Boolean))].map(
        (value) => ({
          label: value,
          value,
        }),
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
      request: async () => fetchUniqueValues('type'),
      fieldProps: {
        placeholder: '请选择设备类型',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
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
      render: (_: any, record: any) => {
        const status = record?.status as string;
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: 'none' }}
          onChange={handleImportFileChange}
        />
        <ProTable<any>
          columns={columns}
          actionRef={actionRef}
          formRef={formRef}
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
              key="template"
              onClick={handleDownloadTemplate}
              disabled={excelBusy}
            >
              下载模板
            </Button>,
            <Button
              key="import"
              onClick={handleImportExcelClick}
              disabled={excelBusy}
            >
              导入 Excel
            </Button>,
            <Button
              key="export"
              onClick={handleExportExcel}
              disabled={excelBusy}
            >
              导出 Excel
            </Button>,
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
          title="Excel 导入预览"
          open={importPreviewOpen}
          onCancel={() => setImportPreviewOpen(false)}
          onOk={handleConfirmImport}
          confirmLoading={excelBusy}
          okText="开始导入"
          cancelText="取消"
          width={720}
          destroyOnClose
        >
          <div style={{ lineHeight: 1.8 }}>
            <div>
              <strong>文件：</strong>
              {importFileName}
            </div>
            <div>
              <strong>可导入行数：</strong>
              {importRows.length}
            </div>
            <div>
              <strong>校验失败行数：</strong>
              {importErrors.length}
            </div>
            {importErrors.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>失败明细</div>
                <div
                  style={{
                    maxHeight: 240,
                    overflow: 'auto',
                    border:
                      theme === 'light'
                        ? '1px solid #f0f0f0'
                        : '1px solid #2d3748',
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {importErrors.slice(0, 200).map((e) => (
                    <div key={`${e.rowNumber}-${e.message}`}>
                      第 {e.rowNumber} 行：{e.message}
                    </div>
                  ))}
                  {importErrors.length > 200 && (
                    <div style={{ marginTop: 8, opacity: 0.7 }}>
                      仅展示前 200 条错误
                    </div>
                  )}
                </div>
              </div>
            )}
            {importRows.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>示例预览</div>
                <div
                  style={{
                    maxHeight: 200,
                    overflow: 'auto',
                    border:
                      theme === 'light'
                        ? '1px solid #f0f0f0'
                        : '1px solid #2d3748',
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {importRows.slice(0, 20).map((r) => (
                    <div key={`${r.rowNumber}-${r.code}`}>
                      第 {r.rowNumber} 行：{r.code} / {r.name}
                    </div>
                  ))}
                  {importRows.length > 20 && (
                    <div style={{ marginTop: 8, opacity: 0.7 }}>
                      仅展示前 20 行
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </StyledModal>
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
              <DeviceTypeSelect
                dataService={dataService}
                placeholder="请选择设备类型"
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
              <DeviceTypeSelect
                dataService={dataService}
                placeholder="请选择设备类型"
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
