import React, { useState } from 'react';
import { Truck, Search, Package, MapPin, CheckCircle2, Download, ExternalLink, Activity } from 'lucide-react';
import { supabase } from '@shared/lib/supabase';

export const ClientPortalPage: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    try {
      setLoading(true);
      setSearchResult(null);

      // 1. Buscar o frete pelo número_frete ou ID
      const { data: frete, error: fErr } = await supabase
        .from('fretes')
        .select('*')
        .or(`numero_frete.eq.${trackingCode},id.eq.${trackingCode}`)
        .maybeSingle();

      if (fErr) throw fErr;

      if (!frete) {
        alert('Entrega não encontrada. Verifique o código e tente novamente.');
        return;
      }

      // 2. Buscar documentos vinculados (logdock_arquivos)
      // Nota: tags costumam conter o ID do frete ou número para indexação rápida
      const { data: docs } = await supabase
        .from('logdock_arquivos')
        .select('*')
        .contains('tags', [frete.numero_frete || frete.id]);

      // 3. Montar o objeto de resultado
      setSearchResult({
        code: frete.numero_frete || frete.id.slice(0, 8).toUpperCase(),
        status: frete.status || 'Pendente',
        lastUpdate: `Atualizado em ${new Date(frete.updated_at || frete.created_at).toLocaleString('pt-BR')}`,
        recipient: frete.cliente_nome || 'Cliente não identificado',
        origin: frete.origem,
        destination: frete.destino,
        eta: frete.previsao_entrega ? new Date(frete.previsao_entrega).toLocaleString('pt-BR') : 'A definir',
        steps: [
          { id: 1, title: 'Pedido Recebido', desc: 'Nota fiscal indexada com sucesso', completed: true },
          { id: 2, title: 'Aguardando Despacho', desc: 'Carregamento finalizado', completed: !!frete.motorista_id },
          { id: 3, title: 'Em Trânsito', desc: 'Veículo em rota principal', completed: frete.status === 'em_transito' || frete.status === 'concluido' },
          { id: 4, title: 'Entrega Concluída', desc: 'Aguardando canhoto digital', completed: frete.status === 'concluido' }
        ],
        documents: docs?.map(d => ({
          name: d.nome_arquivo,
          size: `${(d.tamanho_bytes / 1024).toFixed(0)} KB`,
          url: d.storage_path
        })) || []
      });
    } catch (err) {
      console.error('Erro no rastreamento:', err);
      alert('Erro ao buscar informações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Portal do Cliente Final</h1>
          <p style={styles.subtitle}>Acesso direto e público para rastreamento de cargas e download de canhotos.</p>
        </div>
      </header>

      {/* SEARCH BOX FOR PORTAL */}
      <div style={styles.searchSection}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Pesquisar Entrega</h3>
          <p style={styles.cardDesc}>Digite o código da entrega (Ex: LOG-987123) para visualizar o status em tempo real.</p>
          <form style={styles.searchForm} onSubmit={handleSearch}>
            <div style={styles.inputWrapper}>
              <Search size={20} color="#94A3B8" />
              <input type="text" placeholder="Ex: LOG-987123" style={styles.input} value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
            </div>
            <button type="submit" style={styles.searchBtn} disabled={loading}>
              {loading ? <Activity className="animate-spin" size={20} /> : 'Rastrear Carga'}
            </button>
          </form>
        </div>
      </div>

      {searchResult && (
        <div style={styles.resultsWorkspace}>
          {/* TIMELINE DO CLIENTE */}
          <div style={styles.card}>
            <div style={styles.resultsHeader}>
              <div>
                <span style={styles.codeLabel}>ENTREGA</span>
                <h2 style={styles.codeValue}>{searchResult.code}</h2>
              </div>
              <div style={styles.statusBadge}>
                <Truck size={16} /> {searchResult.status}
              </div>
            </div>

            <div style={styles.resultsMeta}>
              <div><strong>Origem:</strong> {searchResult.origin}</div>
              <div><strong>Destino:</strong> {searchResult.destination}</div>
              <div><strong>Previsão de Entrega (ETA):</strong> {searchResult.eta}</div>
            </div>

            <div style={styles.stepsTimeline}>
              {searchResult.steps.map((step: any, index: number) => (
                <div key={step.id} style={styles.stepItem}>
                  <div style={styles.stepIndicator}>
                    <div style={{ ...styles.stepDot, backgroundColor: step.completed ? '#10B981' : '#E2E8F0', border: step.completed ? 'none' : '2px solid #CBD5E1' }}>
                      {step.completed && <CheckCircle2 size={14} color="#FFF" />}
                    </div>
                    {index < searchResult.steps.length - 1 && <div style={{ ...styles.stepLine, backgroundColor: step.completed ? '#10B981' : '#E2E8F0' }} />}
                  </div>
                  <div style={styles.stepInfo}>
                    <h4 style={{ ...styles.stepTitle, color: step.completed ? '#1E1E1E' : '#64748B' }}>{step.title}</h4>
                    <p style={styles.stepDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ARQUIVOS DA CARGA DO CLIENTE */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Documentos Vinculados</h3>
            <p style={styles.cardDesc}>Download de notas fiscais e canhotos anexados pela IA do LogDock.</p>
            <div style={styles.docList}>
              {searchResult.documents.map((doc: any, i: number) => (
                <div key={i} style={styles.docItem}>
                  <div style={styles.docIdentity}>
                    <Package size={20} color="#0061FF" />
                    <div style={styles.docMeta}>
                      <span style={styles.docName}>{doc.name}</span>
                      <span style={styles.docSize}>{doc.size}</span>
                    </div>
                  </div>
                  <button style={styles.downloadBtn} onClick={() => alert('Download do documento iniciado!')}>
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '6px' },
  searchSection: { display: 'flex', flexDirection: 'column' },
  card: { padding: '32px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' },
  cardTitle: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  cardDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
  searchForm: { display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', padding: '12px 24px', borderRadius: '16px', flex: 1, border: '1px solid #EAEAEA' },
  input: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600', color: '#1E1E1E' },
  searchBtn: { padding: '14px 32px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,97,255,0.2)' },
  resultsWorkspace: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' },
  codeLabel: { fontSize: '11px', fontWeight: 'bold', color: '#94A3B8' },
  codeValue: { fontSize: '22px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '12px', fontWeight: '800', borderRadius: '10px' },
  resultsMeta: { fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '16px 20px', borderRadius: '16px' },
  stepsTimeline: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' },
  stepItem: { display: 'flex', gap: '20px' },
  stepIndicator: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stepDot: { width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: '2px', flex: 1, margin: '4px 0' },
  stepInfo: { paddingBottom: '24px' },
  stepTitle: { fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0' },
  stepDesc: { fontSize: '12px', color: '#64748B', margin: 0 },
  docList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  docItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' },
  docIdentity: { display: 'flex', alignItems: 'center', gap: '12px' },
  docMeta: { display: 'flex', flexDirection: 'column', gap: '2px' },
  docName: { fontSize: '13px', fontWeight: '700', color: '#1E1E1E' },
  docSize: { fontSize: '11px', color: '#94A3B8', fontWeight: 'bold' },
  downloadBtn: { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

export default ClientPortalPage;
