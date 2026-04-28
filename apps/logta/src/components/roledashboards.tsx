import React from 'react';
import { 
  Users, Truck, DollarSign, Package, 
  TrendingUp, Activity, BarChart2, 
  UserPlus, UserMinus, Navigation, 
  AlertCircle, ChevronRight, PieChart,
  Target, Briefcase, FileText
} from 'lucide-react';

interface MetricProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  color: string;
}

import MetricCard from './MetricCard';
import FleetMap from './FleetMap';

// --- DASHBOARD RH ---
export const RHDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <MetricCard title="Total Equipe" value="124" trend="+4" icon={Users} iconColor="#000000" />
      <MetricCard title="Novas Admissões" value="8" trend="+2" icon={UserPlus} iconColor="#10B981" />
      <MetricCard title="Desligamentos" value="2" trend="-1" icon={UserMinus} iconColor="#EF4444" />
      <MetricCard title="Vagas Abertas" value="15" icon={Briefcase} iconColor="#F59E0B" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
      <div className="card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="var(--primary)" /> Clima Organizacional
        </h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '15px', padding: '10px' }}>
           {[60, 85, 45, 90, 75].map((h, i) => (
             <div key={i} style={{ flex: 1, backgroundColor: 'var(--primary-light)', height: `${h}%`, borderRadius: '8px 8px 0 0', position: 'relative' }}>
                <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700' }}>Set {i+1}</span>
             </div>
           ))}
        </div>
      </div>
      <div className="card">
         <h3 style={{ marginBottom: '20px' }}>Próximos Treinamentos</h3>
         {[1, 2, 3].map(i => (
           <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-app)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '700', fontSize: '14px' }}>Segurança no Trabalho V.{i}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>15 Colaboradores Inscritos</p>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
           </div>
         ))}
      </div>
    </div>
  </div>
);

// --- DASHBOARD LOGÍSTICA ---
export const LogisticsDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <MetricCard title="Entregas de Hoje" value="842" trend="+12%" icon={Target} iconColor="#000000" />
      <MetricCard title="Rotas Ativas" value="48" trend="Live" icon={Navigation} iconColor="#10B981" />
      <MetricCard title="Veículos em Trânsito" value="32" icon={Truck} iconColor="#F59E0B" />
      <MetricCard title="Alertas Críticos" value="3" trend="Urgente" icon={AlertCircle} iconColor="#EF4444" trendNeg />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
      <div className="card">
         <h3 style={{ marginBottom: '20px', fontWeight: '950', color: '#1e293b' }}>Status de Frota</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Operacional', 'Em Manutenção', 'Aguardando Carga'].map((status, i) => (
              <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#64748b' }}>
                    <span>{status}</span>
                    <span style={{color: '#1e293b'}}>{i === 0 ? '85%' : i === 1 ? '10%' : '5%'}</span>
                 </div>
                 <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: i === 0 ? '85%' : i === 1 ? '10%' : '5%', backgroundColor: i === 0 ? '#10B981' : i === 1 ? '#EF4444' : '#F59E0B' }} />
                 </div>
              </div>
            ))}
         </div>
         <div style={{marginTop: '32px', padding: '20px', backgroundColor: 'var(--primary-light)', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.1)'}}>
            <p style={{margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--primary)'}}>Frota 100% Conectada</p>
            <p style={{margin: '4px 0 0', fontSize: '11px', color: '#6d28d9', opacity: 0.8}}>Monitoramento de Telemetria ativo em todos os veículos.</p>
         </div>
      </div>
      
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
         <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9'}}>
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '10px'}}><Navigation size={18} color="var(--primary)" /> Torre de Monitoramento Ativa</h3>
         </div>
         <div style={{height: '400px'}}>
            <FleetMap />
         </div>
      </div>
    </div>
  </div>
);

// --- DASHBOARD FINANCEIRO ---
export const FinanceDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <MetricCard title="Receita Mensal" value="R$ 142.500" trend="+15%" icon={DollarSign} iconColor="#10B981" />
      <MetricCard title="Despesas Operacionais" value="R$ 68.200" trend="-5%" icon={TrendingUp} iconColor="#EF4444" trendNeg />
      <MetricCard title="Saldo Projetado" value="R$ 74.300" icon={Activity} iconColor="#000000" />
      <MetricCard title="Margem de Lucro" value="52%" icon={PieChart} iconColor="#F59E0B" />
    </div>

    <div className="card">
       <h3 style={{ marginBottom: '20px' }}>Fluxo de Caixa (Últimos 7 dias)</h3>
       <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          {[30, 45, 55, 40, 70, 85, 60].map((h, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'var(--primary)', height: `${h}%`, borderRadius: '4px', opacity: 0.8 }} />
          ))}
       </div>
    </div>
  </div>
);

// --- DASHBOARD CRM ---
export const CRMDashboard = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
         <div style={{padding: '24px', borderBottom: '1px solid #f1f5f9'}}>
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '10px'}}><MapPin size={18} color="var(--primary)" /> Distribuição de Leads Regionais</h3>
         </div>
         <div style={{height: '350px'}}>
            <FleetMap />
         </div>
      </div>
      <div className="card">
         <h3 style={{ marginBottom: '20px', fontWeight: '950' }}>Conversão por Canal</h3>
         <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {['WhatsApp', 'Indicação', 'Site', 'Cold Call'].map((c, i) => (
              <div key={c} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                 <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontWeight: '800'}}>
                       <span>{c}</span>
                       <span>{85 - i*15}%</span>
                    </div>
                    <div style={{height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px'}}>
                       <div style={{height: '100%', width: `${85 - i*15}%`, backgroundColor: 'var(--primary)', borderRadius: '3px'}} />
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  </div>
);

// --- DASHBOARD ESTOQUE ---
export const InventoryDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <MetricCard title="SKUs Ativos" value="1.240" icon={Package} iconColor="#000000" />
      <MetricCard title="Itens em Falta" value="12" icon={AlertCircle} iconColor="#EF4444" trendNeg />
      <MetricCard title="Giro de Estoque" value="4.2x" icon={Activity} iconColor="#10B981" />
      <MetricCard title="Valor Total" value="R$ 450k" icon={DollarSign} iconColor="#F59E0B" />
    </div>
  </div>
);
