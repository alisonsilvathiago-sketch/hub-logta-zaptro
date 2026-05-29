import { isZaptroPreviewDataEnabled } from '../lib/zaptroPreviewMode';

export type ZaptroDemoTimelineItem = {
  id: string;
  at: string;
  kind: 'message' | 'quote' | 'route' | 'payment' | 'note';
  title: string;
  body: string;
  amount?: number;
};

export type ZaptroDemoOperation = {
  id: string;
  label: string;
  status: 'aprovado' | 'em_rota' | 'entregue' | 'cancelado';
  value: number;
  date: string;
};

export type ZaptroDemoClientRow = {
  id: string;
  company_id: string;
  crm_type: 'client';
  sender_name: string;
  sender_number: string;
  status: 'open' | 'finished' | 'waiting';
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string;
  _demo_message_count: number;
  customer_avatar?: string | null;
  metadata: {
    company_name: string;
    email?: string;
    notes?: string;
    last_event?: string;
    address?: string;
    cpf?: string | null;
    cnpj?: string | null;
    document_type?: 'cpf' | 'cnpj';
  };
  timeline: ZaptroDemoTimelineItem[];
  operations: ZaptroDemoOperation[];
  total_spent: number;
};

export const ZAPTRO_DEMO_COMPANY_ID = 'demo-company';

export function isZaptroClientsDemoEnabled(): boolean {
  return isZaptroPreviewDataEnabled();
}

