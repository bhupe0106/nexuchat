import { create } from 'zustand';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('nexus_user') || 'null'),
  token: localStorage.getItem('nexus_token') || null,
  isLoading: false,
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register(data);
      const { token, user } = res.data;
      localStorage.setItem('nexus_token', token);
      localStorage.setItem('nexus_user', JSON.stringify(user));
      initSocket(token);
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(data);
      const { token, user } = res.data;
      localStorage.setItem('nexus_token', token);
      localStorage.setItem('nexus_user', JSON.stringify(user));
      initSocket(token);
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (_) {}
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    disconnectSocket();
    set({ user: null, token: null, error: null });
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem('nexus_user', JSON.stringify(updated));
    set({ user: updated });
  },

  refreshMe: async () => {
    try {
      const res = await authAPI.getMe();
      const user = res.data.user;
      localStorage.setItem('nexus_user', JSON.stringify(user));
      set({ user });
    } catch (_) {}
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
