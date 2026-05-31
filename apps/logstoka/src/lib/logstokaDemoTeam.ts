export type LogstokaCollaborator = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  status: 'Ativo' | 'Ausente' | 'Inativo';
  score: number;
  movementsToday: number;
  hiredAt?: string;
};

export function getDemoCollaboratorById(id: string) {
  return DEMO_COLLABORATORS.find((c) => c.id === id) ?? null;
}

export const DEMO_COLLABORATORS: LogstokaCollaborator[] = [
  {
    id: '1',
    name: 'Alison Thiago',
    email: 'logstoka@teste.com',
    phone: '(11) 98765-4321',
    role: 'Admin Sênior · Titular',
    department: 'Operações WMS',
    status: 'Ativo',
    score: 98,
    movementsToday: 142,
    hiredAt: '2023-03-15',
  },
  {
    id: '2',
    name: 'Marina Costa',
    email: 'marina@logstoka.com',
    phone: '(11) 91234-5678',
    role: 'Supervisor de estoque',
    department: 'Expedição',
    status: 'Ativo',
    score: 91,
    movementsToday: 118,
    hiredAt: '2023-06-01',
  },
  {
    id: '3',
    name: 'Rafael Mendes',
    email: 'rafael@logstoka.com',
    phone: '(11) 99876-5432',
    role: 'Conferente',
    department: 'Inbound',
    status: 'Ativo',
    score: 86,
    movementsToday: 97,
    hiredAt: '2024-01-10',
  },
  {
    id: '4',
    name: 'Juliana Alves',
    email: 'juliana@logstoka.com',
    phone: '(21) 97654-3210',
    role: 'Separador',
    department: 'Picking',
    status: 'Ausente',
    score: 79,
    movementsToday: 54,
    hiredAt: '2024-04-22',
  },
  {
    id: '5',
    name: 'Carlos Henrique',
    email: 'carlos@logstoka.com',
    phone: '(11) 96543-2109',
    role: 'Expedidor',
    department: 'Expedição',
    status: 'Ativo',
    score: 84,
    movementsToday: 88,
    hiredAt: '2024-02-14',
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    email: 'fernanda@logstoka.com',
    phone: '(47) 98888-7777',
    role: 'Analista de integrações',
    department: 'TI / Marketplaces',
    status: 'Ativo',
    score: 93,
    movementsToday: 32,
    hiredAt: '2023-11-08',
  },
  {
    id: '7',
    name: 'Diego Souza',
    email: 'diego@logstoka.com',
    phone: '(11) 95432-1098',
    role: 'Operador de inventário',
    department: 'Inventário',
    status: 'Ativo',
    score: 81,
    movementsToday: 76,
    hiredAt: '2024-08-03',
  },
  {
    id: '9',
    name: 'Nádia Souza',
    email: 'nadia@logstoka.com',
    phone: '(11) 93456-7890',
    role: 'Administrador · CD Osasco',
    department: 'Operações WMS',
    status: 'Ativo',
    score: 92,
    movementsToday: 41,
    hiredAt: '2024-05-12',
  },
  {
    id: '8',
    name: 'Patricia Nunes',
    email: 'patricia@logstoka.com',
    phone: '(11) 94321-0987',
    role: 'Administrador Regional',
    department: 'Operações WMS',
    status: 'Ativo',
    score: 95,
    movementsToday: 64,
    hiredAt: '2022-09-20',
  },
];

export const DEMO_INTERACTIONS = [
  {
    id: '1',
    type: 'webhook',
    title: 'Pedido pago — Mercado Livre',
    detail: 'Webhook order.paid recebido · reserva de estoque OK',
    status: 'success',
    at: '15:42',
  },
  {
    id: '2',
    type: 'api',
    title: 'Sync Shopee — catálogo',
    detail: '142 SKUs sincronizados · 3 divergências de preço',
    status: 'warning',
    at: '15:18',
  },
  {
    id: '3',
    type: 'workflow',
    title: 'Transferência CD → Full ML',
    detail: 'Workflow automático #TR-8841 concluído',
    status: 'success',
    at: '14:55',
  },
  {
    id: '4',
    type: 'webhook',
    title: 'Devolução Amazon',
    detail: 'Evento return.created · aguardando conferência',
    status: 'pending',
    at: '14:30',
  },
];

export const DEMO_MARKETPLACE_RANKING = [
  { key: 'mercadolivre', label: 'Mercado Livre', orders: 842, sync: 99, revenue: 128400, rank: 1 },
  { key: 'shopee', label: 'Shopee', orders: 614, sync: 97, revenue: 89200, rank: 2 },
  { key: 'amazon', label: 'Amazon', orders: 388, sync: 96, revenue: 71500, rank: 3 },
  { key: 'magalu', label: 'Magalu', orders: 201, sync: 94, revenue: 38200, rank: 4 },
  { key: 'tiktok', label: 'TikTok Shop', orders: 96, sync: 91, revenue: 18400, rank: 5 },
];
