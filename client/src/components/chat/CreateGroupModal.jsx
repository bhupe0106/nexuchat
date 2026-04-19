import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Users, Check, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI, conversationAPI } from '../../services/api';
import useChatStore from '../../store/chatStore';

export default function CreateGroupModal({ onClose }) {
  const { fetchConversations, setActiveConversation } = useChatStore();
  const [step, setStep] = useState(1); // 1=select members, 2=group name
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    userAPI.getAll().then((r) => setAllUsers(r.data.users)).catch(() => {});
  }, []);

  const filtered = allUsers.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSelect = (user) => {
    setSelected((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { toast.error('Group name is required'); return; }
    if (selected.length < 2) { toast.error('Add at least 2 members'); return; }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('groupName', groupName.trim());
      formData.append('groupDescription', description.trim());
      selected.forEach((u) => formData.append('participantIds[]', u._id));

      const res = await conversationAPI.createGroup(formData);
      await fetchConversations();
      setActiveConversation(res.data.conversation);
      toast.success(`Group "${groupName}" created! 🎉`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <Hash size={16} className="text-white" />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {step === 1 ? 'Select Members' : 'Name Your Group'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X size={16} /></button>
        </div>

        {step === 1 ? (
          <>
            {/* Search */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="input-field pl-9 py-2 text-sm" />
              </div>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="px-4 py-2 flex flex-wrap gap-2"
                style={{ borderBottom: '1px solid var(--border)' }}>
                {selected.map((u) => (
                  <button key={u._id} onClick={() => toggleSelect(u)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white"
                    style={{ background: 'var(--accent)' }}>
                    <img src={u.avatar} className="w-4 h-4 rounded-full" />
                    {u.username} <X size={10} />
                  </button>
                ))}
              </div>
            )}

            {/* User list */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((u) => {
                const isSelected = selected.some((s) => s._id === u._id);
                return (
                  <button key={u._id} onClick={() => toggleSelect(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.bio || u.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-transparent' : 'border-[var(--border)]'}`}
                      style={{ background: isSelected ? 'var(--accent)' : 'transparent' }}>
                      {isSelected && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { if (selected.length < 2) { toast.error('Select at least 2 members'); return; } setStep(2); }}
                className="btn-primary w-full">
                Next ({selected.length} selected)
              </button>
            </div>
          </>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent)' }}>
                <Users size={28} className="text-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Group Name *
              </label>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Team Alpha"
                className="input-field" maxLength={50} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description (optional)
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this group about?"
                className="input-field resize-none" rows={2} maxLength={200} />
            </div>

            <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              <Users size={14} style={{ color: 'var(--accent)' }} />
              {selected.length} members: {selected.map((u) => u.username).join(', ')}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
