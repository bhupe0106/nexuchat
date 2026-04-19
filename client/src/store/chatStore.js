import { create } from 'zustand';
import { conversationAPI, messageAPI } from '../services/api';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},        // { [conversationId]: Message[] }
  typingUsers: {},     // { [conversationId]: { userId, username }[] }
  onlineUsers: {},     // { [userId]: boolean }
  lastSeen: {},        // { [userId]: Date }
  unreadCounts: {},    // { [conversationId]: number }
  searchResults: [],
  isLoadingConvs: false,
  isLoadingMsgs: false,

  // ── Conversations ──────────────────────────────────────
  fetchConversations: async () => {
    set({ isLoadingConvs: true });
    try {
      const res = await conversationAPI.getAll();
      const convs = res.data.conversations;
      const unreadCounts = {};
      convs.forEach((c) => { unreadCounts[c._id] = c.unreadCount || 0; });
      set({ conversations: convs, unreadCounts, isLoadingConvs: false });
    } catch (err) {
      console.error('Fetch conversations error:', err);
      set({ isLoadingConvs: false });
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      // Reset unread for this conversation
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [conversation._id]: 0 },
      }));
    }
  },

  openDM: async (recipientId) => {
    try {
      const res = await conversationAPI.getOrCreateDM(recipientId);
      const conversation = res.data.conversation;

      // Add to conversations list if not present
      set((state) => {
        const exists = state.conversations.find((c) => c._id === conversation._id);
        return {
          conversations: exists
            ? state.conversations
            : [conversation, ...state.conversations],
          activeConversation: conversation,
        };
      });

      return conversation;
    } catch (err) {
      console.error('Open DM error:', err);
      return null;
    }
  },

  updateConversationLastMessage: (conversationId, message) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
    }));
  },

  // ── Messages ───────────────────────────────────────────
  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoadingMsgs: true });
    try {
      const res = await messageAPI.getMessages(conversationId, page);
      const newMsgs = res.data.messages;
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: page === 1 ? newMsgs : [...(state.messages[conversationId] || []), ...newMsgs],
        },
        isLoadingMsgs: false,
      }));
      return newMsgs.length;
    } catch (err) {
      console.error('Fetch messages error:', err);
      set({ isLoadingMsgs: false });
      return 0;
    }
  },

  addMessage: (message) => {
    const convId = message.conversationId;
    set((state) => {
      const existing = state.messages[convId] || [];
      // Avoid duplicates (by _id or tempId)
      const isDupe = existing.some(
        (m) => m._id === message._id || (message.tempId && m.tempId === message.tempId)
      );
      if (isDupe) return state;

      return {
        messages: {
          ...state.messages,
          [convId]: [...existing, message],
        },
      };
    });
    get().updateConversationLastMessage(convId, message);
  },

  updateMessage: (messageId, updates) => {
    set((state) => {
      const updated = { ...state.messages };
      for (const convId in updated) {
        updated[convId] = updated[convId].map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        );
      }
      return { messages: updated };
    });
  },

  deleteMessage: (messageId) => {
    set((state) => {
      const updated = { ...state.messages };
      for (const convId in updated) {
        updated[convId] = updated[convId].map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
        );
      }
      return { messages: updated };
    });
  },

  // ── Typing ─────────────────────────────────────────────
  setTyping: (conversationId, userId, username, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      let updated;
      if (isTyping) {
        const exists = current.find((u) => u.userId === userId);
        updated = exists ? current : [...current, { userId, username }];
      } else {
        updated = current.filter((u) => u.userId !== userId);
      }
      return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
    });
  },

  // ── Online Status ──────────────────────────────────────
  setUserOnline: (userId, isOnline, lastSeen) => {
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
      lastSeen: lastSeen ? { ...state.lastSeen, [userId]: lastSeen } : state.lastSeen,
    }));

    // Update in conversations
    set((state) => ({
      conversations: state.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p._id === userId ? { ...p, isOnline, lastSeen: lastSeen || p.lastSeen } : p
        ),
      })),
    }));
  },

  incrementUnread: (conversationId) => {
    const { activeConversation } = get();
    if (activeConversation?._id === conversationId) return; // Don't increment if viewing
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    }));
  },

  // ── Search ─────────────────────────────────────────────
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearch: () => set({ searchResults: [] }),

  // ── Reset ──────────────────────────────────────────────
  reset: () =>
    set({
      conversations: [],
      activeConversation: null,
      messages: {},
      typingUsers: {},
      onlineUsers: {},
      unreadCounts: {},
      searchResults: [],
    }),
}));

export default useChatStore;
