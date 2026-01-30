import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AdminTheme = 'dark' | 'light';

interface AdminThemeState {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

export const useAdminTheme = create<AdminThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
      },
      setTheme: (theme: AdminTheme) => set({ theme }),
    }),
    {
      name: 'admin-theme',
    }
  )
);

// Theme-aware class helper
export const adminThemeClasses = {
  dark: {
    bg: 'bg-[#0A0A0B]',
    bgCard: 'bg-[#111113]',
    bgCardHover: 'hover:bg-white/5',
    bgInput: 'bg-[#1A1A1C]',
    border: 'border-white/10',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
  },
  light: {
    bg: 'bg-[#F8FAFC]',
    bgCard: 'bg-white',
    bgCardHover: 'hover:bg-gray-50',
    bgInput: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
  },
};

export function getAdminClasses(theme: AdminTheme) {
  return adminThemeClasses[theme];
}
