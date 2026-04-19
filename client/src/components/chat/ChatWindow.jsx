import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Video, Search, MoreVertical, Pin, FileText,
  ChevronDown, Info, Hash, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { emitMessagesRead } from '../../services/socket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import SummaryModal from './SummaryModal';
import SearchModal from './SearchModal';

export default function ChatWindow({ onBack }) {
  const { user } = useAuthStore();
  const {
    activeConversation, messages, fetchMessages,
    typingUsers, isLoadingMsgs
  } = useChatStore();

  const [showSummary, setShowSummary] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const convId = activeConversation?._id;
  const convMessages = messages[convId] || [];
  const typingList = typingUsers[convId] || [];

  // Load messages when conversation changes
  useEffect(() => {
    if (!convId) return;
    setPage(1);
    setHasMore(true);
    fetchMessages(convId, 1).then((count) => {
      if (count < 50) setHasMore(false);
    });
    emitMessagesRead(convId);
  }, [convId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom || page === 1) {
      scrollToBottom('smooth');
    }
  }, [convMessages.length]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);

    // Load more on scroll to top
    if (scrollTop < 80 && !isLoadingMsgs && hasMore) {
      const prevHeight = container.scrollHeight;
      setPage((p) => {
        const next = p + 1;
        fetchMessages(convId, next).then((count) => {
          if (count < 50) setHasMore(false);
          // Maintain scroll position
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - prevHeight;
          });
        });
        return next;
      });
    }
  }, [convId, isLoadingMsgs, hasMore]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <Hash size={36} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome to NexusChat
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Select a conversation from the sidebar or start a new one to begin messaging.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['🤖 AI Assistant', '🎤 Voice Messages', '📁 File Sharing', '🌐 Translation'].map((f) => (
              <div key={f} className="py-2 px-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const isGroup = activeConversation.isGroup;
  const otherUser = !isGroup
    ? activeConversation.participants?.find((p) => p._id !== user._id)
    : null;
  const convName = isGroup ? activeConversation.groupName : otherUser?.username;
  const convAvatar = isGroup
    ? activeConversation.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeConversation.groupName}`
    : otherUser?.avatar;
  const isOnline = !isGroup && otherUser?.isOnline;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>

        {/* Back button (mobile) */}
        <button onClick={onBack} className="btn-ghost p-1.5 rounded-lg md:hidden">
          <ArrowLeft size={18} />
        </button>

        <div className="relative">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: 'var(--accent)' }}>
              <Hash size={18} />
            </div>
          ) : (
            <>
              <img src={convAvatar} alt={convName} className="avatar w-10 h-10" />
              {isOnline && <span className="online-dot" />}
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {convName}
          </h3>
          <p className="text-xs" style={{ color: isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
            {isGroup
              ? `${activeConversation.participants?.length} members`
              : isOnline
                ? '● Online'
                : otherUser?.lastSeen
                  ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`
                  : 'Offline'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setShowSearch(true)} className="btn-ghost p-2 rounded-lg" title="Search">
            <Search size={17} />
          </button>
          <button onClick={() => setShowSummary(true)} className="btn-ghost p-2 rounded-lg" title="Summarize">
            <FileText size={17} />
          </button>
          <button className="btn-ghost p-2 rounded-lg" title="Info">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoadingMsgs && page === 1 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)' }} />
          </div>
        )}

        {hasMore && !isLoadingMsgs && convMessages.length >= 50 && (
          <div className="text-center py-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Scroll up to load more</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {convMessages.map((msg, idx) => {
            const prev = convMessages[idx - 1];
            const showDate = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
            const showAvatar = !prev || prev.sender?._id !== msg.sender?._id ||
              new Date(msg.createdAt) - new Date(prev.createdAt) > 300000;

            return (
              <motion.div key={msg._id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isSelf={msg.sender?._id === user._id}
                  showAvatar={showAvatar}
                  isGroup={isGroup}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 pl-2"
            >
              <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-sm"
                style={{ background: 'var(--msg-other)', border: '1px solid var(--border)' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {typingList.map((t) => t.username).join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{ background: 'var(--accent)' }}
          >
            <ChevronDown size={18} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInput conversationId={convId} />

      {/* Modals */}
      {showSummary && <SummaryModal conversationId={convId} onClose={() => setShowSummary(false)} />}
      {showSearch && <SearchModal conversationId={convId} onClose={() => setShowSearch(false)} />}
    </div>
  );
}
