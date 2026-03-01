import { IAuthService } from './core/IAuthService';
import { IDataService } from './core/IDataService';
import { IStatsService } from './core/IStatsService';
import { ElectronAuthService } from './electron/ElectronAuthService';
import { ElectronDataService } from './electron/ElectronDataService';
import { ElectronStatsService } from './electron/ElectronStatsService';
import { WebAuthService } from './web/WebAuthService';
import { WebDataService } from './web/WebDataService';
import { WebStatsService } from './web/WebStatsService';

// Robust Electron detection
const isElectron =
  typeof window !== 'undefined' &&
  ((window as any).process?.type === 'renderer' ||
    (window as any).api !== undefined);

export const dataService: IDataService = isElectron
  ? new ElectronDataService()
  : new WebDataService();

export const authService: IAuthService = isElectron
  ? new ElectronAuthService()
  : new WebAuthService();

export const statsService: IStatsService = isElectron
  ? new ElectronStatsService()
  : new WebStatsService();
