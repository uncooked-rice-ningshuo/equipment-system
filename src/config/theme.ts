export interface ThemeColors {
  header: {
    background: string;
    borderColor: string;
    textColor: string;
    breadcrumbColor: string;
    userCardBg: string;
  };
  sider: {
    background: string;
    borderColor: string;
    logoColor: string;
  };
  content: {
    background: string;
  };
  menu: {
    selectedBg: string;
    selectedColor: string;
    defaultColor: string;
    background: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  layout: {
    background: string;
  };
}

export const themeConfig: Record<'light' | 'dark', ThemeColors> = {
  light: {
    header: {
      background: '#ffffff',
      borderColor: '#e5e7eb',
      textColor: '#1A202C',
      breadcrumbColor: '#4A5568',
      userCardBg: '#ffffff',
    },
    sider: {
      background: '#ffffff',
      borderColor: '#e5e7eb',
      logoColor: '#4f54bd',
    },
    content: {
      background: '#f5f7fa',
    },
    menu: {
      selectedBg: '#EEF2FF',
      selectedColor: '#4f54bd',
      defaultColor: '#000000',
      background: '#ffffff',
    },
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      tertiary: '#A0AEC0',
    },
    layout: {
      background: '#f5f7fa',
    },
  },
  dark: {
    header: {
      background: '#1A202C',
      borderColor: '#2D3748',
      textColor: '#ffffff',
      breadcrumbColor: '#CBD5E0',
      userCardBg: '#2D3748',
    },
    sider: {
      background: '#1A202C',
      borderColor: '#2D3748',
      logoColor: '#ffffff',
    },
    content: {
      background: '#2D3748',
    },
    menu: {
      selectedBg: '#2D3748',
      selectedColor: '#4f54bd',
      defaultColor: '#ffffff',
      background: '#1A202C',
    },
    text: {
      primary: '#ffffff',
      secondary: '#CBD5E0',
      tertiary: '#718096',
    },
    layout: {
      background: '#1A202C',
    },
  },
};

export type ThemeType = 'light' | 'dark';

export const getTheme = (theme: ThemeType): ThemeColors => {
  return themeConfig[theme];
};
