import React from 'react';
import { Globe, Copy } from 'lucide-react';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import { HUB_PAGE_TITLE, HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { toastSuccess } from '@core/lib/toast';

export type MasterProductProjectHeaderProps = {
  title: string;
  subtitle?: string;
  /** Valor copiado ao clicar no chip */
  domainUrl: string;
  /** Texto exibido no chip */
  domainLabel: string;
  accentColor?: string;
  toastOnCopy?: string;
  logoUrl?: string | null;
  avatarName?: string;
  /** Substitui o avatar da empresa (ex.: ícone do produto) */
  leading?: React.ReactNode;
  /** Ações extras exibidas à direita do header */
  actions?: React.ReactNode;
};

const CHIP_PRESETS: Record<string, { border: string; bg: string; bgHover: string; borderHover: string }> = {
  '#0061ff': {
    border: '#93C5FD',
    bg: 'linear-gradient(180deg, #F0F7FF 0%, #DBEAFE 100%)',
    bgHover: 'linear-gradient(180deg, #EFF6FF 0%, #BFDBFE 100%)',
    borderHover: '#0061FF',
  },
  '#7c3aed': {
    border: '#C4B5FD',
    bg: 'linear-gradient(180deg, #FAF5FF 0%, #EDE9FE 100%)',
    bgHover: 'linear-gradient(180deg, #F3E8FF 0%, #DDD6FE 100%)',
    borderHover: '#7C3AED',
  },
  '#25d366': {
    border: '#93C5FD',
    bg: 'linear-gradient(180deg, #F0F7FF 0%, #DBEAFE 100%)', // Fallback handled in logic
    bgHover: 'linear-gradient(180deg, #EFF6FF 0%, #BFDBFE 100%)',
    borderHover: '#25D366',
  },
  '#8b5cf6': {
    border: '#C4B5FD',
    bg: 'linear-gradient(180deg, #FAF5FF 0%, #EDE9FE 100%)',
    bgHover: 'linear-gradient(180deg, #F3E8FF 0%, #DDD6FE 100%)',
    borderHover: '#8B5CF6',
  },
  '#f59e0b': {
    border: '#FCD34D',
    bg: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)',
    bgHover: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
    borderHover: '#F59E0B',
  },
};

function chipColors(accent: string) {
  const key = accent.trim().toLowerCase();
  
  // Custom logic for WhatsApp Green and IA Violet if not in preset keys
  if (key === '#25d366') {
    return {
      border: '#92e6b0',
      bg: 'linear-gradient(180deg, #F0FFF4 0%, #DCFCE7 100%)',
      bgHover: 'linear-gradient(180deg, #DCFCE7 0%, #BBF7D0 100%)',
      borderHover: '#25D366',
    };
  }
  if (key === '#8b5cf6') {
    return {
      border: '#C4B5FD',
      bg: 'linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)',
      bgHover: 'linear-gradient(180deg, #EDE9FE 0%, #DDD6FE 100%)',
      borderHover: '#8B5CF6',
    };
  }

  return CHIP_PRESETS[key] ?? CHIP_PRESETS['#0061ff'];
}

/**
 * Cabeçalho do console de produto no Master Hub — mesmo padrão visual de `/master/logta`.
 */
export function MasterProductProjectHeader({
  title,
  subtitle,
  domainUrl,
  domainLabel,
  accentColor = '#0061FF',
  toastOnCopy,
  logoUrl,
  avatarName,
  leading,
  actions,
}: MasterProductProjectHeaderProps) {
  const chip = chipColors(accentColor);
  const copyIconColor = accentColor.toLowerCase() === '#25d366' ? '#16a34a' : accentColor.toLowerCase() === '#8b5cf6' ? '#7c3aed' : accentColor === '#7C3AED' ? '#6D28D9' : accentColor === '#F59E0B' ? '#D97706' : '#2563EB';

  const handleCopy = () => {
    navigator.clipboard.writeText(domainUrl);
    toastSuccess(toastOnCopy ?? `Copiado: ${domainLabel}`);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '11px',
          marginLeft: 0,
          marginRight: 0,
          paddingTop: '20px',
          marginBottom: subtitle ? '10px' : '24px',
        }}
      >
        {leading ?? (
          <HubEntityAvatar
            kind="company"
            src={logoUrl}
            name={avatarName ?? title}
            size={42}
            accent={accentColor}
          />
        )}
        <h2 style={{ ...HUB_PAGE_TITLE, margin: 0 }}>{title}</h2>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCopy();
            }
          }}
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 0,
            marginRight: 0,
            padding: '10px 16px',
            borderRadius: '12px',
            border: `1px solid ${chip.border}`,
            background: chip.bg,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            boxShadow: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = chip.borderHover;
            e.currentTarget.style.background = chip.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = chip.border;
            e.currentTarget.style.background = chip.bg;
          }}
        >
          <Globe size={14} color={accentColor} strokeWidth={2.25} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: accentColor }}>{domainLabel}</span>
          <div
            style={{
              width: '1px',
              height: '12px',
              background:
                accentColor.toLowerCase() === '#25d366'
                  ? 'rgba(37, 211, 102, 0.35)'
                  : accentColor.toLowerCase() === '#8b5cf6'
                    ? 'rgba(139, 92, 246, 0.35)'
                    : accentColor === '#7C3AED'
                      ? 'rgba(124, 58, 237, 0.35)'
                      : accentColor === '#F59E0B'
                        ? 'rgba(245, 158, 11, 0.45)'
                        : 'rgba(0, 97, 255, 0.35)',
              margin: '0 2px',
            }}
            aria-hidden
          />
          <Copy size={12} color={copyIconColor} strokeWidth={2.25} />
        </div>
        {actions && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {actions}
          </div>
        )}
      </div>
      {subtitle ? (
        <p style={{ ...HUB_PAGE_SUBTITLE, marginTop: 0, marginBottom: '24px' }}>{subtitle}</p>
      ) : null}
    </>
  );
}
