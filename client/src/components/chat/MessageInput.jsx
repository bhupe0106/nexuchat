import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Paperclip, Mic, MicOff, Image, X,
  Smile, Sparkles, StopCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messageAPI, aiAPI } from '../../services/api';
import { emitFileMessage, emitSendMessage } from '../../services/socket';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import useTyping from '../../hooks/useTyping';

const EMOJIS = ['😊','😂','❤️','👍','🔥','🎉','😎','🤔','👏','✨','💯','😍','🙏','😅','🤝'];

export default function MessageInput({ conversationId }) {
  const { user } = useAuthStore();
  const { addMessage } = useChatStore();
  const { startTyping, stopTyping } = useTyping(conversationId);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lastConvId, setLastConvId] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const suggestionsTimeout = useRef(null);

  // Reset on conversation change
  useEffect(() => {
    if (conversationId !== lastConvId) {
      setText('');
      setSelectedFile(null);
      setPreview(null);
      setSuggestions([]);
      setShowEmoji(false);
      setLastConvId(conversationId);
    }
  }, [conversationId, lastConvId]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [text]);

  const fetchSuggestions = useCallback(async (lastMsg) => {
    if (!lastMsg) return;
    clearTimeout(suggestionsTimeout.current);
    suggestionsTimeout.current = setTimeout(async () => {
      try {
        const res = await aiAPI.suggestions(lastMsg);
        setSuggestions(res.data.suggestions || []);
      } catch (_) {}
    }, 600);
  }, []);

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || sending) return;
    setSending(true);
    stopTyping();
    setSuggestions([]);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('conversationId', conversationId);
        if (text.trim()) formData.append('content', text.trim());

        const res = await messageAPI.sendMessage(formData);
        emitFileMessage({ conversationId, messageId: res.data.message._id });
        addMessage(res.data.message);
        setSelectedFile(null);
        setPreview(null);
      } else {
        const tempId = Date.now().toString();
        const optimistic = {
          _id: tempId,
          tempId,
          conversationId,
          content: text.trim(),
          type: 'text',
          sender: { _id: user._id, username: user.username, avatar: user.avatar },
          createdAt: new Date().toISOString(),
          readBy: [],
          reactions: [],
          sentiment: { label: 'neutral', score: 0 },
        };
        addMessage(optimistic);
        emitSendMessage({ conversationId, content: text.trim(), type: 'text', tempId });

        // Async sentiment analysis
        aiAPI.sentiment(text.trim()).then((res) => {
          useChatStore.getState().updateMessage(tempId, { sentiment: res.data.sentiment });
        }).catch(() => {});
      }

      setText('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) startTyping();
    else stopTyping();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error('File too large (max 25MB)'); return; }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        try {
          const res = await messageAPI.sendMessage(formData);
          emitFileMessage({ conversationId, messageId: res.data.message._id });
          addMessage(res.data.message);
        } catch { toast.error('Failed to send voice message'); }
        clearInterval(recordTimerRef.current);
        setRecordDuration(0);
      };
      mr.start();
      setRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex-shrink-0 px-4 py-3"
      style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>

      {/* File preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            {preview ? (
              <img src={preview} className="w-12 h-12 rounded-lg object-cover" alt="Preview" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--bg-primary)' }}>
                <Paperclip size={20} style={{ color: 'var(--accent)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button onClick={() => { setSelectedFile(null); setPreview(null); }}
              className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart reply suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && !text && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex gap-2 mb-3 flex-wrap">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setText(s); textareaRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <Sparkles size={11} style={{ color: 'var(--accent)' }} /> {s}
              </motion.button>
            ))}
            <button onClick={() => setSuggestions([])} className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording UI */}
      {recording ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(recordDuration)}
          </span>
          <div className="flex gap-0.5 items-end flex-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full"
                style={{
                  height: `${Math.sin(Date.now() / 200 + i) * 8 + 12}px`,
                  background: 'var(--accent)',
                  opacity: 0.8,
                  transition: 'height 0.1s'
                }} />
            ))}
          </div>
          <button onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white"
            style={{ background: '#ef4444' }}>
            <StopCircle size={14} /> Stop
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {/* Emoji */}
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)}
              className="btn-ghost p-2.5 rounded-xl flex-shrink-0">
              <Smile size={20} style={{ color: showEmoji ? 'var(--accent)' : 'var(--text-muted)' }} />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 p-3 rounded-2xl shadow-2xl z-20"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', width: 220 }}>
                  <div className="grid grid-cols-5 gap-1">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => { setText((t) => t + e); setShowEmoji(false); textareaRef.current?.focus(); }}
                        className="text-xl w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File */}
          <button onClick={() => fileInputRef.current?.click()}
            className="btn-ghost p-2.5 rounded-xl flex-shrink-0">
            <Paperclip size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
            onChange={handleFileChange} />

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="input-field resize-none py-2.5 pr-3 leading-relaxed"
              style={{ minHeight: 42, maxHeight: 120 }}
            />
          </div>

          {/* Voice or Send */}
          {text.trim() || selectedFile ? (
            <motion.button
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              onClick={handleSend}
              disabled={sending}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 12px var(--accent-glow)' }}>
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={18} className="text-white" />}
            </motion.button>
          ) : (
            <button onClick={startRecording}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <Mic size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
