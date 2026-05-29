import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Activity,
  Search,
  CheckCircle2,
  ExternalLink,
  Package,
  Webhook,
  RefreshCw,
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess, toastError } from '@core/lib/toast';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { supabase } from '@core/lib/supabase';
import {
  companyHasLogstoka,
  getLogstokaAppOrigin,
  openLogstokaApp,
} from '@hub/lib/logstokaMasterDeepLinks';

interface CompanyRow {
  id: string;
  name: string;
  status?: string;
  settings?: { modules?: string[] };
}

const LogStokaAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('id, name, status, settings').order('name');
    if (error) toastError(error.message);
    setCompanies((data ?? []) as CompanyRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleLogstoka = async (company: CompanyRow) => {
    const enabled = !companyHasLogstoka(company.settings);
    const currentModules = company.settings?.modules ?? [];
    const newModules = enabled
      ? [...new Set([...currentModules, 'logstoka'])]
      : currentModules.filter((m) => m !== 'logstoka');

    try {
      const { error: companyError } = await supabase
        .from('companies')
        .update({ settings: { ...(company.settings ?? {}), modules: newModules } })
        .eq('id', company.id);
      if (companyError) throw companyError;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, metadata')
        .eq('company_id', company.id);

      for (const profile of profiles ?? []) {
        const metadata = (profile.metadata as Record<string, unknown>) ?? {};
        const modules = (metadata.modules as Record<string, unknown>) ?? {};
        await supabase
          .from('profiles')
          .update({
            metadata: {
              ...metadata,
              modules: { ...modules, logstoka: enabled },
            },
          })
          .eq('id', profile.id);
      }

      toastSuccess(`LogStoka ${enabled ? 'ativado' : 'desativado'} para ${company.name}`);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao atualizar módulo');
    }
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const activeCount = companies.filter((c) => companyHasLogstoka(c.settings)).length;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Truck size={32} color="#059669" />
          <div>
            <h1 style={s.title}>LogStoka WMS</h1>
            <p style={s.subtitle}>Gestão de estoque multicanal · {getLogstokaAppOrigin()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={s.btnSecondary} onClick={() => void load()}>
            <RefreshCw size={16} /> Atualizar
          </button>
          <button type="button" style={s.btnPrimary} onClick={() => openLogstokaApp('/app')}>
            <ExternalLink size={16} /> Abrir LogStoka
          </button>
        </div>
      </header>

      <div style={s.content}>
        <div style={HUB_METRIC_GRID_STYLE}>
          <HubMetricCard label="Empresas com LogStoka" value={String(activeCount)} icon={CheckCircle2} accent="#059669" softBg="#ECFDF5" />
          <HubMetricCard label="Total empresas" value={String(companies.length)} icon={Package} accent="#0EA5E9" softBg="#F0F9FF" />
          <HubMetricCard label="API LogStoka" value="v1" icon={Webhook} accent="#8B5CF6" softBg="#F5F3FF" />
          <HubMetricCard label="Status" value="Online" icon={Activity} accent="#059669" softBg="#ECFDF5" />
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Empresas e entitlement</h3>
            <div style={s.searchBox}>
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                style={s.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <p style={{ color: '#64748B' }}>Carregando…</p>}

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Empresa</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>LogStoka</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const on = companyHasLogstoka(c.settings);
                return (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}><span style={s.clientName}>{c.name}</span></td>
                    <td style={s.td}>{c.status ?? '—'}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, backgroundColor: on ? '#ECFDF5' : '#F1F5F9', color: on ? '#059669' : '#64748B' }}>
                        {on ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button type="button" style={s.actionBtn} onClick={() => void toggleLogstoka(c)}>
                        {on ? 'Desativar' : 'Ativar'}
                      </button>
                      <button type="button" style={{ ...s.actionBtn, marginLeft: 8 }} onClick={() => openLogstokaApp('/app')}>
                        Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Integração operacional</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', lineHeight: 1.8 }}>
            <li>Ativar o módulo define <code>settings.modules.logstoka</code> e <code>metadata.modules.logstoka</code> nos perfis.</li>
            <li>Webhooks de venda: <code>POST /webhooks/orders</code> na API LogStoka (porta 8788).</li>
            <li>Importação NF-e XML, CSV, Excel e OCR via centro de importações do app.</li>
          </ul>
          <button type="button" style={{ ...s.btnSecondary, marginTop: 16 }} onClick={() => navigate('/master/companies')}>
            Gerenciar empresas
          </button>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh' },
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  title: { margin: 0, fontSize: 29, fontWeight: 900, color: '#0F172A' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 999, border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 999, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#059669', fontWeight: 800, cursor: 'pointer' },
  content: { padding: 40, display: 'flex', flexDirection: 'column', gap: 24 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: 16 },
  clientName: { fontSize: 15, fontWeight: 800, color: '#1E293B' },
  badge: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 14, width: 180 },
  actionBtn: { padding: '6px 12px', borderRadius: 8, border: '1px solid #059669', backgroundColor: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 800, cursor: 'pointer' },
};

export default LogStokaAdmin;
