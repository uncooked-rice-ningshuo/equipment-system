import { invoke } from '@/services/ipc';
import { Table } from 'antd';
import { useEffect, useState } from 'react';

export default function Returned() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await invoke<any[]>('borrow:list', { returned: true });
        // filter on client side as backend returns all
        const list = Array.isArray(data) ? data : [];
        setRecords(list.filter((r: any) => r.actual_return_time));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    { title: '设备编号', dataIndex: 'device_code' },
    { title: '设备名称', dataIndex: 'device_name' },
    { title: '借出时间', dataIndex: 'borrow_time' },
    { title: '归还时间', dataIndex: 'actual_return_time' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Table columns={columns} dataSource={records} rowKey="id" />
    </div>
  );
}
