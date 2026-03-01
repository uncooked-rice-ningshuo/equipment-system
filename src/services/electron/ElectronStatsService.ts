import { IStatsService } from '../core/IStatsService';
import { invoke } from '../ipc';

export class ElectronStatsService implements IStatsService {
  async getDashboardStats() {
    return invoke('stats:dashboard');
  }

  async getOverdueRecords() {
    return invoke('borrow:listOverdue');
  }

  async markAsNotified(recordId: number) {
    return invoke('notify:mark', recordId);
  }

  async getDeviceTypeDistribution() {
    return invoke('stats:deviceTypeDistribution');
  }

  async getBorrowedTrend(period: string) {
    return invoke('stats:borrowedByType', period);
  }
}
