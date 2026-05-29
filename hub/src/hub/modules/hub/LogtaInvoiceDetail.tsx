import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, AlertCircle, Download, Share2, Building, Hash, Link2, Receipt } from 'lucide-react';
import { toastSuccess } from '@core/lib/toast';
import { DetailHistorySection, detailHistoryRowTitle } from './DetailHistorySection';

interface LogtaInvoiceDetailProps {
  invoiceId: string;
  onBack: () => void;
}

type InvoiceRow = {
  id: string;
  client: string;
  val: string;
  date: string;
  status: string;
  c: string;
  plan?: string;
  type?: string;
};

const fatDisplayId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  return `#FAT-${Math.abs(h % 9000) + 1000}`;
};

/** Logo do tenant (mock) — alinhado ao perfil cliente Logta */
const invoiceCompanyLogoById: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop&q=80',
  'demo-11': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&h=128&fit=crop&q=80',
  'demo-12': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=128&h=128&fit=crop&q=80',
  'demo-20': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=128&h=128&fit=crop&q=80',
  'demo-21': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop&q=80',
};

export const LogtaInvoiceDetail: React.FC<LogtaInvoiceDetailProps> = ({ invoiceId, onBack }) => {
  const [, setSearchParams] = useSearchParams();

  const history = useMemo<InvoiceRow[]>(() => [
    { id: '1', client: 'Transportadora Falcão', val: 'R$ 4.500,00', date: '15/05/2026', status: 'Pago', c: '#0061FF', plan: 'Pro' },
    { id: 'demo-11', client: 'Expresso Federal', val: 'R$ 8.200,00', date: '18/05/2026', status: 'Pendente', c: '#F59E0B', plan: 'Enterprise' },
    { id: 'demo-12', client: 'Rápido Trans', val: 'R$ 2.100,00', date: '10/05/2026', status: 'Pago', c: '#0061FF', plan: 'Pro' },
    { id: 'demo-20', client: 'Alfa Transportes', val: 'R$ 500,00', date: 'Hoje, 14:15', status: 'Pago', c: '#0061FF', type: 'Recarga' },
  ], []);

  const [activeId, setActiveId] = useState(invoiceId);
  const [historySearchDraft, setHistorySearchDraft] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    setActiveId(invoiceId);
  }, [invoiceId]);

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      h =>
        h.client.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q) ||
        h.status.toLowerCase().includes(q) ||
        h.val.toLowerCase().includes(q),
    );
  }, [history, historyQuery]);

  const getInvoiceData = (id: string) => {
    const routes: Record<string, any> = {
      'demo-11': { client: 'Expresso Federal', val: 'R$ 8.200,00', date: '18/05/2026', status: 'Pendente', c: '#F59E0B', plan: 'Enterprise' },
      '1': { client: 'Transportadora Falcão', val: 'R$ 4.500,00', date: '15/05/2026', status: 'Pago', c: '#0061FF', plan: 'Pro' },
      'demo-12': { client: 'Rápido Trans', val: 'R$ 2.100,00', date: '10/05/2026', status: 'Pago', c: '#0061FF', plan: 'Pro' },
      'demo-20': { client: 'Alfa Transportes', val: 'R$ 500,00', date: 'Hoje, 14:15', status: 'Pago', c: '#0061FF', type: 'Recarga' },
      'demo-21': { client: 'Falcão Trans', val: 'R$ 1.200,00', date: 'Hoje, 09:02', status: 'Pago', c: '#0061FF', type: 'Upgrade' },
    };

    const raw = routes[id] || { client: 'Expresso Logística SaaS', val: 'R$ 1.500,00', date: '12/05/2026', status: 'Pago', c: '#0061FF', plan: 'Pro' };

    return {
      id: fatDisplayId(id),
      client: raw.client,
      companyLogoUrl: invoiceCompanyLogoById[id] ?? invoiceCompanyLogoById['1'],
      value: raw.val,
      dueDate: raw.date,
      status: raw.status,
      statusColor: raw.c,
      issuedAt: '01/05/2026',
      plan: raw.plan || 'Logta Pro',
      method: 'Boleto Bancário • Itaú',
      items: [
        { desc: `Assinatura Mensal - ${raw.plan || 'Logta Pro'}`, qty: '1 un', unit: raw.val, total: raw.val },
        { desc: 'Créditos Extras Telemetria Satélite', qty: '250 un', unit: 'R$ 0,15', total: 'R$ 37,50' },
        { desc: 'Volume Excedente API Geocoding', qty: '1.200 req', unit: 'R$ 0,02', total: 'R$ 24,00' },
      ],
    };
  };

  const invoice = getInvoiceData(activeId);
  const receiptPublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/master/logta?receipt=${encodeURIComponent(activeId)}`
    : '';

  const selectHistory = (id: string) => {
    setActiveId(id);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('invoiceId', id);
      return n;
    }, { replace: true });
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <img
            src={invoice.companyLogoUrl}
            alt=""
            style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={22} color="#64748B" strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden />
              <h2 style={s.title}>Fatura {invoice.id}</h2>
              <span style={{ fontSize: '11px', fontWeight: '800', color: invoice.statusColor, background: invoice.statusColor + '15', padding: '4px 10px', borderRadius: '6px' }}>
                ● {invoice.status}
              </span>
            </div>
            <p style={s.subtitle}>Detalhamento financeiro e cobrança SaaS</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            style={{ ...s.actionBtn, border: '1px solid #0061FF', color: '#0061FF', backgroundColor: '#FFFFFF', fontWeight: 700 }}
            onClick={() => toastSuccess('E-mail de comprovante enfileirado (integração transacional pendente).')}
          >
            <Share2 size={16} /> Enviar por E-mail
          </button>
          <button
            type="button"
            style={{
              ...s.actionBtn,
              backgroundColor: '#0061FF',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)',
            }}
            onClick={() => toastSuccess('Gerando PDF…')}
          >
            <Download size={16} /> Baixar PDF
          </button>
        </div>
      </header>

      <div style={s.content}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            background: '#F8FAFC',
            fontSize: '12px',
            color: '#475569',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px', color: '#0061FF', display: 'flex', alignItems: 'center' }} aria-hidden>
            <Link2 size={20} strokeWidth={2.25} />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <strong>Link público do comprovante:</strong>{' '}
            <code style={{ wordBreak: 'break-all' }}>{receiptPublicUrl}</code>
          </div>
          <button type="button" style={{ ...s.actionBtn, marginTop: 0, flexShrink: 0 }} onClick={() => { navigator.clipboard.writeText(receiptPublicUrl); toastSuccess('Link copiado.'); }}>Copiar link</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ ...s.card, borderLeft: `6px solid ${invoice.statusColor}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div>
                  <div style={s.cardLabel}>Valor Total</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>{invoice.value}</div>
                </div>
                <div>
                  <div style={s.cardLabel}>Vencimento</div>
                  <div style={{ ...s.cardVal, fontSize: '16px', marginTop: '12px' }}><Calendar size={16} style={{ display: 'inline', marginRight: '6px', color: '#64748B' }} /> {invoice.dueDate}</div>
                </div>
                <div>
                  <div style={s.cardLabel}>Forma de Pagamento</div>
                  <div style={{ ...s.cardVal, fontSize: '14px', marginTop: '14px', fontWeight: 600 }}><CreditCard size={16} style={{ display: 'inline', marginRight: '6px', color: '#64748B' }} /> {invoice.method}</div>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.sectionTitle}>Detalhamento da Cobrança</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Descrição do Item</th>
                    <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Qtd</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Vlr. Unitário</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{item.desc}</td>
                      <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748B' }}>{item.qty}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748B' }}>{item.unit}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <div style={{ textAlign: 'right', width: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    <span>Subtotal</span>
                    <span>{invoice.value}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', fontSize: '13px', color: '#0061FF', fontWeight: 700 }}>
                    <span>Descontos</span>
                    <span>R$ 0,00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #0F172A', fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>
                    <span>Total Geral</span>
                    <span>{invoice.value}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={s.card}>
              <h3 style={s.sectionTitle}>Dados do Tomador</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Building size={16} color="#94A3B8" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{invoice.client}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>CNPJ: 45.201.889/0001-92</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Hash size={16} color="#94A3B8" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>Identificador Monorepo</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', marginTop: '2px' }}>{activeId}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...s.card, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <h3 style={{ ...s.sectionTitle, fontSize: '14px' }}>Linha do Tempo da Fatura</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#0061FF' }}><CheckCircle size={14} /></div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Cobrança Registrada no Gateway • 01/05</div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#0061FF' }}><CheckCircle size={14} /></div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Notificação por E-mail Enfileirada • 01/05</div>
                </div>
                {invoice.status === 'Pago' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: '#0061FF' }}><CheckCircle size={14} /></div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Pagamento Confirmado • {invoice.dueDate}</div>
                  </div>
                )}
                {invoice.status === 'Pendente' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: '#F59E0B' }}><AlertCircle size={14} /></div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>Aguardando liquidação no gateway</div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <DetailHistorySection
          heading="Histórico de pagamentos"
          hint={`Clique para alterar a fatura exibida. Total: ${history.length}. A URL usa invoiceId.`}
          searchDraft={historySearchDraft}
          onSearchDraftChange={setHistorySearchDraft}
          onApplySearch={() => setHistoryQuery(historySearchDraft)}
          exportStem={`faturas-${activeId}`}
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
              <span style={{ fontWeight: 800, color: '#475569' }}>{h.val}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: h.c }}>{h.status}</span>
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
  actionBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '800', color: '#475569', cursor: 'pointer' },
  content: { padding: '16px 72px 48px', display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' },
  cardLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  cardVal: { fontSize: '14px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' },
};
