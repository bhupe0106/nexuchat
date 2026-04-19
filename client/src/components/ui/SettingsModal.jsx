import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, Camera, User, Globe, Bell, BellOff, Save, Loader2,
  Palette, Key, CheckCircle, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import ThemeSwitcher from './ThemeSwitcher';

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'zh', label: '🇨🇳 Chinese' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'ko', label: '🇰🇷 Korean' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'ru', label: '🇷🇺 Russian' },
  { code: 'it', label: '🇮🇹 Italian' },
  { code: 'ta', label: '🇮🇳 Tamil' },
];

export default function SettingsModal({ onClose }) {
  const { user, updateUser } = useAuthStore();
  const { theme } = useThemeStore();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    notifications: user?.notifications !== false,
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Avatar must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('bio', form.bio);
      formData.append('preferredLanguage', form.preferredLanguage);
      formData.append('notifications', form.notifications);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      toast.success('Profile saved! ✅');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Settings</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex" style={{ minHeight: 420 }}>
          {/* Tab nav */}
          <div className="w-36 flex-shrink-0 py-3 flex flex-col gap-1 px-2"
            style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background: tab === id ? 'var(--accent)' : 'transparent',
                  color: tab === id ? 'white' : 'var(--text-secondary)',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-5 overflow-y-auto">

            {/* Profile tab */}
            {tab === 'profile' && (
              <div className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={avatarPreview || user?.avatar}
                      alt={user?.username}
                      className="w-16 h-16 rounded-full object-cover"
                      style={{ border: '3px solid var(--accent)' }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Camera size={12} className="text-white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    <button onClick={() => fileRef.current?.click()}
                      className="text-xs mt-1 font-medium" style={{ color: 'var(--accent)' }}>
                      Change photo
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="input-field text-sm"
                    maxLength={30}
                    placeholder="Your username"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Bio <span style={{ color: 'var(--text-muted)' }}>({form.bio.length}/200)</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="input-field text-sm resize-none"
                    rows={2}
                    maxLength={200}
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Globe size={12} className="inline mr-1" />
                    Translation language
                  </label>
                  <select
                    value={form.preferredLanguage}
                    onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    className="input-field text-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Messages you translate will be converted to this language
                  </p>
                </div>
              </div>
            )}

            {/* Appearance tab */}
            {tab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Color Theme
                  </p>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                    <ThemeSwitcher />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Current theme: <strong style={{ color: 'var(--accent)' }}>{theme}</strong>
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Preview</p>
                  <div className="p-4 rounded-xl space-y-3"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full" style={{ background: 'var(--accent)' }} />
                      <div className="px-3 py-2 rounded-2xl rounded-bl-sm text-xs"
                        style={{ background: 'var(--msg-other)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                        Hey! How's it going?
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="px-3 py-2 rounded-2xl rounded-br-sm text-xs"
                        style={{ background: 'var(--msg-self)', color: 'var(--text-primary)' }}>
                        All good, thanks! 😊
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy tab */}
            {tab === 'privacy' && (
              <div className="space-y-4">
                {/* Notifications toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    {form.notifications
                      ? <Bell size={18} style={{ color: 'var(--accent)' }} />
                      : <BellOff size={18} style={{ color: 'var(--text-muted)' }} />}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Browser Notifications
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Get notified about new messages
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, notifications: !form.notifications })}
                    className="w-11 h-6 rounded-full relative transition-all"
                    style={{ background: form.notifications ? 'var(--accent)' : 'var(--border)' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: form.notifications ? 22 : 2 }}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Account Info</p>
                  <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member since</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>User ID</span>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {user?._id?.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                  <CheckCircle size={14} />
                  Your data is encrypted end-to-end and stored securely.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
