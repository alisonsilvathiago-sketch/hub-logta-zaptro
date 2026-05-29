import React, { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import WhatsAppConfig from './WhatsAppConfig';
import ZaptroAutomation from './ZaptroAutomation';
import ZaptroTeam from './ZaptroTeam';
import ZaptroSettingsApiTab from './ZaptroSettingsApiTab';
import ZaptroUserPreferences from '../components/Zaptro/ZaptroUserPreferences';
import { ZaptroWhiteLabelInner } from './ZaptroWhiteLabel';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ZAPTRO_FIELD_BG, ZAPTRO_SECTION_BORDER } from '../constants/zaptroUi';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import { zaptroSettingsTabToPageId } from '../utils/zaptroPagePermissionMap';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import ZaptroChatbotSettingsTab from '../app/ZaptroChatbotSettingsTab';

const TAB_KEYS = ['config', 'automation', 'chatbot', 'marca', 'api', 'notificacoes'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export const ZaptroSettingsInner: React.FC = () => {
  const { palette } = useZaptroTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isMaster } = useAuth();
  const { company } = useTenant();
  const rawParam = searchParams.get('tab') || 'config';
  const normalized = rawParam === 'branding' ? 'marca' : rawParam;
  const activeTab: TabKey = TAB_KEYS.includes(normalized as TabKey) ? (normalized as TabKey) : 'config';

  const tabs = useMemo(
    () =>
      [
        { id: 'config' as const, label: 'Configuração' },
        { id: 'automation' as const, label: 'Automação / Fluxos' },
        { id: 'chatbot' as const, label: 'Chatbot' },
        { id: 'notificacoes' as const, label: 'Notificações' },
        { id: 'marca' as const, label: 'Personalizar empresa' },
        { id: 'api' as const, label: 'Integrações API' },
      ] as const,
    [],
  );

  const tabAllowed = useCallback(
    (id: TabKey) => {
      if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
      if (id === 'marca' && !isZaptroBrandingEntitledByPlan(company)) return false;
      return hasZaptroGranularPermission(profile?.role, profile?.permissions, zaptroSettingsTabToPageId(id));
    },
    [isMaster, profile?.role, profile?.permissions, company],
  );

  const visibleTabs = useMemo(() => tabs.filter((t) => tabAllowed(t.id)), [tabs, tabAllowed]);

  const setTab = (id: TabKey) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (visibleTabs.some((t) => t.id === activeTab)) return;
    const next = visibleTabs[0].id;
    setSearchParams({ tab: next }, { replace: true });
  }, [activeTab, visibleTabs, setSearchParams]);

  const isDark = palette.mode === 'dark';
  /** Neutro quente Zaptro (#f4f4f4), não zinc #f4f4f5. */
  const trackBg = isDark ? 'rgba(255,255,255,0.06)' : ZAPTRO_FIELD_BG;
  const tabBorder = isDark ? 'rgba(255,255,255,0.1)' : ZAPTRO_SECTION_BORDER;
  /** Abas inativas: cinza legível sobre o trilho claro (evita slate azulado do textMuted). */
  const tabLabelInactive = isDark ? palette.textMuted : '#525252';

  /** Uma só largura máxima em todas as abas — evita reflow da grelha e sensação de “aba maior” ao entrar em Automação. */
  return (
    <div className="zaptro-settings-shell" style={{ width: '100%', maxWidth: '100%', margin: 0, boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 25, fontWeight: 600, letterSpacing: '-0.8px', color: palette.text }}>
          Configurações
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: '#C9C9C9', fontWeight: 500, lineHeight: 1.5 }}>
          Conexão WhatsApp, automação, chatbot, marca e integrações API.
        </p>
      </header>

      <div className="zaptro-settings-layout">
        <div
          role="tablist"
          aria-label="Secções de configuração"
          className="zaptro-settings-nav"
          style={{
            flexShrink: 0,
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 8,
            borderRadius: 18,
            backgroundColor: trackBg,
            border: `1px solid ${tabBorder}`,
            boxSizing: 'border-box',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 20,
            zIndex: 10,
          }}
        >
          {visibleTabs.map(({ id, label }) => {
            const on = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                id={`zaptro-settings-tab-${id}`}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  minWidth: 0,
                  minHeight: 0,
                  padding: '14px 12px',
                  boxSizing: 'border-box',
                  borderRadius: 14,
                  border: on ? `1px solid ${isDark ? '#fafafa' : '#18181b'}` : '1px solid transparent',
                  backgroundColor: on ? (isDark ? '#111111' : '#FFFFFF') : 'transparent',
                  color: on ? palette.text : tabLabelInactive,
                  boxShadow: on ? (isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)') : 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {id === 'notificacoes' && <Bell size={18} />}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: 1.35,
                    textAlign: 'left',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          aria-labelledby={`zaptro-settings-tab-${activeTab}`}
          className="zaptro-settings-panel"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 200,
            borderRadius: 20,
            border: `1px solid ${tabBorder}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
            padding:
              activeTab === 'config'
                ? '28px 24px 36px'
                : '24px 24px 36px',
            boxSizing: 'border-box',
          }}
        >
          {activeTab === 'config' && <WhatsAppConfig />}
          {activeTab === 'automation' && <ZaptroAutomation hideLayout activateAllOnMount />}
          {activeTab === 'chatbot' && <ZaptroChatbotSettingsTab />}
          {activeTab === 'notificacoes' && <ZaptroUserPreferences />}
          {activeTab === 'marca' && <ZaptroWhiteLabelInner embedded />}
          {activeTab === 'api' && <ZaptroSettingsApiTab />}
        </div>
      </div>

      <style>{`
        .zaptro-settings-layout {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: 24px;
          width: 100%;
        }
        @media (max-width: 960px) {
          .zaptro-settings-layout {
            flex-direction: column;
            align-items: stretch;
          }
          .zaptro-settings-nav {
            width: 100% !important;
            flex-direction: row !important;
            flex-wrap: wrap;
            align-self: stretch !important;
          }
          .zaptro-settings-nav button[role="tab"] {
            flex: 1 1 calc(50% - 4px);
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
};

const ZaptroSettings: React.FC = () => {
  return (
    <ZaptroLayout contentFullWidth>
      <ZaptroSettingsInner />
    </ZaptroLayout>
  );
};

export default ZaptroSettings;
