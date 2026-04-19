import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, MessageSquare } from 'lucide-react';
import { userAPI } from '../../services/api';

export default function NewConversationModal({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getAll().then((res) => {
      setAllUsers(res.data.users);
      setUsers(res.data.users);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers(allUsers); return; }
    setUsers(allUsers.filter((u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
    ));
  }, [query, allUsers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Message</h3>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X size={16} /></button>
        </div>

        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="input-field pl-9 py-2 text-sm" />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent)' }} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
            </div>
          ) : (
            users.map((u) => (
              <button key={u._id}
                onClick={() => { onSelect(u._id); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="relative flex-shrink-0">
                  <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  {u.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: 'var(--online)', borderColor: 'var(--bg-secondary)' }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.bio || u.email}</p>
                </div>
                <div className="ml-auto">
                  <MessageSquare size={14} style={{ color: 'var(--accent)' }} />
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
