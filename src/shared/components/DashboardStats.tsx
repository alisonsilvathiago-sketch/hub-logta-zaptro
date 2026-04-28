import React from 'react';
import StatCard from './StatCard';
import { DollarSign, Zap, Clock, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  metrics?: {
    mrr: string;
    active: number;
    trial: number;
    overdue: number;
  };
}

const S: Record<string, React.CSSProperties> = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }
};

export default function DashboardStats({ metrics }: DashboardStatsProps) {
  const data = metrics || {
    mrr: 'R$ 0,00',
    active: 2,
    trial: 0,
    overdue: 0
  };

  return (
    <div style={S.grid4}>
      <StatCard 
        label="MRR ATIVO" 
        value={data.mrr} 
        icon={DollarSign} 
        trend="+12.5%" 
        color="#6366F1" 
      />
      <StatCard 
        label="ASSINATURAS ATIVAS" 
        value={data.active} 
        icon={Zap} 
        trend="+4.2%" 
        color="#10B981" 
      />
      <StatCard 
        label="EM TRIAL" 
        value={data.trial} 
        icon={Clock} 
        trend="+2.1%" 
        color="#F59E0B" 
      />
      <StatCard 
        label="INADIMPLENTES" 
        value={data.overdue} 
        icon={AlertCircle} 
        trend="Atenção" 
        color="#EF4444" 
      />
    </div>
  );
}
