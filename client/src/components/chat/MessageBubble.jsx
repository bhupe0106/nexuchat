import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Trash2, Pin, Star, Globe, Download,
  Play, Pause, Reply, Smile, Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { messageAPI, aiAPI, userAPI } from '../../services/api';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';

const SENTIMENT_EMOJI = {
  positive: '😊',
  neutral: '😐',
  negative: '😠',
};

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ message, isSelf, showAvatar, isGroup }) {
  const { user } = useAuthStore();
  const { deleteMessage, updateMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const menuRef = useRef(null);

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          {message.content}
        </span>
      </div>
    );
  }

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      await messageAPI.delete(message._id);
      deleteMessage(message._id);
      toast.success('Message deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handlePin = async () => {
    setShowMenu(false);
    try {
      await messageAPI.pin(message._id);
      updateMessage(message._id, { isPinned: !message.isPinned });
      toast.success(message.isPinned ? 'Unpinned' : 'Pinned 📌');
    } catch { toast.error('Failed to pin'); }
  };

  const handleStar = async () => {
    setShowMenu(false);
    try {
      await userAPI.starMessage(message._id);
      toast.success('Message starred ⭐');
    } catch { toast.error('Failed to star'); }
  };

  const handleTranslate = async () => {
    setShowMenu(false);
    if (translatedText) { setTranslatedText(null); return; }
    setTranslating(true);
    try {
      const res = await aiAPI.translate(message.content, user.preferredLanguage || 'en', message._id);
      setTranslatedText(res.data.translation);
    } catch { toast.error('Translation failed'); }
    setTranslating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const handleReact = async (emoji) => {
    setShowReactions(false);
    try {
      const res = await messageAPI.react(message._id, emoji);
      updateMessage(message._id, { reactions: res.data.reactions });
    } catch { toast.error('Failed to react'); }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const isDeleted = message.isDeleted;
  const sentiment = message.sentiment?.label;

  const groupedReactions = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex items-end gap-2 group ${isSelf ? 'flex-row-reverse' : 'flex-row'} msg-enter`}>

      {/* Avatar */}
      {!isSelf && (
        <div className="w-7 flex-shrink-0 mb-1">
          {showAvatar && (
            <img
              src={message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.username}`}
              alt={message.sender?.username}
              className="avatar w-7 h-7"
            />
          )}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-xs md:max-w-md lg:max-w-lg ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* Sender name (group chats) */}
        {isGroup && !isSelf && showAvatar && (
          <span className="text-xs font-semibold px-1" style={{ color: 'var(--accent)' }}>
            {message.sender?.username}
          </span>
        )}

        {/* Pin indicator */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-xs px-2"
            style={{ color: 'var(--text-muted)' }}>
            <Pin size={10} /> Pinned
          </div>
        )}

        <div className="flex items-end gap-1.5 relative">
          {/* Message bubble */}
          <div className={`message-bubble ${isSelf ? 'self' : 'other'} ${isDeleted ? 'opacity-50 italic' : ''}`}>
            {/* Reply preview */}
            {message.replyTo && (
              <div className="mb-2 pl-2 py-1 rounded-lg border-l-2 opacity-70"
                style={{ borderColor: 'var(--accent)', background: 'rgba(0,0,0,0.15)' }}>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {message.replyTo.content || 'Media message'}
                </p>
              </div>
            )}

            {/* Content based on type */}
            {message.type === 'image' && !isDeleted ? (
              <div>
                <img src={message.fileUrl} alt="Shared image"
                  className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: 280 }}
                  onClick={() => window.open(message.fileUrl, '_blank')} />
                {message.content && (
                  <p className="mt-1.5 text-sm">{message.content}</p>
                )}
              </div>
            ) : message.type === 'audio' && !isDeleted ? (
              <div className="flex items-center gap-3 min-w-[180px]">
                <button onClick={toggleAudio}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent)' }}>
                  {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                </button>
                <div className="flex-1">
                  <div className="flex gap-0.5 items-end h-6">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-full opacity-60"
                        style={{ height: `${Math.random() * 16 + 4}px`, background: 'var(--accent)' }} />
                    ))}
                  </div>
                  <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>Voice message</span>
                </div>
                <audio ref={audioRef} src={message.fileUrl}
                  onEnded={() => setIsPlaying(false)} />
              </div>
            ) : message.type === 'file' && !isDeleted ? (
              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <Download size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {message.fileName || 'File'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Download'}
                  </p>
                </div>
              </a>
            ) : message.type === 'ai' ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent)', color: 'white' }}>
                    🤖 NexusAI
                  </span>
                </div>
                <div className="text-sm prose prose-invert max-w-none">
                  <ReactMarkdown>{isDeleted ? 'This message was deleted' : message.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {isDeleted ? '🚫 This message was deleted' : message.content}
              </p>
            )}

            {/* Translated text */}
            {translatedText && (
              <div className="mt-2 pt-2 text-sm italic opacity-80"
                style={{ borderTop: '1px solid var(--border)' }}>
                🌐 {translatedText}
              </div>
            )}
            {translating && (
              <div className="mt-1 text-xs animate-pulse" style={{ color: 'var(--text-muted)' }}>
                Translating...
              </div>
            )}
          </div>

          {/* Context menu trigger */}
          {!isDeleted && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
              <button onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                <Smile size={13} />
              </button>
              <button onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                <MoreHorizontal size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Reactions bar */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                {emoji} <span style={{ color: 'var(--text-muted)' }}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + sentiment */}
        <div className={`flex items-center gap-1.5 px-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {isSelf && message.readBy?.length > 1 && (
            <Check size={12} style={{ color: 'var(--accent)' }} />
          )}
          {sentiment && sentiment !== 'neutral' && !isDeleted && (
            <span className="text-xs" title={`Sentiment: ${sentiment}`}>
              {SENTIMENT_EMOJI[sentiment]}
            </span>
          )}
        </div>

        {/* Emoji reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className={`flex gap-1 p-2 rounded-2xl shadow-xl z-20 ${isSelf ? 'flex-row-reverse' : ''}`}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => handleReact(emoji)}
                  className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)]">
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              ref={menuRef}
              className={`absolute bottom-8 z-30 rounded-xl py-1 shadow-2xl min-w-[160px] ${isSelf ? 'right-8' : 'left-8'}`}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            >
              {[
                { icon: Copy, label: copied ? 'Copied!' : 'Copy text', action: handleCopy },
                { icon: Pin, label: message.isPinned ? 'Unpin' : 'Pin', action: handlePin },
                { icon: Star, label: 'Star', action: handleStar },
                { icon: Globe, label: translatedText ? 'Hide translation' : 'Translate', action: handleTranslate },
                ...(isSelf ? [{ icon: Trash2, label: 'Delete', action: handleDelete, danger: true }] : []),
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: danger ? '#ef4444' : 'var(--text-secondary)' }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
