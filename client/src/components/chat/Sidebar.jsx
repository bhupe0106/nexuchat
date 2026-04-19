import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MessageSquare, Users, Bot, Settings,
  Star, LogOut, ChevronDown, X, Hash, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { userAPI, conversationAPI } from '../../services/api';
import NewConversationModal from './NewConversationModal';
import CreateGroupModal from './CreateGroupModal';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import SettingsModal from '../ui/SettingsModal';

const TAB_ICONS = {
  chats: MessageSquare,
  users: Users,
  ai: Bot,
};

export default function Sidebar({ onOpenAI }) {
  const { user, logout } = useAuthStore();
  const { conversations, activeConversation, setActiveConversation, fetchConversations,
    unreadCounts, openDM } = useChatStore();

  const [tab, setTab] = useState('chats');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showNewConv, setShowNewConv] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab]);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.users);
    } catch (_) {}
  };

  const handleSearch = (q) => {
    setSearch(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await userAPI.search(q);
        setSearchResults(res.data.users);
      } catch (_) {}
    }, 350);
  };

  const handleOpenDM = async (userId) => {
    const conv = await openDM(userId);
    if (conv) { setTab('chats'); setSearch(''); setSearchResults([]); }
  };

  const getConvName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    const other = conv.participants?.find((p) => p._id !== user._id);
    return other?.username || 'Unknown';
  };

  const getConvAvatar = (conv) => {
    if (conv.isGroup) {
      return conv.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.groupName}`;
    }
    const other = conv.participants?.find((p) => p._id !== user._id);
    return other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`;
  };

  const isOnline = (conv) => {
    if (conv.isGroup) return false;
    const other = conv.participants?.find((p) => p._id !== user._id);
    return other?.isOnline;
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const filteredConvs = conversations.filter((c) =>
    getConvName(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Nexus</span>
          {totalUnread > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--accent)', minWidth: 20, textAlign: 'center' }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setShowNewConv(true)} className="btn-ghost p-2 rounded-lg"
            title="New conversation">
            <Plus size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2 rounded-lg flex items-center gap-1">
              <img src={user?.avatar} alt={user?.username}
                className="w-7 h-7 rounded-full object-cover" />
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-52 rounded-xl py-1 z-50 shadow-xl"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <ThemeSwitcher />
                  <button onClick={() => { setMenuOpen(false); setShowSettings(true); }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Settings size={15} /> Settings
                  </button>
                  <button onClick={() => { setMenuOpen(false); logout(); toast.success('Logged out'); }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                    style={{ color: '#ef4444' }}>
                    <LogOut size={15} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search people or chats..."
            className="input-field pl-9 pr-8 py-2 text-sm"
          />
          {search && (
            <button onClick={() => { setSearch(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 mb-3">
        {Object.entries(TAB_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tab === key ? 'text-white' : ''}`}
            style={{
              background: tab === key ? 'var(--accent)' : 'transparent',
              color: tab === key ? 'white' : 'var(--text-muted)',
            }}
          >
            <Icon size={13} /> {key}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2">

        {/* Search results overlay */}
        {search && searchResults.length > 0 && (
          <div className="mb-2">
            <p className="text-xs px-2 py-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              Search results
            </p>
            {searchResults.map((u) => (
              <motion.button
                key={u._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleOpenDM(u._id)}
                className="sidebar-item w-full"
              >
                <div className="relative flex-shrink-0">
                  <img src={u.avatar} alt={u.username} className="avatar w-9 h-9" />
                  {u.isOnline && <span className="online-dot w-2.5 h-2.5" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.bio || u.email}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Chats tab */}
        {tab === 'chats' && (
          <AnimatePresence>
            {filteredConvs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-12">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'No chats found' : 'No conversations yet'}
                </p>
                {!search && (
                  <button onClick={() => setShowNewConv(true)}
                    className="mt-3 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    Start a conversation →
                  </button>
                )}
              </motion.div>
            ) : (
              filteredConvs.map((conv, i) => {
                const unread = unreadCounts[conv._id] || 0;
                const isActive = activeConversation?._id === conv._id;
                const name = getConvName(conv);
                const avatar = getConvAvatar(conv);
                const online = isOnline(conv);

                return (
                  <motion.button
                    key={conv._id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActiveConversation(conv)}
                    className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: 'var(--bg-hover)', borderLeft: `3px solid var(--accent)`, paddingLeft: 9 } : {}}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.isGroup ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: 'var(--accent)' }}>
                          <Hash size={16} />
                        </div>
                      ) : (
                        <>
                          <img src={avatar} alt={name} className="avatar w-10 h-10" />
                          {online && <span className="online-dot" />}
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {conv.lastMessage && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDistanceToNow(new Date(conv.lastMessageAt || conv.updatedAt), { addSuffix: false })}
                            </span>
                          )}
                          {unread > 0 && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: 'var(--accent)', minWidth: 18, textAlign: 'center', fontSize: 10 }}>
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {conv.lastMessage?.content || conv.lastMessage?.type === 'image' ? '📷 Image' :
                          conv.lastMessage?.type === 'audio' ? '🎤 Voice message' :
                            conv.lastMessage?.type === 'file' ? '📎 File' : 'No messages yet'}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div>
            <button onClick={() => setShowNewGroup(true)}
              className="sidebar-item w-full mb-2 border-dashed"
              style={{ border: '1.5px dashed var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}>
                <Plus size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Create Group</span>
            </button>

            {users.map((u) => (
              <motion.button
                key={u._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleOpenDM(u._id)}
                className="sidebar-item w-full"
              >
                <div className="relative flex-shrink-0">
                  <img src={u.avatar} alt={u.username} className="avatar w-9 h-9" />
                  {u.isOnline && <span className="online-dot w-2.5 h-2.5" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  <p className="text-xs" style={{ color: u.isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
                    {u.isOnline ? '● Online' : u.lastSeen
                      ? `Last seen ${formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true })}`
                      : 'Offline'}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* AI tab */}
        {tab === 'ai' && (
          <div className="p-2">
            <button onClick={onOpenAI}
              className="w-full p-4 rounded-xl text-left transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, var(--accent), #7c3aed)` }}>
              <Bot size={24} className="text-white mb-2" />
              <p className="text-white font-semibold">NexusAI Assistant</p>
              <p className="text-white/70 text-xs mt-1">Ask anything, get smart answers powered by GPT</p>
            </button>
            <div className="mt-3 space-y-2">
              {['Summarize chats', 'Smart reply suggestions', 'Sentiment analysis', 'Translate messages'].map((f) => (
                <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewConv && <NewConversationModal onClose={() => setShowNewConv(false)} onSelect={handleOpenDM} />}
      {showNewGroup && <CreateGroupModal onClose={() => setShowNewGroup(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
