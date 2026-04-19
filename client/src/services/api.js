import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexus_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  logout: () => api.post('/auth/logout'),
};

// ─── Users ─────────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getById: (id) => api.get(`/users/${id}`),
  starMessage: (messageId) => api.post(`/users/star/${messageId}`),
  getStarred: () => api.get('/users/starred'),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
};

// ─── Conversations ─────────────────────────────────────
export const conversationAPI = {
  getAll: () => api.get('/conversations'),
  getOrCreateDM: (recipientId) => api.post('/conversations/dm', { recipientId }),
  createGroup: (data) => api.post('/conversations/group', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addMember: (convId, userId) => api.post(`/conversations/${convId}/add-member`, { userId }),
  removeMember: (convId, userId) => api.delete(`/conversations/${convId}/remove-member/${userId}`),
  getPinned: (convId) => api.get(`/conversations/${convId}/pinned`),
};

// ─── Messages ──────────────────────────────────────────
export const messageAPI = {
  getMessages: (conversationId, page = 1) =>
    api.get(`/messages/${conversationId}?page=${page}&limit=50`),
  sendMessage: (data) => api.post('/messages', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  delete: (messageId) => api.delete(`/messages/${messageId}`),
  search: (q, conversationId) =>
    api.get(`/messages/search?q=${encodeURIComponent(q)}${conversationId ? `&conversationId=${conversationId}` : ''}`),
  pin: (messageId) => api.post(`/messages/${messageId}/pin`),
  react: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
};

// ─── AI ────────────────────────────────────────────────
export const aiAPI = {
  chat: (message, conversationHistory) => api.post('/ai/chat', { message, conversationHistory }),
  summarize: (conversationId) => api.post('/ai/summarize', { conversationId }),
  sentiment: (text) => api.post('/ai/sentiment', { text }),
  suggestions: (lastMessage, context) => api.post('/ai/suggestions', { lastMessage, context }),
  translate: (text, targetLanguage, messageId) =>
    api.post('/ai/translate', { text, targetLanguage, messageId }),
};

export default api;
