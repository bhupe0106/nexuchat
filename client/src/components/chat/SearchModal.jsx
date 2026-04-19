import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Search, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { messageAPI } from '../../services/api';
import useChatStore from '../../store/chatStore';

export default function SearchModal({ conversationId, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeout = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(timeout.current);
    if (!q.trim()) { setResults([]); return; }
    timeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await messageAPI.search(q, conversationId);
        setResults(res.data.messages);
      } catch (_) {}
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {loading && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)' }} />}
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query && !loading && (
            <div className="text-center py-12">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages found</p>
            </div>
          )}

          {results.map((msg) => (
            <motion.div key={msg._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <img
                src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username}`}
                alt={msg.sender?.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                    {msg.sender?.username}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}

          {!query && (
            <div className="text-center py-12">
              <Search size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Type to search messages</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
