import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  style?: React.CSSProperties;
  isFeatured?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color = '#6366F1', style, isFeatured }) => {
  const textColor = isFeatured ? '#fff' : color;
  const labelColor = isFeatured ? 'rgba(255,255,255,0.8)' : '#64748B';
  const iconBg = isFeatured ? 'rgba(255,255,255,0.2)' : `${color}10`;
  const trendBg = isFeatured ? 'rgba(255,255,255,0.2)' : (trend?.includes('%') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)');
  const trendColor = isFeatured ? '#fff' : (trend?.includes('%') ? '#10B981' : '#EF4444');

  return (
    <div className="hover-scale" style={{ 
      background: isFeatured ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#fff', 
      borderRadius: '24px', 
      padding: '28px', 
      border: isFeatured ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: isFeatured ? '0 20px 40px rgba(99, 102, 241, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '160px',
      width: '100%',
      boxSizing: 'border-box',
      ...style
    }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ 
            width: '52px', 
            height: '52px', 
            borderRadius: '24px', 
            background: iconBg, 
            color: isFeatured ? '#fff' : color, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
             <Icon size={26} strokeWidth={2.5} />
          </div>
          {trend && (
            <div style={{ 
              padding: '6px 12px', 
              borderRadius: '12px', 
              fontSize: '11px', 
              fontWeight: '800', 
              background: trendBg, 
              color: trendColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
               {trend}
            </div>
          )}
       </div>
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ 
            fontSize: '12px', 
            fontWeight: '700', 
            color: labelColor, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            marginBottom: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{label}</p>
          <h3 style={{ 
            fontSize: '32px', 
            fontWeight: '900', 
            color: textColor, 
            letterSpacing: '-1px', 
            lineHeight: 1.1,
            margin: 0,
            wordBreak: 'break-word'
          }}>{value}</h3>
       </div>
       {/* Subtle Decorative Background Element */}
       <div style={{ 
         position: 'absolute', 
         right: '-15px', 
         bottom: '-15px', 
         opacity: isFeatured ? 0.15 : 0.04,
         color: isFeatured ? '#fff' : color,
         transform: 'rotate(-15deg)',
         pointerEvents: 'none'
       }}>
          <Icon size={110} />
       </div>
    </div>
  );
};

export default StatCard;
