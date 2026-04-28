import React from 'react';

interface InvoicePrintProps {
  invoice: any;
  onClose: () => void;
}

export default function InvoicePrint({ invoice, onClose }: InvoicePrintProps) {
  if (!invoice) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, padding: '60px', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Botões de Ação (Escondidos na Impressão) */}
      <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
        <button onClick={() => window.print()} style={{ background: '#6366F1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>🖨️ IMPRIMIR PDF</button>
        <button onClick={onClose} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>FECHAR</button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; margin: 0; }
        }
      `}</style>

      {/* Cabeçalho da Fatura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px', borderBottom: '2px solid #F1F5F9', paddingBottom: '30px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#1A2340', marginBottom: '8px' }}>LOGTA HUB</div>
          <div style={{ fontSize: '14px', color: '#64748B' }}>Gestão Centralizada de SaaS</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>CNPJ: 00.000.000/0001-00</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#6366F1' }}>FATURA</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A2340' }}>#INV-{invoice.invoice_number?.toString().padStart(5, '0')}</div>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>FATURADO PARA:</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#1A2340', marginBottom: '4px' }}>{invoice.companies?.name}</div>
          <div style={{ fontSize: '14px', color: '#64748B' }}>{invoice.companies?.email || 'contato@cliente.com.br'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>DETALHES DO PAGAMENTO:</div>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>Data de Emissão: {new Date(invoice.created_at).toLocaleDateString()}</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#EF4444' }}>Vencimento: {new Date(invoice.due_date).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Tabela de Itens */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>DESCRIÇÃO DO SERVIÇO</th>
            <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', fontWeight: '800', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>VALOR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '24px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ fontWeight: '700', color: '#1A2340', marginBottom: '4px' }}>Licença Logta SaaS - Mensal</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Referente ao período de utilização do sistema.</div>
            </td>
            <td style={{ padding: '24px 20px', textAlign: 'right', fontWeight: '700', color: '#1A2340', borderBottom: '1px solid #F1F5F9' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Totais */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Subtotal:</div>
            <div style={{ fontWeight: '700' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Impostos (0%):</div>
            <div style={{ fontWeight: '700' }}>R$ 0,00</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#1A2340' }}>TOTAL:</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#6366F1' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: '100px', textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '40px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A2340', marginBottom: '8px' }}>Obrigado pela parceria!</div>
        <div style={{ fontSize: '12px', color: '#94A3B8' }}>Esta é uma fatura eletrônica gerada automaticamente pelo Logta Hub.</div>
      </div>
    </div>
  );
}
