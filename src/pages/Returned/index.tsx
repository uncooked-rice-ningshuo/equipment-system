import { useEffect, useState } from 'react';
import { Table } from 'antd';
import { invoke } from '@/services/ipc';

export default function Returned() {
  const [records, setRecords] = useState<any[]>([]);
  const load = async () => {
    const data = await invoke<any[]>('borrow:list', { returned: true });
    setRecords((data || []).filter(r => r.actual_return_time));
  };
  useEffect(() => { load(); }, []);

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

