/**
 * 主题管理 Hook
 * 使用 Zustand 管理主题状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'equipment-theme',
    },
  ),
);

export function useTheme() {
  return useThemeStore((state) => state.theme);
}

export function useSetTheme() {
  return useThemeStore((state) => state.setTheme);
}

export function useToggleTheme() {
  return useThemeStore((state) => state.toggleTheme);
}
