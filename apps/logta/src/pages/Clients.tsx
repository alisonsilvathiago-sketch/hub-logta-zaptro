import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@shared/components/StatCard';
import SEOManager from '@shared/components/SEOManager';
import { supabase } from '../lib/supabase';
import { 
  Users, Building2, Search, FileText, Target, CheckCircle2, LayoutDashboard,
  Filter, MoreVertical, MessageCircle, Clock, ExternalLink, DollarSign, CreditCard, RotateCcw, XCircle, Zap, Plus, RefreshCw, Loader2, Shield
} from 'lucide-react';
import Modal from '@shared/components/Modal';

const COLORS = {
  primary: '#1E293B',
  accent: '#6366F1',
  muted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 60px', color: '#0F172A', fontFamily: 'Inter, sans-serif', background: 'var(--content-bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px', color: '#0F172A' },
  subtitle: { color: '#64748B', fontSize: '14px' },
  card: { background: '#ffffff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '24px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '16px 20px', borderBottom: '1px solid #F1F5F9', color: '#94A3B8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left' },
  td: { padding: '20px', borderBottom: '1px solid #F1F5F9', fontSize: '14px', verticalAlign: 'middle', color: '#334155' },
  badge: (bg: string, color: string) => ({ padding: '4px 12px', borderRadius: '24px', fontSize: '10px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, color: color }),
  input: { width: '100%', padding: '14px 18px', borderRadius: '16px', border: '1.5px solid #F1F5F9', fontSize: '14px', outline: 'none', background: '#F8FAFC', color: '#0F172A', transition: 'all 0.2s', fontWeight: '500' },
  label: { fontSize: '11px', fontWeight: '900', color: '#6366F1', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '0.8px' },
};

export default function ClientesManagement() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [newClient, setNewClient] = useState({ name: '', email: '', cnpj: '', plan: 'Combo Pro' });

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*, subscriptions(status, plan_id, product_name)')
      .order('created_at', { ascending: false });
    
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAddCliente = async () => {
    if (!newClient.name || !newClient.email) return;
    setLoading(true);
    const { data, error } = await supabase.from('companies').insert({
      name: newClient.name,
      email: newClient.email,
      cnpj: newClient.cnpj,
      status: 'active'
    }).select().single();

    if (!error && data) {
      await supabase.from('subscriptions').insert({
        company_id: data.id,
        status: 'active',
        plan_id: 'pro-combo'
      });
      setIsAddModalOpen(false);
      fetchClients();
    }
    setLoading(false);
  };

  const filteredItems = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleImpersonate = async (clientId: string, source: string) => {
    try {
      if (!clientId) {
        (window as any).showToast('error', 'ID da empresa não encontrado.');
        return;
      }

      setLoading(true);
      const product = source?.toUpperCase().includes('ZAPTRO') ? 'ZAPTRO' : 'LOGTA';
      
      const { data, error } = await supabase.functions.invoke('hub-core/generate-sso', {
        body: { company_id: clientId },
        method: 'POST',
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Erro na comunicação com o servidor.');
      }

      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      let baseUrl = '';
      if (product === 'ZAPTRO') {
        baseUrl = isDev ? 'http://localhost:5174' : 'https://app.zaptro.com.br';
      } else {
        baseUrl = isDev ? 'http://localhost:5173' : 'https://app.logta.com.br';
      }

      window.open(`${baseUrl}/auth/sso?token=${data.token}`, '_blank');
    } catch (err: any) {
      console.error('Erro SSO:', err);
      (window as any).showToast('error', `Falha no Acesso Master: ${err.message || 'Verifique se o cliente possui e-mail cadastrado.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <SEOManager title="Master | Gestão de Clientes" />

      {/* MODAL ADICIONAR NOVO CLIENTE (PADRONIZADO) */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Ativar Nova Empresa"
        subtitle="Preencha os dados básicos para liberar o acesso ao ecossistema."
        icon={<Building2 size={20} />}
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={S.label}>Nome da Empresa</label>
            <input style={S.input} value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Ex: Logta Transportes" />
          </div>
          <div>
            <label style={S.label}>E-mail Administrativo</label>
            <input style={S.input} value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="financeiro@empresa.com" />
          </div>
          <div>
            <label style={S.label}>CNPJ</label>
            <input style={S.input} value={newClient.cnpj} onChange={e => setNewClient({...newClient, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            <button onClick={handleAddCliente} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #4338CA)', color: '#fff', fontWeight: '900', cursor: 'pointer', fontSize: '14px', boxShadow: '0 8px 20px rgba(99,102,241,0.3)', textTransform: 'uppercase' }}>ATIVAR CONTA AGORA</button>
          </div>
        </div>
      </Modal>
      
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Base de Clientes Master</h1>
          <p style={S.subtitle}>Controle centralizado de todas as empresas e assinaturas ativas.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchClients} style={{ width: 44, height: 44, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RotateCcw size={20} color="#64748B" className={loading ? 'spin' : ''} />
          </button>
          <button onClick={() => setIsAddModalOpen(true)} style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(99,102,241,0.2)', cursor: 'pointer' }}>
            <Plus size={18} /> NOVO CLIENTE
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px', marginBottom: '40px' }}>
        <StatCard label="Total de Empresas" value={clients.length} icon={Building2} color={COLORS.accent} />
        <StatCard label="Assinaturas Ativas" value={clients.filter(c => c.subscriptions?.[0]?.status === 'active').length} icon={CheckCircle2} color={COLORS.success} />
        <StatCard label="Em Trial" value={clients.filter(c => c.subscriptions?.[0]?.status === 'trial').length} icon={Clock} color={COLORS.warning} />
        <StatCard label="Faturamento Mensal" value="R$ 12.450" icon={DollarSign} isFeatured color="#8B5CF6" />
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', flex: 1 }}>
            <Search size={18} color="#94A3B8" />
            <input placeholder="Buscar empresa por nome ou e-mail..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', width: '100%', fontWeight: '600' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: '800', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Filter size={16} /> FILTRAR
          </button>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Empresa / Cliente</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Plano</th>
              <th style={S.th}>Data de Início</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}><Loader2 size={40} className="spin" color="#E2E8F0" /></td></tr>
            ) : filteredItems.map(client => (
              <tr key={client.id} onClick={() => navigate(`/master/customers/${client.id}`)} style={{ cursor: 'pointer', transition: '0.2s' }}>
                <td style={S.td}>
                  <div style={{ fontWeight: '900', color: '#1E293B', fontSize: '15px' }}>{client.name}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{client.email}</div>
                </td>
                <td style={S.td}>
                  <span style={S.badge(client.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', client.status === 'active' ? '#10B981' : '#EF4444')}>
                    {client.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {client.status.toUpperCase()}
                  </span>
                </td>
                <td style={S.td}>
                  <span style={{ fontWeight: '800', color: '#6366F1', fontSize: '12px', background: 'rgba(99,102,241,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
                    {client.subscriptions?.[0]?.plan_id || 'Nenhum'}
                  </span>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{new Date(client.created_at).toLocaleDateString()}</div>
                </td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const product = client.subscriptions?.[0]?.product_name || client.origin || 'zaptro';
                        handleImpersonate(client.id, product); 
                      }}
                      title={`Entrar como Cliente (${client.subscriptions?.[0]?.product_name || 'Zaptro'})`}
                      style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: 'none', color: COLORS.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800' }}
                    >
                      <Shield size={14} /> ACESSAR
                    </button>
                    <button style={{ padding: '8px', borderRadius: '10px', background: '#F1F5F9', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        tr:hover { background: #F8FAFC; }
      `}</style>
    </div>
  );
}
