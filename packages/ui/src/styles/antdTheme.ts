import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export type AntdThemeMode = 'light' | 'dark';

export const indigoPalette = {
  selectedBg: '#EEF2FF',
  primary: '#6366F1',
  hover: '#818CF8',
  active: '#4F46E5',
} as const;

export const createAntdTheme = (mode: AntdThemeMode): ThemeConfig => {
  return {
    algorithm:
      mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      borderRadius: 8,
      colorInfo: indigoPalette.primary,
      colorLink: indigoPalette.primary,
      colorLinkActive: indigoPalette.active,
      colorLinkHover: indigoPalette.hover,
      colorPrimary: indigoPalette.primary,
      colorPrimaryActive: indigoPalette.active,
      colorPrimaryBg: indigoPalette.selectedBg,
      colorPrimaryHover: indigoPalette.hover,
      controlOutline: 'rgba(99, 102, 241, 0.2)',
    },
  };
};
