import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, User, Clock, CheckCircle, Camera, ShieldCheck } from 'lucide-react';
import { DetailHistorySection, detailHistoryRowTitle } from './DetailHistorySection';

interface LogtaDeliveryDetailProps {
  deliveryId: string;
  onBack: () => void;
}

export const LogtaDeliveryDetail: React.FC<LogtaDeliveryDetailProps> = ({ deliveryId, onBack }) => {
  const [, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(deliveryId);
  const [historySearchDraft, setHistorySearchDraft] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    setActiveId(deliveryId);
  }, [deliveryId]);

  const dlvDisplayCode = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
    return Math.abs(h % 900000) + 100000;
  };

  const history = useMemo(() => [
    { id: '1', client: 'Transportadora Falcão', sla: '93.3%' },
    { id: 'demo-11', client: 'Expresso Federal', sla: '98.4%' },
    { id: 'demo-12', client: 'Rápido Trans', sla: '85.7%' },
    { id: 'demo-13', client: 'TransNorte Cargo', sla: '91.0%' },
  ], []);

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(h => h.client.toLowerCase().includes(q) || h.id.toLowerCase().includes(q) || h.sla.toLowerCase().includes(q));
  }, [history, historyQuery]);

  const selectHistory = (id: string) => {
    setActiveId(id);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('deliveryId', id);
      return n;
    }, { replace: true });
  };

  const getDeliveryData = (id: string) => {
    const mapped: Record<string, any> = {
      '1': { client: 'Transportadora Falcão', delivered: '4.200', total: '4.500', sla: '93.3%', c: '#0061FF' },
      'demo-11': { client: 'Expresso Federal', delivered: '3.100', total: '3.150', sla: '98.4%', c: '#0061FF' },
      'demo-12': { client: 'Rápido Trans', delivered: '1.800', total: '2.100', sla: '85.7%', c: '#F59E0B' }
    };

    const source = mapped[id] || { client: 'Logta Parceiro', delivered: '1.200', total: '1.300', sla: '92.3%', c: '#0061FF' };

    return {
      id: `#DLV-${dlvDisplayCode(id)}`,
      carrier: source.client,
      sla: source.sla,
      status: 'Em Rota de Entrega',
      statusColor: '#3B82F6',
      recipient: 'Comercial Eletro-Tech Ltda',
      doc: '45.200.112/0001-90',
      addr: 'Rua das Hortênsias, 450 - Barueri, SP',
      itemDesc: '12x Computadores Notebook Pro + Acessórios',
      weight: '34 kg',
      volume: '3 caixas master',
      driver: 'Marcos Souza',
      startedAt: 'Hoje, 08:30',
      eta: 'Hoje, 14:15'
    };
  };

  const deliv = getDeliveryData(activeId);

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={s.title}>Entrega {deliv.id}</h2>
              <span style={{ fontSize: '11px', fontWeight: '800', color: deliv.statusColor, background: deliv.statusColor + '15', padding: '4px 10px', borderRadius: '6px' }}>
                ● {deliv.status}
              </span>
            </div>
            <p style={s.subtitle}>Auditoria de SLA e rastreabilidade da carga de {deliv.carrier}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0061FF', background: '#EFF6FF', padding: '8px 16px', borderRadius: '20px' }}>
            <ShieldCheck size={14} /> SLA Garantido ({deliv.sla})
          </span>
        </div>
      </header>

      <div style={s.content}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* LEFT: DESTINATION & ITEM DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={s.card}>
              <h3 style={s.sectTitle}>Detalhes da Carga & Produto</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '20px' }}>
                <div>
                  <div style={s.label}>Mercadoria</div>
                  <div style={s.val}><Package size={16} style={{ display: 'inline', marginRight: '6px', color: '#64748B' }} /> {deliv.itemDesc}</div>
                </div>
                <div>
                  <div style={s.label}>Peso Aferido</div>
                  <div style={s.val}>{deliv.weight}</div>
                </div>
                <div>
                  <div style={s.label}>Cubagem / Vol</div>
                  <div style={s.val}>{deliv.volume}</div>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.sectTitle}>Informações do Destinatário</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#94A3B8' }}><User size={18} /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{deliv.recipient}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>CNPJ: {deliv.doc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#94A3B8' }}><MapPin size={18} /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Endereço de Entrega</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{deliv.addr}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: TIMELINE & RECEIPT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ ...s.card, background: '#FAFAFA', border: '1px dashed #E2E8F0', textAlign: 'center', padding: '32px' }}>
              <div style={{ display: 'inline-flex', width: '48px', height: '48px', background: '#FFFFFF', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', color: '#94A3B8', marginBottom: '16px' }}>
                <Camera size={20} />
              </div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>Comprovante de Entrega (Canhoto)</h4>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '8px 0 0 0' }}>
                A imagem digitalizada e a assinatura eletrônica aparecerão aqui assim que a entrega for finalizada no LogDrive.
              </p>
            </div>

            <div style={s.card}>
              <h3 style={s.sectTitle}>Status e Rastreio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={16} color="#0061FF" />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Pedido Recebido CD • 07:00</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={16} color="#0061FF" />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Carregado no Veículo • 08:15</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Clock size={16} color="#3B82F6" />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#3B82F6' }}>Em Rota p/ Cliente • Previsão: {deliv.eta}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DetailHistorySection
          heading="Entregas recentes"
          hint="Troque o contexto da auditoria; a URL usa deliveryId. Pesquise, exporte PDF ou Excel."
          searchDraft={historySearchDraft}
          onSearchDraftChange={setHistorySearchDraft}
          onApplySearch={() => setHistoryQuery(historySearchDraft)}
          exportStem={`entregas-${activeId}`}
          listMaxHeight={280}
        >
          {filteredHistory.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => selectHistory(h.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '12px',
                border: activeId === h.id ? '2px solid #0061FF' : '1px solid #E2E8F0',
                background: activeId === h.id ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={detailHistoryRowTitle}>{h.client}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>SLA {h.sla}</span>
            </button>
          ))}
        </DetailHistorySection>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF' },
  header: { padding: '20px 72px 0', marginTop: 50, marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  title: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  content: { padding: '16px 72px 48px', display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' },
  label: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  val: { fontSize: '14px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', marginTop: '4px' },
  sectTitle: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' }
};
