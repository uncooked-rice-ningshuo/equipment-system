import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../components';
import { useLegacyServices } from '../../services';
import { formatDateTime } from '../../utils';

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

  p {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  strong {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }
`;

const typeOptions = [
  { label: '柜式空调', value: '柜式空调' },
  { label: '数字示波器', value: '数字示波器' },
  { label: '笔记本电脑', value: '笔记本电脑' },
  { label: '服务器', value: '服务器' },
  { label: '打印机', value: '打印机' },
];

export default function Returned() {
  const { dataService } = useLegacyServices();
  const { theme } = useTheme();
  const actionRef = useRef<any>();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await dataService.deleteBorrowRecord(currentRecord.id);
      message.success('删除成功');
      setDeleteModalVisible(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const fetchData = async (params: any) => {
    try {
      const { current, pageSize, ...restParams } = params;
      void current;
      void pageSize;
      const filters: any = { returned: true };

      if (restParams.deviceCode) filters.deviceCode = restParams.deviceCode;
      if (restParams.deviceName) filters.deviceName = restParams.deviceName;
      if (restParams.borrowerName)
        filters.borrowerName = restParams.borrowerName;
      if (restParams.borrowerClass)
        filters.borrowerClass = restParams.borrowerClass;
      if (restParams.deviceType) filters.deviceType = restParams.deviceType;

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
        restParams.returnTimeRange &&
        Array.isArray(restParams.returnTimeRange)
      ) {
        filters.returnTimeStart = dayjs(
          restParams.returnTimeRange[0],
        ).toISOString();
        filters.returnTimeEnd = dayjs(
          restParams.returnTimeRange[1],
        ).toISOString();
      }

      const list = await dataService.getBorrowRecords(filters);
      const returnedList = list.filter((r: any) => r.actual_return_time);

      return {
        data: returnedList,
        success: true,
        total: returnedList.length,
      };
    } catch {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const fetchUniqueValues = async (field: string) => {
    try {
      const list = await dataService.getBorrowRecords({ returned: true });
      const returnedList = list.filter((r: any) => r.actual_return_time);
      return [
        ...new Set(
          returnedList.map((item: any) => item[field]).filter(Boolean),
        ),
      ].map((value) => ({ label: value, value }));
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
      dataIndex: 'borrowTimeRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: {
        placeholder: ['开始时间', '结束时间'],
      },
    },
    {
      title: '归还时间',
      dataIndex: 'returnTimeRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: {
        placeholder: ['开始时间', '结束时间'],
      },
    },
    {
      title: '借出时间',
      dataIndex: 'borrow_time',
      hideInSearch: true,
      render: (_: any, record: any) => formatDateTime(record.borrow_time),
    },
    {
      title: '归还时间',
      dataIndex: 'actual_return_time',
      hideInSearch: true,
      render: (_: any, record: any) =>
        formatDateTime(record.actual_return_time),
    },
    {
      title: '应还时间',
      dataIndex: 'return_deadline',
      hideInSearch: true,
      render: (_: any, record: any) => formatDateTime(record.return_deadline),
    },
    {
      title: '借用天数',
      dataIndex: 'borrow_days',
      hideInSearch: true,
      render: (_: any, record: any) => {
        if (record.borrow_time && record.actual_return_time) {
          const days = dayjs(record.actual_return_time).diff(
            dayjs(record.borrow_time),
            'day',
          );
          return `${days} 天`;
        }
        return '-';
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_: any, r: any) => (
        <Button type="link" danger onClick={() => handleDelete(r)}>
          删除
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
        headerTitle="归还记录"
      />
      <StyledModal
        $theme={theme}
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
      >
        {currentRecord && (
          <div>
            <p>确认删除以下归还记录？</p>
            <p style={{ marginTop: 16 }}>
              <strong>设备编号：</strong>
              {currentRecord.device_code}
            </p>
            <p>
              <strong>设备名称：</strong>
              {currentRecord.device_name}
            </p>
            <p>
              <strong>借用人：</strong>
              {currentRecord.borrower_name}
            </p>
            <p>
              <strong>借出时间：</strong>
              {formatDateTime(currentRecord.borrow_time)}
            </p>
            <p>
              <strong>归还时间：</strong>
              {formatDateTime(currentRecord.actual_return_time)}
            </p>
            <p style={{ color: '#ff4d4f', marginTop: 16 }}>
              删除后数据不可恢复！
            </p>
          </div>
        )}
      </StyledModal>
    </div>
  );
}
