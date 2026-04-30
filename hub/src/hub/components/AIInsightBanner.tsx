import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, CheckCircle, Brain, ArrowRight } from 'lucide-react';

type AIInsightType = 'info' | 'warning' | 'error' | 'success' | 'ai';

interface AIInsightBannerProps {
  type?: AIInsightType;
  title: string;
  description?: string;
  actionLabel?: string;
  href?: string;
  badge?: string;
  style?: React.CSSProperties;
}

const iconMap = {
  info: <Info size={20} />,
  warning: <AlertTriangle size={20} />,
  error: <AlertTriangle size={20} />,
  success: <CheckCircle size={20} />,
  ai: <Brain size={20} />,
};

const colorMap = {
  info: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', iconBg: '#0284C7' },
  warning: { bg: '#FFFBEB', text: '#92400E', border: '#FEF3C7', iconBg: '#D97706' },
  error: { bg: '#FEF2F2', text: '#991B1B', border: '#FEE2E2', iconBg: '#DC2626' },
  success: { bg: '#F0FDF4', text: '#166534', border: '#DCFCE7', iconBg: '#16A34A' },
  ai: { bg: 'var(--bg-overlay)', text: 'var(--secondary)', border: 'var(--border)', iconBg: 'var(--secondary)' },
};

const AIInsightBanner: React.FC<AIInsightBannerProps> = ({
  type = 'ai',
  title,
  description,
  actionLabel,
  href,
  badge,
  style
}) => {
  const navigate = useNavigate();
  const theme = colorMap[type];

  return (
    <div
      onClick={() => href && navigate(href)}
      style={{
        width: '100%',
        cursor: href ? 'pointer' : 'default',
        borderRadius: '24px',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        transition: 'all 0.2s',
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        marginBottom: '32px',
        ...style
      }}
      onMouseEnter={(e) => {
        if (href) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (href) e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{ 
          backgroundColor: theme.iconBg, 
          padding: '12px', 
          borderRadius: '16px', 
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 16px ${theme.iconBg}30`
        }}>
          {iconMap[type]}
        </div>
        <div>
          <p style={{ 
            fontSize: '17px', 
            fontWeight: '800', 
            color: '#0F172A', 
            margin: '0 0 4px 0',
            letterSpacing: '-0.5px'
          }}>
            {title}
          </p>
          {description && (
            <p style={{ 
              fontSize: '14px', 
              color: theme.text, 
              fontWeight: '600', 
              margin: 0,
              lineHeight: '1.5',
              opacity: 0.9
            }}>
              {description}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {badge && (
          <span style={{ 
            fontSize: '11px', 
            backgroundColor: '#FFF', 
            color: theme.iconBg,
            padding: '8px 16px', 
            borderRadius: '12px', 
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
          }}>
            {badge}
          </span>
        )}

        {actionLabel && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '13px', 
            fontWeight: '800', 
            color: theme.iconBg,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {actionLabel}
            <ArrowRight size={16} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightBanner;
