import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => socket;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitTypingStart = (conversationId) => {
  socket?.emit('typing:start', { conversationId });
};

export const emitTypingStop = (conversationId) => {
  socket?.emit('typing:stop', { conversationId });
};

export const emitMessagesRead = (conversationId) => {
  socket?.emit('messages:read', { conversationId });
};

export const emitSendMessage = (data) => {
  socket?.emit('message:send', data);
};

export const emitFileMessage = (data) => {
  socket?.emit('message:file', data);
};

export const joinGroup = (conversationId) => {
  socket?.emit('group:join', { conversationId });
};
