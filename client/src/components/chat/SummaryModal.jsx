// SummaryModal.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function SummaryModal({ conversationId, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await aiAPI.summarize(conversationId);
        setSummary(res.data.summary);
        setMsgCount(res.data.messageCount || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to summarize');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [conversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}>
            <FileText size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Chat Summary</h3>
            {msgCount > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Based on {msgCount} messages
            </p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing conversation with AI...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={11} /> Powered by NexusAI
          </p>
          <button onClick={onClose} className="btn-primary text-sm px-4 py-1.5">Close</button>
        </div>
      </motion.div>
    </div>
  );
}

export default SummaryModal;
