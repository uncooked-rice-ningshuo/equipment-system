'use client';

import { SearchOutlined } from '@ant-design/icons';
import type { BorrowRecord, IDataService } from '@equipment/shared';
import { Button, Card, Input, Space, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

export default function ReturnedPage({
  dataService,
}: {
  dataService: IDataService;
}) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await dataService.getBorrowRecords({
        filters: { returned: true },
      });
      const returnedRecords = data.filter((r) => r.actualReturnTime);
      setRecords(returnedRecords);
    } catch {
      message.error('加载归还记录失败');
    } finally {
      setLoading(false);
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
      title: '归还时间',
      dataIndex: 'actualReturnTime',
      key: 'actualReturnTime',
      render: (time: Date | null) =>
        time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="success">已归还</Tag>,
    },
  ];

  return (
    <div>
      <Card title="归还记录">
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
    </div>
  );
}
