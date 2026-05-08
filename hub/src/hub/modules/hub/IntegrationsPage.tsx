import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cloud,
  Settings,
  DollarSign,
  Eye,
  Zap,
  RefreshCw,
  Copy,
  Smartphone,
  Webhook,
  Key,
  Plus,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@core/lib/supabase';
import { toastSuccess } from '@core/lib/toast';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import MasterCredentialsVault from './MasterCredentialsVault';

const INTEGRATION_TABS = [
  { id: 'google' as const, label: 'Google Cloud', icon: Cloud },
  { id: 'asaas' as const, label: 'Gateway Asaas', icon: DollarSign },
  { id: 'whatsapp' as const, label: 'WhatsApp API', icon: Smartphone },
  { id: 'webhooks' as const, label: 'Webhooks e canais', icon: Webhook },
  { id: 'credenciais' as const, label: 'Cofre de chaves', icon: Key },
];

type IntegrationTabId = (typeof INTEGRATION_TABS)[number]['id'];

function normalizeTab(param: string | undefined): IntegrationTabId {
  const valid = INTEGRATION_TABS.some((t) => t.id === param);
  if (param && valid) return param;
  return 'google';
}

const IntegrationsPage: React.FC = () => {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const activeTab = normalizeTab(tabParam);

  const [googleConfig, setGoogleConfig] = useState<any>(null);
  const [govBannerExpanded, setGovBannerExpanded] = useState(false);

  useEffect(() => {
    if (tabParam && !INTEGRATION_TABS.some((t) => t.id === tabParam)) {
      navigate('/master/integracoes', { replace: true });
    }
  }, [tabParam, navigate]);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase
        .from('master_settings')
        .select('value')
        .eq('key', 'GOOGLE_SERVICE_ACCOUNT_KEY')
        .maybeSingle();
      setGoogleConfig(data?.value || null);
    };
    fetchConfigs();
  }, []);

  const setActiveTab = (id: IntegrationTabId) => {
    if (id === 'google') {
      navigate('/master/integracoes');
    } else {
      navigate(`/master/integracoes/${id}`);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/webhook-asaas');
    toastSuccess('Endpoint copiado para a área de transferência.');
  };

  const goCredenciais = () => navigate('/master/integracoes/credenciais');
  const goEvolution = () => navigate('/master/settings/evolution');
  const goAutomacoes = () => navigate('/master/automacoes');

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Integrações & Conectores Master</h1>
          <p style={styles.subtitle}>Gerencie a conectividade global do ecossistema, tokens de API e credenciais externas.</p>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.headerBtnSecondary} onClick={goCredenciais}>
            <Key size={18} strokeWidth={2} />
            Cofre de chaves
          </button>
          <button type="button" style={styles.headerBtnPrimary} onClick={goCredenciais}>
            <Plus size={18} strokeWidth={2} />
            Adicionar credencial
          </button>
        </div>
      </header>

      <div style={hubPillTabStripStyles.container}>
        {INTEGRATION_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{
              ...hubPillTabStripStyles.button,
              ...(activeTab === t.id ? hubPillTabStripStyles.buttonActive : {}),
            }}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={18} color={activeTab === t.id ? 'var(--accent)' : 'var(--text-secondary)'} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div
          role="button"
          tabIndex={0}
          aria-expanded={govBannerExpanded}
          aria-label="Protocolo de Alta Governança. Clique para ver detalhes."
          style={styles.guardBanner}
          onClick={() => setGovBannerExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setGovBannerExpanded((v) => !v);
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
        >
          <div style={styles.guardIcon}>
            <ShieldCheck size={28} color="#0061FF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={styles.guardTitle}>Protocolo de Alta Governança</h3>
            <p style={styles.guardSub}>Chaves e segredos são armazenados com criptografia em repouso no cofre master.</p>
            {govBannerExpanded && (
              <p style={styles.guardExpand}>
                Acesso às chaves é restrito a perfis MASTER; rotação e trilha de auditoria ficam em Segurança e infraestrutura
                do Hub. Use cada aba acima para configurar conectores sem expor segredos em texto simples.
              </p>
            )}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
            <div style={styles.guardLabel}>ESTADO DE ACESSO</div>
            <div style={styles.guardBadge}>
              <div style={styles.statusDot} /> MASTER ADMIN
            </div>
          </div>
        </div>

        {activeTab === 'google' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.planIcon, backgroundColor: '#fef2f2', color: '#ef4444' }}>
                <Cloud size={24} />
              </div>
              <div>
                <h3 style={styles.cardTitle}>Google Cloud & Workspace</h3>
                <p style={styles.cardSub}>Meet, LogDock e Agenda.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: googleConfig ? '#ecfdf5' : '#fff7ed',
                    color: googleConfig ? '#10b981' : '#f97316',
                  }}
                >
                  {googleConfig ? 'ATIVO' : 'PENDENTE'}
                </span>
              </div>
            </div>
            <div style={styles.cardActionsRow}>
              <button type="button" style={styles.primaryCardBtn} onClick={goCredenciais}>
                <Plus size={16} strokeWidth={2} />
                Configurar ou atualizar chave no cofre
              </button>
            </div>
            <div style={styles.configArea}>
              <label style={styles.infoLabel}>SERVICE ACCOUNT ID</label>
              <div style={styles.codeBlock}>
                <code>{googleConfig?.client_email || 'Aguardando configuração...'}</code>
              </div>
            </div>
            <button type="button" style={{ ...styles.actionBtn, marginTop: '20px', color: '#ef4444', borderColor: '#fee2e2' }}>
              <Settings size={14} /> Reconfiguração avançada
            </button>
          </div>
        )}

        {activeTab === 'asaas' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.planIcon, backgroundColor: '#eff6ff', color: '#0061FF' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <h3 style={styles.cardTitle}>Gateway Asaas</h3>
                <p style={styles.cardSub}>Fluxos financeiros master.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ ...styles.statusBadge, backgroundColor: '#ecfdf5', color: '#10b981' }}>CONECTADO</span>
              </div>
            </div>
            <div style={styles.cardActionsRow}>
              <button type="button" style={styles.primaryCardBtn} onClick={goCredenciais}>
                <Plus size={16} strokeWidth={2} />
                Adicionar ou editar token Asaas
              </button>
            </div>
            <div style={styles.configArea}>
              <label style={styles.infoLabel}>API KEY MASTER</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ fontSize: '11px', color: '#64748B', flex: 1 }}>$a***************************************</code>
                <Eye size={14} color="#94a3b8" />
              </div>
            </div>
            <button type="button" style={{ ...styles.actionBtn, marginTop: '20px' }}>
              <Settings size={14} /> Ajustes finos (avançado)
            </button>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.planIcon, backgroundColor: '#f0fdf4', color: '#10b981' }}>
                <Smartphone size={24} />
              </div>
              <div>
                <h3 style={styles.cardTitle}>WhatsApp API Gateways</h3>
                <p style={styles.cardSub}>Status do conector Evolution API Hub para alertas e mensagens transacionais.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ ...styles.statusBadge, backgroundColor: '#ecfdf5', color: '#10b981' }}>CONECTADO</span>
              </div>
            </div>
            <div style={styles.cardActionsRow}>
              <button type="button" style={styles.primaryCardBtn} onClick={goEvolution}>
                <Smartphone size={16} strokeWidth={2} />
                Abrir Evolution API Hub
              </button>
              <button type="button" style={styles.secondaryCardBtn} onClick={goCredenciais}>
                <Key size={16} strokeWidth={2} />
                Tokens no cofre
              </button>
            </div>
            <div style={styles.configArea}>
              <label style={styles.infoLabel}>ENDPOINT DA INSTÂNCIA (WHATSAPP)</label>
              <code style={{ fontSize: '12px', color: '#0F172A', fontWeight: '500' }}>https://evolution.zaptro.com/v1/messages</code>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={styles.cardTitle}>
                  <Zap size={18} color="#f59e0b" fill="#f59e0b" /> Webhooks Ativos
                </h3>
                <p style={styles.cardSub}>Escuta global de eventos externos para automações.</p>
              </div>
              <button type="button" style={styles.refreshBtn}>
                <RefreshCw size={14} />
              </button>
            </div>
            <div style={styles.cardActionsRow}>
              <button type="button" style={styles.primaryCardBtn} onClick={handleCopyWebhook}>
                <Copy size={16} strokeWidth={2} />
                Copiar endpoint do webhook
              </button>
              <button type="button" style={styles.secondaryCardBtn} onClick={goAutomacoes}>
                <Zap size={16} strokeWidth={2} />
                Nova automação com este endpoint
              </button>
            </div>
            <div style={styles.webhookUrlArea}>
              <label style={styles.infoLabel}>ENDPOINT (ASAAS)</label>
              <div style={styles.urlInputRow}>
                <code style={styles.urlCode}>.../functions/v1/hub-core/webhook-asaas</code>
                <button type="button" style={styles.copyBtn} onClick={handleCopyWebhook}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credenciais' && (
          <div style={styles.card}>
            <div style={{ ...styles.cardHeader, marginBottom: '20px' }}>
              <div style={{ ...styles.planIcon, backgroundColor: '#f5f3ff', color: '#0061FF' }}>
                <Key size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={styles.cardTitle}>Cofre master</h3>
                <p style={styles.cardSub}>Inclua ou edite chaves abaixo; elas alimentam Google, Asaas e outros conectores.</p>
              </div>
            </div>
            <MasterCredentialsVault />
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    padding: '0',
    maxWidth: '1066px',
    margin: '0 auto',
    width: '100%',
    minHeight: '700px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap' as const,
    marginBottom: '32px',
  },
  headerActions: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'center' },
  headerBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#0061FF',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0, 97, 255, 0.25)',
  },
  headerBtnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
  title: { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1px' },
  subtitle: { fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: '400' },
  cardActionsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    marginBottom: '20px',
  },
  primaryCardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#0061FF',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
  secondaryCardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
  refreshBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#64748b',
  },
  guardBanner: {
    backgroundColor: '#FFFFFF',
    padding: '22px',
    borderRadius: '33px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    border: 'none',
    boxShadow: 'none',
    marginBottom: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
  },
  guardIcon: {
    backgroundColor: 'var(--accent-light)',
    padding: '14px',
    borderRadius: '16px',
    flexShrink: 0,
  },
  guardTitle: { margin: 0, color: 'var(--secondary)', fontSize: '18px', fontWeight: '700' },
  guardSub: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '400' },
  guardExpand: {
    margin: '12px 0 0',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  guardLabel: { fontSize: '10px', fontWeight: '700', marginBottom: '6px', letterSpacing: '1px', color: 'var(--accent)' },
  guardBadge: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '6px 14px',
    borderRadius: '20px',
  },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' },
  card: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  cardSub: { fontSize: '14px', color: '#64748B', margin: '2px 0 0', fontWeight: '400' },
  planIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: { padding: '6px 14px', borderRadius: '12px', fontSize: '10px', fontWeight: '800' },
  configArea: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' },
  infoLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
  },
  codeBlock: { fontSize: '11px', color: '#64748B', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' },
  webhookUrlArea: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '12px' },
  urlInputRow: { display: 'flex', gap: '12px', marginTop: '12px' },
  urlCode: {
    fontSize: '12px',
    color: '#0F172A',
    fontWeight: '500',
    backgroundColor: '#fff',
    padding: '12px 18px',
    borderRadius: '14px',
    flex: 1,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  copyBtn: {
    padding: '12px',
    backgroundColor: 'rgba(0, 97, 255, 0.05)',
    border: 'none',
    borderRadius: '14px',
    color: '#0061FF',
    cursor: 'pointer',
  },
  actionBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748B',
    fontWeight: '600',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default IntegrationsPage;
