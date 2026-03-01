/**
 * 主题配置
 * 与现有 Ant Design 主题保持一致
 */

export interface ThemeConfig {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
}

export const lightTheme: ThemeConfig = {
  colors: {
    primary: '#1890ff',
    primaryLight: '#40a9ff',
    primaryDark: '#096dd9',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    background: '#f0f2f5',
    surface: '#ffffff',
    border: '#d9d9d9',
    text: '#1A202C',
    textSecondary: '#718096',
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
};

export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#667eea',
    primaryLight: '#7c3aed',
    primaryDark: '#4c51bf',
    success: '#48bb78',
    warning: '#ecc94b',
    error: '#f56565',
    info: '#667eea',
    background: '#1a202c',
    surface: '#2d3748',
    border: '#4a5568',
    text: '#ffffff',
    textSecondary: '#a0aec0',
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
};
