import { Palette } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

const THEME_COLORS = {
  dark: '#6366f1',
  light: '#6366f1',
  ocean: '#0ea5e9',
  forest: '#22c55e',
  sunset: '#f43f5e',
};

const THEME_LABELS = {
  dark: '🌙 Dark',
  light: '☀️ Light',
  ocean: '🌊 Ocean',
  forest: '🌿 Forest',
  sunset: '🌅 Sunset',
};

export default function ThemeSwitcher() {
  const { theme, themes, setTheme } = useThemeStore();

  return (
    <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="text-xs font-medium mb-2 flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}>
        <Palette size={11} /> Theme
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            title={THEME_LABELS[t]}
            className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
            style={{
              background: THEME_COLORS[t],
              borderColor: theme === t ? 'var(--text-primary)' : 'transparent',
              boxShadow: theme === t ? `0 0 8px ${THEME_COLORS[t]}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
