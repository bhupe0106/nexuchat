import { useEffect, useRef } from 'react';
import { getSocket, initSocket, emitMessagesRead } from '../services/socket';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const useSocket = () => {
  const { user, token } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    setTyping,
    setUserOnline,
    activeConversation,
    incrementUnread,
  } = useChatStore();

  const activeConvRef = useRef(activeConversation);
  useEffect(() => { activeConvRef.current = activeConversation; }, [activeConversation]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = initSocket(token);

    // ── New message ──────────────────────────────────────
    const onNewMessage = (message) => {
      addMessage(message);
      const convId = message.conversationId;

      if (activeConvRef.current?._id === convId) {
        emitMessagesRead(convId);
      } else {
        incrementUnread(convId);
        // Browser notification
        if (Notification.permission === 'granted' && message.sender._id !== user._id) {
          new Notification(`${message.sender.username}`, {
            body: message.content || `Sent a ${message.type}`,
            icon: message.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.username}`,
            tag: convId,
          });
        }
      }
    };

    // ── Message deleted ──────────────────────────────────
    const onMessageDeleted = ({ messageId }) => {
      deleteMessage(messageId);
    };

    // ── Message reacted ──────────────────────────────────
    const onMessageReacted = ({ messageId, reactions }) => {
      updateMessage(messageId, { reactions });
    };

    // ── Typing ───────────────────────────────────────────
    const onTypingStart = ({ userId, username, conversationId }) => {
      if (userId !== user._id) setTyping(conversationId, userId, username, true);
    };
    const onTypingStop = ({ userId, conversationId }) => {
      setTyping(conversationId, userId, '', false);
    };

    // ── User status ──────────────────────────────────────
    const onUserStatus = ({ userId, isOnline, lastSeen }) => {
      setUserOnline(userId, isOnline, lastSeen);
    };

    // ── Notifications ─────────────────────────────────────
    const onNotification = ({ sender, content, conversationId }) => {
      if (activeConvRef.current?._id !== conversationId) {
        toast.custom(
          (t) => (
            `<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
              <img src="${sender.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
              <div>
                <div style="font-weight:600;font-size:13px;color:var(--text-primary);">${sender.username}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${content}</div>
              </div>
            </div>`
          ),
          { duration: 4000 }
        );
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:reacted', onMessageReacted);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('user:status', onUserStatus);
    socket.on('notification:message', onNotification);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:reacted', onMessageReacted);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('user:status', onUserStatus);
      socket.off('notification:message', onNotification);
    };
  }, [token, user]);
};

export default useSocket;
