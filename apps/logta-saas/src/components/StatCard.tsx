import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export type StatCardProps = {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  /** Classes extras no valor principal (cor 25px/azul vêm de `style` e não mudam). */
  valueClassName?: string;
};

export const StatCard = ({
  title,
  value,
  trend,
  icon: Icon,
  subtitle,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-900',
  valueClassName = '',
}: StatCardProps) => (
  <div className="logta-stat-card group text-left transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center`}>
        <Icon className={iconColor} size={24} />
      </div>
      {trend ? (
        <span className={`text-xs font-bold flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      ) : null}
    </div>
    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
    <h3
      className={['font-black leading-tight', valueClassName].filter(Boolean).join(' ')}
      style={{ color: 'rgba(0, 83, 250, 1)', fontSize: '25px' }}
    >
      {value}
    </h3>
    {subtitle ? (
      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-normal">{subtitle}</p>
    ) : null}

    <div className="pointer-events-none absolute bottom-8 right-7 opacity-[0.04] transition-opacity group-hover:opacity-[0.06] text-gray-900">
      <Icon size={120} />
    </div>
  </div>
);
