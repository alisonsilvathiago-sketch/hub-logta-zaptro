import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HubThemeMode, useHubTheme } from '@core/context/HubThemeContext';

const OPTIONS: Array<{ id: HubThemeMode; label: string; icon: typeof Sun }> = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export const HubProfileThemePicker: React.FC = () => {
  const { mode, setMode } = useHubTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }} role="group" aria-label="Tema da interface">
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--hub-text-subtle)',
          padding: '8px 10px 4px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Tema
      </div>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={`hub-theme-option${active ? ' is-active' : ''}`}
            onClick={() => setMode(opt.id)}
            aria-pressed={active}
          >
            <span className="hub-theme-option__radio" aria-hidden />
            <Icon size={15} strokeWidth={2} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default HubProfileThemePicker;
