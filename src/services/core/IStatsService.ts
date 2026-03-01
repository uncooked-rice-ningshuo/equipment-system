export interface IStatsService {
  getDashboardStats(): Promise<{
    totalDevices: number;
    borrowedDevices: number;
    availableDevices: number;
    overdueDevices: number;
  }>;
  getOverdueRecords(): Promise<{ overdue: any[]; dueSoon: any[] }>;
  markAsNotified(recordId: number): Promise<void>;
  getDeviceTypeDistribution(): Promise<{ name: string; value: number }[]>;
  getBorrowedTrend(
    period: 'week' | 'month' | 'year',
  ): Promise<{ name: string; value: number }[]>;
}
