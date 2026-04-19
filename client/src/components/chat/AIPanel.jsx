import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Trash2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { aiAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const STARTER_PROMPTS = [
  '✍️ Help me write a professional email',
  '🐛 Debug this code snippet',
  '💡 Brainstorm ideas for my project',
  '📝 Summarize a topic for me',
  '🌐 Translate a phrase',
  '🧮 Solve a math problem',
];

export default function AIPanel({ onClose }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey **${user?.username}**! 👋 I'm **NexusAI**, your intelligent assistant. I can help you write, code, analyze, translate, and much more. What's on your mind?`,
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (msgText = input) => {
    const trimmed = msgText.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, time: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build history for context (last 10)
    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await aiAPI.chat(trimmed, history);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply, time: new Date().toISOString() },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'AI service unavailable. Please configure GORKAPI_BASE_URL in .env';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ ${errMsg}`, time: new Date().toISOString(), isError: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = async (content, idx) => {
    await navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied!');
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! Ready for a fresh start. How can I help you, **${user?.username}**?`,
      time: new Date().toISOString(),
    }]);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full w-full md:w-96 border-l"
      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>NexusAI</h3>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--online)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--online)' }} />
            Always available
          </p>
        </div>
        <button onClick={clearChat} className="btn-ghost p-2 rounded-lg" title="Clear chat">
          <Trash2 size={16} />
        </button>
        <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Starter prompts (shown initially) */}
        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-2 mb-4">
            {STARTER_PROMPTS.map((p, i) => (
              <motion.button
                key={p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => sendMessage(p.replace(/^[^\s]+ /, ''))}
                className="text-left p-2.5 rounded-xl text-xs transition-all hover:scale-105"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {p}
              </motion.button>
            ))}
          </motion.div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
                <Bot size={14} className="text-white" />
              </div>
            )}

            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm relative group ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'} ${msg.isError ? 'opacity-80' : ''}`}
                style={{
                  background: msg.role === 'user' ? 'var(--msg-self)' : 'var(--msg-other)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  color: 'var(--text-primary)',
                }}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute -top-2 -right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    {copied === idx ? <Check size={11} style={{ color: 'var(--online)' }} /> : <Copy size={11} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                )}
              </div>
              <span className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(msg.time), 'HH:mm')}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Loading animation */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
                <Bot size={14} className="text-white" />
              </div>
              <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
                style={{ background: 'var(--msg-other)', border: '1px solid var(--border)' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask NexusAI anything..."
              rows={1}
              className="input-field resize-none py-2.5 pr-3 leading-relaxed"
              style={{ minHeight: 42, maxHeight: 120 }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} className="text-white" />}
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <Sparkles size={10} className="inline mr-1" />
          Powered by GPT · Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}
