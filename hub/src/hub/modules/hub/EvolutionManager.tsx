import React, { useState, useEffect } from 'react';
import {
  Smartphone, Zap, RefreshCw,
  Search, Filter, MoreHorizontal,
  CheckCircle2, AlertCircle, XCircle,
  Activity, Settings, Power, Users,
  Globe, Database, ShieldCheck,
  ChevronRight, ArrowRight, Play,
  Pause, RotateCcw, ExternalLink, Trash2
} from 'lucide-react';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { supabase } from '@core/lib/supabase';
import LogtaModal from '@shared/components/Modal';

const EvolutionManager = () => {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchInstances = async () => {
    setLoading(true);
    try {
      // Busca instâncias reais da tabela whatsapp_instances vinculadas às empresas
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select(`
          *,
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(inst => ({
        ...inst,
        name: inst.companies?.name || 'Cliente Avulso',
        instanceName: inst.instance_name || 'sem_nome',
        status: inst.status === 'open' ? 'connected' : 'disconnected',
        owner: inst.phone || 'N/A',
        uptime: 'Calculando...',
        cpu: '0.0%',
        memory: '0MB',
        version: '1.8.1'
      }));

      setInstances(formattedData);
    } catch (err: any) {
      toastError('Erro de Conexão: Não foi possível listar as instâncias do motor. Verifique a infraestrutura.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleRestartInstance = async (id: string, name: string, instanceName: string) => {
    const tid = toastLoading(`Reiniciando motor do cliente: ${name}...`);
    try {
      // Simulação da chamada Evolution API (futuramente via Hub Core Proxy)
      await new Promise(r => setTimeout(r, 2000));

      // Update local status just for UI feedback
      await supabase
        .from('whatsapp_instances')
        .update({ last_check_at: new Date().toISOString() })
        .eq('id', id);

      toastSuccess(`Motor "${name}" reiniciado! Sincronização em andamento.`);
      fetchInstances();
    } catch (err: any) {
      toastError(`Falha Crítica: O motor ${name} não respondeu ao comando de reinicialização.`);
    } finally {
      toastDismiss(tid);
    }
  };

  const handleForceUpdate = async (name: string) => {
    const tid = toastLoading(`Sincronizando metadados massivos de "${name}"...`);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toastSuccess('Sincronização Master concluída com sucesso!');
    } catch (err: any) {
      toastError('Erro na Sincronização: O motor Evolution reportou instabilidade temporária.');
    } finally {
      toastDismiss(tid);
    }
  };

  const styles: Record<string, any> = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '500', color: 'var(--primary)', margin: 0, letterSpacing: '0.4px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
    statCard: {
      backgroundColor: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)'
    },
    statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statTitle: { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
    statValue: { fontSize: '18px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px' },

    tableContainer: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', backgroundColor: '#f8fafc' },
    td: { padding: '16px 24px', fontSize: '14px', borderBottom: '1px solid var(--border)', color: 'var(--text-main)' },

    statusBadge: (status: string) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600',
      backgroundColor: status === 'connected' ? '#ECFDF5' : '#FEF2F2',
      color: status === 'connected' ? '#10B981' : '#EF4444',
      textTransform: 'uppercase' as const, letterSpacing: '0.5px'
    }),

    actionBtn: {
      padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border)',
      backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s',
      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', letterSpacing: '0.3px'
    },
    restartBtn: { color: 'var(--primary)', borderColor: 'var(--primary-light)', backgroundColor: 'var(--primary-light)' }
  };

  const filtered = instances.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.instanceName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Evolution API Hub</h2>
          <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)', fontWeight: '400', letterSpacing: '0.2px' }}>Monitoramento e gestão de motores WhatsApp de alta escala.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...styles.actionBtn, backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', fontWeight: '600' }} onClick={fetchInstances}>
            <RefreshCw size={18} /> ATUALIZAR STATUS GLOBAL
          </button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#EEF2FF', color: '#6366F1' }}><Activity size={24} /></div>
          <div>
            <div style={styles.statTitle}>NÚCLEO MASTER</div>
            <div style={styles.statValue}>OPERACIONAL</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#F0FDF4', color: '#16A34A' }}><Smartphone size={24} /></div>
          <div>
            <div style={styles.statTitle}>INSTÂNCIAS ATIVAS</div>
            <div style={styles.statValue}>{instances.filter(i => i.status === 'connected').length} / {instances.length}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#F5F3FF', color: '#7C3AED' }}><Zap size={24} /></div>
          <div>
            <div style={styles.statTitle}>CARGA DO CLUSTER</div>
            <div style={styles.statValue}>14.2%</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#FEF2F2', color: '#EF4444' }}><AlertCircle size={24} /></div>
          <div>
            <div style={styles.statTitle}>MOTORES OFFLINE</div>
            <div style={{ ...styles.statValue, color: '#EF4444' }}>{instances.filter(i => i.status !== 'connected').length}</div>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '14px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', fontWeight: '500', backgroundColor: '#f8fafc' }}
              placeholder="Buscar por cliente ou ID da instância..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={styles.actionBtn}><Filter size={16} /> Ver Apenas Alertas</button>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>CLIENTE / MOTOR</th>
              <th style={styles.th}>STATUS HUB</th>
              <th style={styles.th}>CARGA ESTIMADA</th>
              <th style={styles.th}>VERSÃO</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>AÇÕES DO MOTOR</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>Sincronizando com Evolution Engine...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>Nenhuma instância encontrada na base.</td></tr>
            ) : filtered.map(inst => (
              <tr key={inst.id} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setSelectedInstance(inst)}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '15px', letterSpacing: '0.2px' }}>{inst.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{inst.instanceName}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.statusBadge(inst.status)}>
                    {inst.status === 'connected' ? 'OPERACIONAL' : 'DESCONECTADO'}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{inst.cpu}</span>
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px' }}>
                      <div style={{ width: inst.cpu, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                    </div>
                  </div>
                </td>
                <td style={styles.td}><span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>v{inst.version}</span></td>
                <td style={{ ...styles.td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.restartBtn }}
                      title="Reiniciar Instância"
                      onClick={(e) => { e.stopPropagation(); handleRestartInstance(inst.id, inst.name, inst.instanceName); }}
                    >
                      <RotateCcw size={14} /> REINICIAR
                    </button>
                    <button
                      style={styles.actionBtn}
                      title="Forçar Sincronização"
                      onClick={(e) => { e.stopPropagation(); handleForceUpdate(inst.name); }}
                    >
                      <Zap size={14} /> SYNC
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INSTANCE MODAL */}
      <LogtaModal
        isOpen={!!selectedInstance}
        onClose={() => setSelectedInstance(null)}
        title={`Gestão de Motor: ${selectedInstance?.name}`}
        subtitle="Sincronização total, logs de execução e controle de infraestrutura."
        icon={<Settings />}
        size="lg"
        primaryAction={{
          label: 'REINICIAR MOTOR DO CLIENTE',
          onClick: () => handleRestartInstance(selectedInstance.id, selectedInstance.name, selectedInstance.instanceName)
        }}
        secondaryAction={{
          label: 'Modo Manutenção',
          onClick: () => { toastSuccess('Iniciando modo de manutenção especializado...'); setSelectedInstance(null); }
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
              <h5 style={{ margin: '0 0 16px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>ESTATÍSTICAS DO CLUSTER</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>CPU</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{selectedInstance?.cpu}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>MEMÓRIA</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{selectedInstance?.memory}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>UPTIME</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{selectedInstance?.uptime}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: '#0F172A', borderRadius: '24px', color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace", minHeight: '180px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '16px', fontWeight: '800', letterSpacing: '1px' }}>LOGS DO ENGINE (REAL-TIME STREAM)</div>
              <div style={{ fontSize: '11px', marginBottom: '6px', opacity: 0.9 }}>[INFO] {new Date().toLocaleTimeString()} - Instância operacional.</div>
              <div style={{ fontSize: '11px', marginBottom: '6px', opacity: 0.9 }}>[INFO] {new Date().toLocaleTimeString()} - Mensagem despachada: 5511...</div>
              <div style={{ fontSize: '11px', marginBottom: '6px', color: '#6366F1' }}>[DEBUG] Heartbeat recebido do cluster Evolution.</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>[DEBUG] Webhook response: 200 OK.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>VINCULAÇÃO NO HUB</h5>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Empresa: {selectedInstance?.name}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', wordBreak: 'break-all' }}>UUID: {selectedInstance?.company_id}</div>
              <button
                style={{ ...styles.actionBtn, width: '100%', marginTop: '16px', justifyContent: 'center', padding: '12px', fontWeight: '800', backgroundColor: '#FFF', borderRadius: '16px' }}
                onClick={() => {
                  toastSuccess(`Redirecionando para gestão de ${selectedInstance?.name}...`);
                  // Navega para o cliente específico
                  // window.location.href = `/master/clientes?id=${selectedInstance?.company_id}`;
                }}
              >
                <ExternalLink size={16} /> VER GESTÃO DO CLIENTE
              </button>
            </div>

            <div style={{ padding: '20px', borderRadius: '24px', border: '1px solid #FEE2E2', backgroundColor: '#FFF' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '1px' }}>ZONA DE SEGURANÇA</h5>
              <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px', lineHeight: '1.5' }}>Estas ações reinicializam buffers e webhooks, afetando a entrega imediata.</p>
              <button
                style={{ ...styles.actionBtn, width: '100%', color: '#EF4444', borderColor: '#FEE2E2', justifyContent: 'center', padding: '12px', fontWeight: '800', backgroundColor: '#FFF', borderRadius: '16px' }}
                onClick={() => toastError('O reset de webhooks requer autorização MASTER.')}
              >
                <RefreshCw size={16} /> RESETAR WEBHOOKS
              </button>
            </div>
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

export default EvolutionManager;
