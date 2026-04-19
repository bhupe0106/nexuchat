import { create } from 'zustand';

const THEMES = ['dark', 'light', 'ocean', 'forest', 'sunset'];

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('nexus_theme') || 'dark',
  themes: THEMES,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
    set({ theme });
  },

  initTheme: () => {
    const saved = localStorage.getItem('nexus_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    set({ theme: saved });
  },
}));

export default useThemeStore;