export function buildZaptroDemoClients(companyId: string): ZaptroDemoClientRow[] {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();

  return [
    {
      id: 'demo-1',
      company_id: companyId,
      crm_type: 'client',
      sender_name: 'João Ferreira',
      sender_number: '5511999887766',
      status: 'open',
      assigned_to: 'demo-team-2',
      created_at: iso(86400000 * 45),
      updated_at: iso(3600000 * 2),
      last_message: 'Pode confirmar a coleta amanhã às 9h?',
      _demo_message_count: 24,
      total_spent: 18450,
      metadata: {
        company_name: 'Central Logística SP',
        email: 'joao@centrallog.com.br',
        notes: 'Cliente recorrente — coletas semanais zona leste.',
        last_event: 'Orçamento aprovado · rota agendada',
      },
      operations: [
        { id: 'op-1a', label: 'Frete SP → Guarulhos (3 vol.)', status: 'em_rota', value: 890, date: iso(86400000 * 2) },
        { id: 'op-1b', label: 'Coleta mensal — armazém', status: 'aprovado', value: 1250, date: iso(86400000 * 14) },
        { id: 'op-1c', label: 'Entrega expressa centro', status: 'entregue', value: 620, date: iso(86400000 * 30) },
      ],
      timeline: [
        { id: 't-1a', at: iso(3600000 * 2), kind: 'message', title: 'WhatsApp', body: 'Pode confirmar a coleta amanhã às 9h?' },
        { id: 't-1b', at: iso(86400000), kind: 'route', title: 'Rota agendada', body: 'Motorista Carlos · coleta Av. Paulista, 1200' },
        { id: 't-1c', at: iso(86400000 * 3), kind: 'quote', title: 'Orçamento aprovado', body: 'Frete SP → Guarulhos — R$ 890,00', amount: 890 },
        { id: 't-1d', at: iso(86400000 * 45), kind: 'note', title: 'Cadastro CRM', body: 'Cliente importado e marcado como activo.' },
      ],
    },
    {
      id: 'demo-2',
      company_id: companyId,
      crm_type: 'client',
      sender_name: 'Maria Santos',
      sender_number: '5511988776655',
      status: 'finished',
      assigned_to: 'demo-team-1',
      created_at: iso(86400000 * 120),
      updated_at: iso(86400000 * 3),
      last_message: 'Entrega concluída, obrigada!',
      _demo_message_count: 156,
      total_spent: 42800,
      metadata: {
        company_name: 'Transportes Santos ME',
        email: 'maria@santosme.com.br',
        notes: 'Volume alto — contrato trimestral.',
        last_event: 'Operação encerrada com sucesso',
      },
      operations: [
        { id: 'op-2a', label: 'Lote maio — 12 entregas', status: 'entregue', value: 9600, date: iso(86400000 * 5) },
        { id: 'op-2b', label: 'Frete refrigerado ABC', status: 'entregue', value: 3200, date: iso(86400000 * 40) },
      ],
      timeline: [
        { id: 't-2a', at: iso(86400000 * 3), kind: 'message', title: 'WhatsApp', body: 'Entrega concluída, obrigada!' },
        { id: 't-2b', at: iso(86400000 * 5), kind: 'payment', title: 'Pagamento recebido', body: 'PIX confirmado — lote maio', amount: 9600 },
        { id: 't-2c', at: iso(86400000 * 120), kind: 'note', title: 'Cliente activo', body: 'Primeiro contacto via indicação comercial.' },
      ],
    },
    {
      id: 'demo-3',
      company_id: companyId,
      crm_type: 'client',
      sender_name: 'Pedro Costa',
      sender_number: '5511977665544',
      status: 'waiting',
      assigned_to: 'demo-team-5',
      created_at: iso(86400000 * 12),
      updated_at: iso(600000 * 18),
      last_message: 'Aguardando retorno sobre frete para Campinas',
      _demo_message_count: 8,
      total_spent: 2100,
      metadata: {
        company_name: 'Costa Distribuição',
        notes: 'Aguardando retorno sobre frete Campinas.',
        last_event: 'Lead quente · follow-up hoje',
      },
      operations: [
        { id: 'op-3a', label: 'Cotação Campinas — pendente', status: 'aprovado', value: 2100, date: iso(86400000) },
      ],
      timeline: [
        { id: 't-3a', at: iso(600000 * 18), kind: 'message', title: 'WhatsApp', body: 'Aguardando retorno sobre frete para Campinas' },
        { id: 't-3b', at: iso(86400000), kind: 'quote', title: 'Proposta enviada', body: 'Campinas — R$ 2.100,00 (aguardando OK)', amount: 2100 },
        { id: 't-3c', at: iso(86400000 * 12), kind: 'note', title: 'Novo cadastro', body: 'Entrada via formulário WhatsApp.' },
      ],
    },
    {
      id: 'demo-4',
      company_id: companyId,
      crm_type: 'client',
      sender_name: 'Ana Oliveira',
      sender_number: '5511966554433',
      status: 'open',
      assigned_to: 'demo-team-1',
      created_at: iso(86400000 * 28),
      updated_at: iso(86400000),
      last_message: 'Preciso de cotação para 3 entregas na zona sul',
      _demo_message_count: 42,
      total_spent: 7650,
      metadata: {
        company_name: 'Oliveira Comércio',
        email: 'ana@oliveiracomercio.com.br',
        last_event: 'Proposta enviada via CRM',
      },
      operations: [
        { id: 'op-4a', label: 'Zona sul — 3 entregas', status: 'aprovado', value: 2550, date: iso(86400000) },
        { id: 'op-4b', label: 'Retorno vazio', status: 'entregue', value: 1800, date: iso(86400000 * 20) },
      ],
      timeline: [
        { id: 't-4a', at: iso(86400000), kind: 'message', title: 'WhatsApp', body: 'Preciso de cotação para 3 entregas na zona sul' },
        { id: 't-4b', at: iso(86400000 * 2), kind: 'quote', title: 'Proposta CRM', body: 'Pacote zona sul — R$ 2.550,00', amount: 2550 },
      ],
    },
    {
      id: 'demo-5',
      company_id: companyId,
      crm_type: 'client',
      sender_name: 'Carlos Mendes',
      sender_number: '5511955443322',
      status: 'finished',
      created_at: iso(86400000 * 200),
      updated_at: iso(86400000 * 14),
      last_message: 'Vamos retomar em março',
      _demo_message_count: 89,
      total_spent: 15200,
      metadata: {
        company_name: 'Mendes Importadora',
        notes: 'Pausa contratual — reactivar em março.',
        last_event: 'Cliente inactivo · reactivar em 90 dias',
      },
      operations: [
        { id: 'op-5a', label: 'Importação porto — lote Q4', status: 'entregue', value: 9800, date: iso(86400000 * 60) },
        { id: 'op-5b', label: 'Armazenagem extra', status: 'entregue', value: 5400, date: iso(86400000 * 90) },
      ],
      timeline: [
        { id: 't-5a', at: iso(86400000 * 14), kind: 'message', title: 'WhatsApp', body: 'Vamos retomar em março' },
        { id: 't-5b', at: iso(86400000 * 60), kind: 'payment', title: 'Pagamento', body: 'Fatura porto quitada', amount: 9800 },
        { id: 't-5c', at: iso(86400000 * 200), kind: 'note', title: 'Cliente desde 2024', body: 'Histórico completo arquivado.' },
      ],
    },
  ];
}

export function isZaptroDemoClientId(id: string): boolean {
  return String(id).startsWith('demo-');
}

export function getZaptroDemoClientById(id: string, companyId?: string): ZaptroDemoClientRow | null {
  const cid = companyId || ZAPTRO_DEMO_COMPANY_ID;
  return buildZaptroDemoClients(cid).find((c) => c.id === id) ?? null;
}
