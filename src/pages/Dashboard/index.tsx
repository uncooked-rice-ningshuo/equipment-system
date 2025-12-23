import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Modal, Table, Button } from 'antd';
import { invoke } from '@/services/ipc';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalDevices: 0, borrowedDevices: 0, availableDevices: 0, overdueDevices: 0 });
  const [overdue, setOverdue] = useState<any[]>([]);
  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    load();
    loadReminders();
  }, []);

  const load = async () => {
    const data = await invoke('stats:dashboard');
    setStats(data);
  };

  const loadReminders = async () => {
    const data = await invoke('borrow:listOverdue');
    setOverdue(data?.overdue || []);
    setDueSoon(data?.dueSoon || []);
    setVisible(true);
  };

  const columns = [
    { title: '设备编号', dataIndex: 'device_code' },
    { title: '设备名称', dataIndex: 'device_name' },
    { title: '借用人', dataIndex: 'borrower_name' },
    { title: '联系方式', dataIndex: 'borrower_phone' },
    { title: '剩余天数', dataIndex: 'remaining_days' },
    {
      title: '通知状态',
      dataIndex: 'notified',
      render: (_: any, r: any) => (
        <Button type={r.notified ? 'default' : 'primary'} onClick={async () => {
          if (!r.notified) {
            await invoke('notify:mark', r.id);
            loadReminders();
          }
        }}>
          {r.notified ? '已通知' : '未通知'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="设备总数" value={stats.totalDevices} /></Card></Col>
        <Col span={6}><Card><Statistic title="在借设备" value={stats.borrowedDevices} /></Card></Col>
        <Col span={6}><Card><Statistic title="可借设备" value={stats.availableDevices} /></Card></Col>
        <Col span={6}><Card><Statistic title="逾期设备" value={stats.overdueDevices} valueStyle={{ color: 'red' }} /></Card></Col>
      </Row>

      <Modal title="设备归还提醒" open={visible} onCancel={() => setVisible(false)} footer={null} width={900}>
        <h3>逾期设备</h3>
        <Table columns={columns} dataSource={overdue} rowKey="id" pagination={false} />
        <h3 style={{ marginTop: 16 }}>临期设备（≤5天）</h3>
        <Table columns={columns} dataSource={dueSoon} rowKey="id" pagination={false} />
      </Modal>
    </div>
  );
}

