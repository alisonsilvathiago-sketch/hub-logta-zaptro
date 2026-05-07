import React from 'react';
import { 
  Users, Database, Shield, Layout, Settings, 
  ChevronRight, ArrowUpRight, Activity
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import AIInsightBanner from '../../components/AIInsightBanner';

const MasterHubDashboard: React.FC = () => {
  const { profile } = useAuth();
  const userName = profile?.full_name?.split(' ')[0] || 'Master';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* HUB MASTER HEADER */}
      <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Hub Master Command</h1>
          <p style={{ color: '#64748b', fontSize: 16, marginTop: 4 }}>Gerenciamento global do ecossistema Logta, Zaptro e LogDock.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: '#fff', padding: '10px 20px', borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            <Activity size={16} color="#10b981" /> Sistema Saudável
          </div>
        </div>
      </div>

      {/* HUB MONITORING GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 48 }}>
        
        <div className="premium-card" style={{ background: '#fff' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Users size={20} color="#3b82f6" />
              </div>
              <ArrowUpRight size={18} color="#94a3b8" />
           </div>
           <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Empresas Ativas</div>
           <div style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', marginTop: 4 }}>124</div>
        </div>

        <div className="premium-card" style={{ background: '#fff' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, background: '#f0fdf4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Database size={20} color="#10b981" />
              </div>
              <ArrowUpRight size={18} color="#94a3b8" />
           </div>
           <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Storage Global</div>
           <div style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', marginTop: 4 }}>1.2 TB</div>
        </div>

        <div className="premium-card" style={{ background: '#fff' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, background: '#fef2f2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Shield size={20} color="#ef4444" />
              </div>
              <ArrowUpRight size={18} color="#94a3b8" />
           </div>
           <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Incidentes Seg.</div>
           <div style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', marginTop: 4 }}>0</div>
        </div>

      </div>

      {/* PRODUCTS ACCESS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
         
         <div className="premium-card">
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24 }}>Acesso aos Produtos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {[
                 { name: 'Logta SaaS', desc: 'Gestão de logística e frotas', color: '#6366f1', status: 'Online' },
                 { name: 'Zaptro CRM', desc: 'Gestão de vendas e clientes', color: '#10b981', status: 'Online' },
                 { name: 'LogDock', desc: 'Gestão documental inteligente', color: '#f59e0b', status: 'Updating' }
               ].map((product, i) => (
                 <div key={i} style={{ padding: '20px', borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: product.color }}></div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 800, fontSize: 16 }}>{product.name}</div>
                       <div style={{ fontSize: 13, color: '#64748b' }}>{product.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <span style={{ fontSize: 11, fontWeight: 800, color: product.status === 'Online' ? '#10b981' : '#f59e0b' }}>{product.status.toUpperCase()}</span>
                       <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <AIInsightBanner 
              type="ai"
              title="Global Health"
              description="Todo o ecossistema está operando com 99.9% de uptime."
              badge="Hub Master"
              compact
            />

            <div className="premium-card" style={{ background: '#0f172a', color: '#fff', border: 'none' }}>
               <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Infrastructure</h3>
               <p style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>Gerencie instâncias de banco de dados e servidores globais.</p>
               <button style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer' }}>Console Master</button>
            </div>
         </div>

      </div>

    </div>
  );
};

export default MasterHubDashboard;
