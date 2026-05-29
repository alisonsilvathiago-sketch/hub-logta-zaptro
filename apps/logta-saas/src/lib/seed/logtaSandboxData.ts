import { LOGTA_DEMO_COMPANY_ID } from './constants';
import type { MotoristaRow, TransactionRow, VehicleRow } from '../../contexts/OperationalDataContext';
import type { ShipmentNormalized } from '../../modules/fretes/types';
import type { FiscalDocStats } from '../../modules/fiscal/types';
import type { PontoRecord } from '../../modules/rh/ponto/types';
import type { ColaboradorRhProfile } from '../../modules/rh/ponto/colaboradorRhStorage';

const CID = LOGTA_DEMO_COMPANY_ID;

function isoDaysAgo(days: number, hour = 10, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const SANDBOX_COMPANY = {
  id: CID,
  name: 'Logta Transportes Demo',
  primary_color: '#D7FF00',
};

export function buildSandboxProfiles() {
  return [
    {
      id: 'prof-roberto',
      full_name: 'Roberto Silva',
      email: 'roberto.silva@logtademo.com.br',
      role: 'Supervisor Operacional',
      department: 'Operação',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-roberto',
    },
    {
      id: 'prof-ana',
      full_name: 'Ana Paula Mendes',
      email: 'ana.mendes@logtademo.com.br',
      role: 'Analista RH',
      department: 'RH',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-ana',
    },
    {
      id: 'prof-carlos',
      full_name: 'Carlos Henrique',
      email: 'carlos.henrique@logtademo.com.br',
      role: 'Motorista',
      department: 'Frota',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-carlos',
    },
    {
      id: 'prof-juliana',
      full_name: 'Juliana Rocha',
      email: 'juliana.rocha@logtademo.com.br',
      role: 'Coordenadora Fiscal',
      department: 'Fiscal',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-juliana',
    },
    {
      id: 'prof-marcos',
      full_name: 'Marcos Oliveira',
      email: 'marcos.oliveira@logtademo.com.br',
      role: 'Ajudante',
      department: 'Operação',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-marcos',
    },
    {
      id: 'prof-fernanda',
      full_name: 'Fernanda Costa',
      email: 'fernanda.costa@logtademo.com.br',
      role: 'Administrativo Financeiro',
      department: 'Financeiro',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-fernanda',
    },
    {
      id: 'prof-pedro',
      full_name: 'Pedro Almeida',
      email: 'pedro.almeida@logtademo.com.br',
      role: 'Motorista',
      department: 'Frota',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-pedro',
    },
    {
      id: 'prof-lucia',
      full_name: 'Lúcia Martins',
      email: 'lucia.martins@logtademo.com.br',
      role: 'Gerente Comercial',
      department: 'Comercial',
      avatar_url: 'https://i.pravatar.cc/96?u=prof-lucia',
    },
  ];
}

export function buildSandboxMotoristas(): MotoristaRow[] {
  return [
    { id: 'mot-carlos', nome: 'Carlos Henrique', status: 'ativo', cnh_vencimento: isoDaysFromNow(180) },
    { id: 'mot-pedro', nome: 'Pedro Almeida', status: 'ativo', cnh_vencimento: isoDaysFromNow(45) },
    { id: 'mot-ricardo', nome: 'Ricardo Souza', status: 'em_rota', cnh_vencimento: isoDaysFromNow(320) },
    { id: 'mot-andre', nome: 'André Ferreira', status: 'ativo', cnh_vencimento: isoDaysFromNow(12) },
    { id: 'mot-luiz', nome: 'Luiz Antônio', status: 'inativo', cnh_vencimento: isoDaysFromNow(-5) },
  ];
}

export function buildSandboxVehicles(): VehicleRow[] {
  return [
    { id: 'veh-bra2l22', plate: 'BRA-2L22', status: 'em_rota', modelo: 'Scania R450' },
    { id: 'veh-trk204', plate: 'TRK-204', status: 'em_rota', modelo: 'Volvo FH 540' },
    { id: 'veh-log8890', plate: 'LOG-8890', status: 'manutencao', modelo: 'Mercedes Actros' },
    { id: 'veh-scn5510', plate: 'SCN-5510', status: 'disponivel', modelo: 'VW Delivery 11.180' },
    { id: 'veh-van3341', plate: 'VAN-3341', status: 'em_rota', modelo: 'Sprinter 415' },
    { id: 'veh-crt7788', plate: 'CRT-7788', status: 'disponivel', modelo: 'Randon SR' },
    { id: 'veh-spz9012', plate: 'SPZ-9012', status: 'em_rota', modelo: 'Iveco Tector' },
    { id: 'veh-mgc4455', plate: 'MGC-4455', status: 'disponivel', modelo: 'Ford Cargo 2429' },
  ];
}

export function buildSandboxShipments(): ShipmentNormalized[] {
  const routes: Array<{
    id: string;
    nr: string;
    origin: string;
    dest: string;
    client: string;
    status: string;
    valor: number;
    motId: string;
    motNome: string;
    plate: string;
    modelo: string;
    daysAgo: number;
    ajudantes?: number;
    diarias?: number;
  }> = [
    { id: 'shp-001', nr: 'LF-240891', origin: 'São Paulo, SP', dest: 'Rio de Janeiro, RJ', client: 'Alfa Logistics', status: 'in_transit', valor: 18450, motId: 'mot-carlos', motNome: 'Carlos Henrique', plate: 'BRA-2L22', modelo: 'Scania R450', daysAgo: 0, ajudantes: 2, diarias: 180 },
    { id: 'shp-002', nr: 'LF-240892', origin: 'São Paulo, SP', dest: 'Belo Horizonte, MG', client: 'Prime Cargo', status: 'in_transit', valor: 12200, motId: 'mot-pedro', motNome: 'Pedro Almeida', plate: 'TRK-204', modelo: 'Volvo FH 540', daysAgo: 1, ajudantes: 1, diarias: 90 },
    { id: 'shp-003', nr: 'LF-240893', origin: 'Curitiba, PR', dest: 'Campinas, SP', client: 'TransBrasil', status: 'delayed', valor: 9800, motId: 'mot-ricardo', motNome: 'Ricardo Souza', plate: 'VAN-3341', modelo: 'Sprinter 415', daysAgo: 2, ajudantes: 2, diarias: 120 },
    { id: 'shp-004', nr: 'LF-240894', origin: 'Santos, SP', dest: 'Joinville, SC', client: 'NexFrete', status: 'loading', valor: 7600, motId: 'mot-andre', motNome: 'André Ferreira', plate: 'SPZ-9012', modelo: 'Iveco Tector', daysAgo: 0, ajudantes: 0, diarias: 0 },
    { id: 'shp-005', nr: 'LF-240895', origin: 'Guarulhos, SP', dest: 'Brasília, DF', client: 'LogExpress', status: 'in_transit', valor: 22100, motId: 'mot-carlos', motNome: 'Carlos Henrique', plate: 'BRA-2L22', modelo: 'Scania R450', daysAgo: 3, ajudantes: 1, diarias: 110 },
    { id: 'shp-006', nr: 'LF-240880', origin: 'Ribeirão Preto, SP', dest: 'Uberlândia, MG', client: 'Alfa Logistics', status: 'delivered', valor: 5400, motId: 'mot-pedro', motNome: 'Pedro Almeida', plate: 'TRK-204', modelo: 'Volvo FH 540', daysAgo: 0, ajudantes: 0, diarias: 0 },
    { id: 'shp-007', nr: 'LF-240881', origin: 'Porto Alegre, RS', dest: 'Florianópolis, SC', client: 'Prime Cargo', status: 'delivered', valor: 4200, motId: 'mot-ricardo', motNome: 'Ricardo Souza', plate: 'VAN-3341', modelo: 'Sprinter 415', daysAgo: 1, ajudantes: 1, diarias: 90 },
    { id: 'shp-008', nr: 'LF-240882', origin: 'São José dos Campos, SP', dest: 'Vitória, ES', client: 'TransBrasil', status: 'incident', valor: 11300, motId: 'mot-andre', motNome: 'André Ferreira', plate: 'SPZ-9012', modelo: 'Iveco Tector', daysAgo: 2, ajudantes: 0, diarias: 0 },
    { id: 'shp-009', nr: 'LF-240883', origin: 'Campinas, SP', dest: 'Sorocaba, SP', client: 'NexFrete', status: 'pending', valor: 2800, motId: 'mot-carlos', motNome: 'Carlos Henrique', plate: 'BRA-2L22', modelo: 'Scania R450', daysAgo: 0, ajudantes: 0, diarias: 0 },
    { id: 'shp-010', nr: 'LF-240884', origin: 'São Paulo, SP', dest: 'Curitiba, PR', client: 'LogExpress', status: 'in_transit', valor: 8900, motId: 'mot-pedro', motNome: 'Pedro Almeida', plate: 'TRK-204', modelo: 'Volvo FH 540', daysAgo: 1, ajudantes: 1, diarias: 100 },
    { id: 'shp-011', nr: 'LF-240885', origin: 'Belém, PA', dest: 'Manaus, AM', client: 'Alfa Logistics', status: 'stopped', valor: 35600, motId: 'mot-ricardo', motNome: 'Ricardo Souza', plate: 'VAN-3341', modelo: 'Sprinter 415', daysAgo: 4, ajudantes: 3, diarias: 450 },
    { id: 'shp-012', nr: 'LF-240886', origin: 'Recife, PE', dest: 'Salvador, BA', client: 'Prime Cargo', status: 'unloading', valor: 14200, motId: 'mot-andre', motNome: 'André Ferreira', plate: 'SPZ-9012', modelo: 'Iveco Tector', daysAgo: 1, ajudantes: 2, diarias: 180 },
    { id: 'shp-013', nr: 'LF-240887', origin: 'São Paulo, SP', dest: 'Goiânia, GO', client: 'TransBrasil', status: 'in_transit', valor: 16800, motId: 'mot-carlos', motNome: 'Carlos Henrique', plate: 'BRA-2L22', modelo: 'Scania R450', daysAgo: 2, ajudantes: 1, diarias: 120 },
    { id: 'shp-014', nr: 'LF-240888', origin: 'Cuiabá, MT', dest: 'Campo Grande, MS', client: 'NexFrete', status: 'delivered', valor: 6700, motId: 'mot-pedro', motNome: 'Pedro Almeida', plate: 'TRK-204', modelo: 'Volvo FH 540', daysAgo: 0, ajudantes: 0, diarias: 0 },
    { id: 'shp-015', nr: 'LF-240889', origin: 'Fortaleza, CE', dest: 'Natal, RN', client: 'LogExpress', status: 'pending', valor: 9100, motId: 'mot-ricardo', motNome: 'Ricardo Souza', plate: 'VAN-3341', modelo: 'Sprinter 415', daysAgo: 0, ajudantes: 1, diarias: 80 },
  ];

  return routes.map((r) => ({
    id: r.id,
    status: r.status,
    origin: r.origin,
    destination: r.dest,
    created_at: isoDaysAgo(r.daysAgo, 8),
    estimated_at: isoDaysAgo(r.daysAgo - 1, 18),
    driver_id: r.motId,
    vehicle_id: `veh-${r.plate.toLowerCase().replace(/-/g, '')}`,
    numero_frete: r.nr,
    cliente_nome: r.client,
    valor_frete: r.valor,
    tipo_carga: 'Carga geral',
    peso_kg: 12000 + Math.floor(Math.random() * 8000),
    metadata: { 
      numero_frete: r.nr, 
      cliente_nome: r.client, 
      valor_frete: r.valor, 
      company_id: CID,
      ajudantes: r.ajudantes ?? 0,
      diarias_alimentacao: r.diarias ?? 0
    },
    motoristas: { id: r.motId, nome: r.motNome },
    vehicles: { plate: r.plate, modelo: r.modelo, status: r.status === 'in_transit' ? 'em_rota' : 'disponivel' },
  }));
}

export function buildSandboxTransactions(): TransactionRow[] {
  const items: Array<{ desc: string; amount: number; type: 'income' | 'expense'; cat: string; daysAgo: number }> = [
    { desc: 'Frete Alfa Logistics LF-240891', amount: 18450, type: 'income', cat: 'receita_frete', daysAgo: 0 },
    { desc: 'Frete Prime Cargo LF-240892', amount: 12200, type: 'income', cat: 'receita_frete', daysAgo: 1 },
    { desc: 'Combustível frota — posto Ipiranga', amount: 8420, type: 'expense', cat: 'combustivel', daysAgo: 0 },
    { desc: 'Manutenção TRK-204 — revisão 40.000 km', amount: 4200, type: 'expense', cat: 'manutencao', daysAgo: 2 },
    { desc: 'IPVA BRA-2L22 — parcela 2/3', amount: 1890, type: 'expense', cat: 'impostos', daysAgo: 5 },
    { desc: 'Salário operacional — quinzena', amount: 48500, type: 'expense', cat: 'folha', daysAgo: 3 },
    {
      desc: 'Folha 2026-04 — Ana Paula Mendes [colab:colab-98765432100]',
      amount: 5834.5,
      type: 'expense',
      cat: 'folha',
      daysAgo: 18,
    },
    {
      desc: 'Folha 2026-03 — Ana Paula Mendes [colab:colab-98765432100]',
      amount: 5834.5,
      type: 'expense',
      cat: 'folha',
      daysAgo: 48,
    },
    {
      desc: 'Folha 2026-02 — Ana Paula Mendes [colab:colab-98765432100]',
      amount: 6984.5,
      type: 'expense',
      cat: 'folha',
      daysAgo: 78,
    },
    { desc: 'Cliente NexFrete — boleto #8842', amount: 9800, type: 'income', cat: 'recebivel', daysAgo: 4 },
    { desc: 'Multa rodoviária LOG-8890', amount: 293.47, type: 'expense', cat: 'multas', daysAgo: 6 },
    { desc: 'Financiamento carreta CRT-7788', amount: 6200, type: 'expense', cat: 'financiamento', daysAgo: 1 },
    { desc: 'Frete LogExpress LF-240895', amount: 22100, type: 'income', cat: 'receita_frete', daysAgo: 2 },
    { desc: 'Seguro frota — mensalidade', amount: 3100, type: 'expense', cat: 'seguro', daysAgo: 7 },
    { desc: 'PIX recebido TransBrasil', amount: 11300, type: 'income', cat: 'pix', daysAgo: 0 },
    { desc: 'Pneus BRA-2L22 — troca dianteira', amount: 5600, type: 'expense', cat: 'pneus', daysAgo: 8 },
    { desc: 'Conta luz escritório SP', amount: 890, type: 'expense', cat: 'administrativo', daysAgo: 10 },
    { desc: 'Proposta Prime Cargo — contrato anual', amount: 156000, type: 'income', cat: 'contrato', daysAgo: 15 },
  ];

  return items.map((t, i) => ({
    id: `trx-${String(i + 1).padStart(3, '0')}`,
    type: t.type,
    amount: t.amount,
    description: t.desc,
    category: t.cat,
    paid_at: isoDaysAgo(t.daysAgo),
    created_at: isoDaysAgo(t.daysAgo),
    company_id: CID,
  }));
}

export function buildSandboxLeads() {
  return [
    { id: 'lead-001', company_id: CID, name: 'Mega Distribuidora Sul', company_name: 'Mega Distribuidora', value: 89000, status: 'leads', metadata: { segmento: 'Distribuição', owner_name: 'Juliana Costa', owner_role: 'Executiva Comercial' } },
    { id: 'lead-002', company_id: CID, name: 'Grupo Horizonte', company_name: 'Horizonte Log', value: 45000, status: 'contato', metadata: { segmento: 'E-commerce', owner_name: 'Roberto Silva', owner_role: 'Gerente Comercial' } },
    { id: 'lead-003', company_id: CID, name: 'Indústria Metal Forte', value: 120000, status: 'negociacao', metadata: { segmento: 'Industrial', owner_name: 'Ana Paula Mendes', owner_role: 'Coord. Vendas' } },
    { id: 'lead-004', company_id: CID, name: 'Rede Atacado Norte', value: 67000, status: 'proposta', metadata: { segmento: 'Varejo', owner_name: 'Roberto Silva', owner_role: 'Gerente Comercial' } },
    { id: 'lead-005', company_id: CID, name: 'Farmácias União', value: 32000, status: 'negociacao', metadata: { segmento: 'Saúde', owner_name: 'Juliana Costa', owner_role: 'Executiva Comercial' } },
    { id: 'lead-006', company_id: CID, name: 'TechParts Brasil', value: 54000, status: 'leads', metadata: { segmento: 'Tecnologia', owner_name: 'Ana Paula Mendes', owner_role: 'Coord. Vendas' } },
  ];
}

export function buildSandboxClients() {
  return [
    { id: 'cli-alfa', company_id: CID, name: 'Alfa Logistics', cnpj: '12.345.678/0001-90', email: 'operacao@alfalogistics.com.br', phone: '(11) 3456-7890', city: 'São Paulo', status: 'ativo', revenue_ytd: 420000, owner_name: 'Roberto Silva', owner_role: 'Gerente Comercial' },
    { id: 'cli-prime', company_id: CID, name: 'Prime Cargo', cnpj: '23.456.789/0001-01', email: 'fretes@primecargo.com.br', phone: '(11) 2987-6543', city: 'Campinas', status: 'ativo', revenue_ytd: 318000, owner_name: 'Ana Paula Mendes', owner_role: 'Coord. Vendas' },
    { id: 'cli-trans', company_id: CID, name: 'TransBrasil', cnpj: '34.567.890/0001-12', email: 'logistica@transbrasil.com.br', phone: '(41) 3322-1100', city: 'Curitiba', status: 'ativo', revenue_ytd: 275000, owner_name: 'Roberto Silva', owner_role: 'Gerente Comercial' },
    { id: 'cli-nex', company_id: CID, name: 'NexFrete', cnpj: '45.678.901/0001-23', email: 'comercial@nexfrete.com.br', phone: '(21) 3555-9900', city: 'Rio de Janeiro', status: 'ativo', revenue_ytd: 198000, owner_name: 'Juliana Costa', owner_role: 'Executiva Comercial' },
    { id: 'cli-logex', company_id: CID, name: 'LogExpress', cnpj: '56.789.012/0001-34', email: 'ops@logexpress.com.br', phone: '(31) 3210-4400', city: 'Belo Horizonte', status: 'inadimplente', revenue_ytd: 86000, owner_name: 'Juliana Costa', owner_role: 'Executiva Comercial' },
    { id: 'cli-sul', company_id: CID, name: 'Transportes Sul Minas', cnpj: '67.890.123/0001-45', email: 'contato@sulminas.com.br', phone: '(35) 3822-7788', city: 'Varginha', status: 'ativo', revenue_ytd: 142000, owner_name: 'Ana Paula Mendes', owner_role: 'Coord. Vendas' },
  ];
}

export type SandboxCte = {
  nr: string;
  date: string;
  client: string;
  origin: string;
  dest: string;
  value: string;
  status: string;
  shipmentId?: string;
};

export function buildSandboxCteList(): SandboxCte[] {
  return [
    { nr: '124018', date: '17/05/2026', client: 'Alfa Logistics', origin: 'São Paulo, SP', dest: 'Rio de Janeiro, RJ', value: 'R$ 18.450,00', status: 'Autorizado', shipmentId: 'shp-001' },
    { nr: '124019', date: '17/05/2026', client: 'Prime Cargo', origin: 'São Paulo, SP', dest: 'Belo Horizonte, MG', value: 'R$ 12.200,00', status: 'Autorizado', shipmentId: 'shp-002' },
    { nr: '124015', date: '16/05/2026', client: 'TransBrasil', origin: 'Curitiba, PR', dest: 'Campinas, SP', value: 'R$ 9.800,00', status: 'Rejeitado', shipmentId: 'shp-003' },
    { nr: '124016', date: '16/05/2026', client: 'NexFrete', origin: 'Santos, SP', dest: 'Joinville, SC', value: 'R$ 7.600,00', status: 'Processando', shipmentId: 'shp-004' },
    { nr: '124012', date: '15/05/2026', client: 'LogExpress', origin: 'Guarulhos, SP', dest: 'Brasília, DF', value: 'R$ 22.100,00', status: 'Autorizado', shipmentId: 'shp-005' },
    { nr: '124010', date: '15/05/2026', client: 'Alfa Logistics', origin: 'Ribeirão Preto, SP', dest: 'Uberlândia, MG', value: 'R$ 5.400,00', status: 'Autorizado', shipmentId: 'shp-006' },
  ];
}

export function buildSandboxMdfeList() {
  return [
    { nr: '89012', ufs: 'SP → RJ', plate: 'BRA-2L22', driver: 'Carlos Henrique', docs: 3, status: 'Autorizado' },
    { nr: '89013', ufs: 'SP → MG → RJ', plate: 'TRK-204', driver: 'Pedro Almeida', docs: 5, status: 'Autorizado' },
    { nr: '89008', ufs: 'PR → SP', plate: 'VAN-3341', driver: 'Ricardo Souza', docs: 2, status: 'Aberto' },
    { nr: '89005', ufs: 'SP → DF', plate: 'BRA-2L22', driver: 'Carlos Henrique', docs: 4, status: 'Encerrado' },
  ];
}

export function buildSandboxFiscalStats(): FiscalDocStats {
  return { cteEmitidos: 48, mdfeAtivos: 4, pendentesSefaz: 3, rejeitados: 2 };
}

export function buildSandboxPontoRecords(): PontoRecord[] {
  const people = [
    { id: 'colab-12345678901', name: 'Roberto Silva', doc: '12345678901' },
    { id: 'colab-98765432100', name: 'Ana Paula Mendes', doc: '98765432100' },
    { id: 'colab-45678912345', name: 'Carlos Henrique', doc: '45678912345' },
    { id: 'colab-32165498700', name: 'Juliana Rocha', doc: '32165498700' },
    { id: 'colab-78912345600', name: 'Marcos Oliveira', doc: '78912345600' },
    { id: 'colab-11122233355', name: 'André Ferreira', doc: '11122233355' },
    { id: 'colab-22233344466', name: 'Pedro Almeida', doc: '22233344466' },
    { id: 'colab-33344455577', name: 'Fernanda Costa', doc: '33344455577' },
  ];
  const records: PontoRecord[] = [];
  const types: Array<'entrada' | 'saida' | 'pausa_inicio' | 'pausa_fim'> = ['entrada', 'pausa_inicio', 'pausa_fim', 'saida'];

  people.forEach((p, pi) => {
    for (let d = 0; d < 3; d++) {
      types.forEach((type, ti) => {
        const h = 7 + ti * 2 + pi * 0.25;
        records.push({
          id: `pr-demo-${p.id}-${d}-${type}`,
          companyId: CID,
          configId: `ponto-${CID}`,
          collaboratorId: p.id,
          collaboratorName: p.name,
          collaboratorDocument: p.doc,
          type,
          timestamp: isoDaysAgo(d, Math.floor(h), (ti * 15) % 60),
          lat: -23.5505 + pi * 0.001,
          lng: -46.6333 + pi * 0.001,
          deviceInfo: 'Mobile · Safari',
          distanceMeters: 12 + pi * 5,
          validated: type !== 'entrada' || d > 0 || pi < 4,
          flags: pi === 4 && type === 'entrada' ? ['atraso'] : [],
        });
      });
    }
  });

  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return records;
}

export function buildSandboxColaboradorProfiles(): ColaboradorRhProfile[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'colab-12345678901',
      companyId: CID,
      fullName: 'Roberto Silva',
      document: '12345678901',
      email: 'roberto.silva@logtademo.com.br',
      phone: '(11) 98765-4321',
      address: 'Rua das Acácias, 420',
      city: 'São Paulo',
      state: 'SP',
      sector: 'Comercial',
      role: 'Gerente Comercial',
      admissionDate: '2022-03-15',
      vacationStart: isoDaysFromNow(45),
      vacationEnd: isoDaysFromNow(60),
      absences: [],
      requests: [
        {
          id: 'req-roberto-atest',
          type: 'atestado',
          title: 'Consulta ortopédica',
          status: 'aprovada',
          createdAt: isoDaysAgo(20, 11),
          detail: '1 dia — exame de rotina',
        },
      ],
      documents: [
        { id: 'd1', name: 'ASO periódico', type: 'Saúde', status: 'ok', expiresAt: isoDaysFromNow(200) },
        { id: 'd2', name: 'NR-35', type: 'Treinamento', status: 'ok' },
      ],
      linkedProfileId: 'prof-roberto',
      updatedAt: now,
    },
    {
      id: 'colab-98765432100',
      companyId: CID,
      fullName: 'Ana Paula Mendes',
      document: '98765432100',
      email: 'ana.mendes@logtademo.com.br',
      phone: '(11) 97654-3210',
      address: 'Av. Paulista, 1578 — conj. 42',
      city: 'São Paulo',
      state: 'SP',
      sector: 'RH',
      role: 'Analista RH',
      admissionDate: '2021-08-01',
      vacationStart: '',
      vacationEnd: '',
      employmentStatus: 'ativo',
      currentSalary: 7200,
      salaryHistory: [
        { id: 'sal-ana-1', effectiveDate: '2021-08-01', amount: 4800, note: 'Admissão CLT' },
        { id: 'sal-ana-2', effectiveDate: '2023-01-01', amount: 5800, note: 'Reajuste anual' },
        { id: 'sal-ana-3', effectiveDate: '2025-01-01', amount: 7200, note: 'Mérito — Analista RH' },
      ],
      timeline: [
        {
          id: 'tl-ana-1',
          at: isoDaysAgo(1200, 9),
          kind: 'admissao',
          title: 'Admissão na transportadora',
          detail: 'Contrato CLT · Analista RH',
        },
        {
          id: 'tl-ana-2',
          at: isoDaysAgo(900, 10),
          kind: 'status',
          title: 'Treinamento NR-01 concluído',
          detail: 'Integração e segurança do trabalho',
        },
        {
          id: 'tl-ana-3',
          at: isoDaysAgo(500, 11),
          kind: 'salario',
          title: 'Promoção — Analista RH',
          detail: 'Mudança de setor Comercial → RH',
        },
        {
          id: 'tl-ana-4',
          at: isoDaysAgo(400, 10),
          kind: 'salario',
          title: 'Reajuste salarial',
          detail: 'R$ 5.800 — mérito anual',
        },
        {
          id: 'tl-ana-5',
          at: isoDaysAgo(180, 9),
          kind: 'ferias',
          title: 'Férias gozadas',
          detail: '15 dias — período aquisitivo',
        },
        {
          id: 'tl-ana-6',
          at: isoDaysAgo(30, 11),
          kind: 'premio',
          title: 'Premiação Meia-Velha',
          detail: '4º ciclo de 6 meses na empresa',
        },
        {
          id: 'tl-ana-7',
          at: isoDaysAgo(12, 14),
          kind: 'atestado',
          title: 'Atestado médico registrado',
          detail: 'Consulta — 1 dia',
        },
      ],
      vacationDaysAvailable: 42,
      trainingsCompleted: 5,
      holerites: [
        {
          id: 'hol-ana-2026-05',
          competencia: '2026-05',
          grossSalary: 7200,
          additions: 0,
          discounts: 1332,
          netSalary: 5868,
          status: 'aguardando_pagamento',
          generatedAt: isoDaysAgo(2, 10),
          lines: [
            { label: 'Salário base', amount: 7200, type: 'provento' },
            { label: 'INSS', amount: 792, type: 'desconto' },
            { label: 'IRRF', amount: 540, type: 'desconto' },
          ],
        },
        {
          id: 'hol-ana-2026-04',
          competencia: '2026-04',
          grossSalary: 7200,
          additions: 0,
          discounts: 1332,
          netSalary: 5868,
          status: 'pago',
          paidAt: isoDaysAgo(18, 14),
          financeTransactionId: 'trx-folha-ana-04',
          generatedAt: isoDaysAgo(32, 10),
          signedAt: isoDaysAgo(17, 9),
          lines: [
            { label: 'Salário base', amount: 7200, type: 'provento' },
            { label: 'INSS', amount: 792, type: 'desconto' },
            { label: 'IRRF', amount: 540, type: 'desconto' },
          ],
        },
        {
          id: 'hol-ana-2026-03',
          competencia: '2026-03',
          grossSalary: 8050,
          additions: 850,
          discounts: 1455,
          netSalary: 6595,
          status: 'pago',
          paidAt: isoDaysAgo(48, 14),
          financeTransactionId: 'trx-folha-ana-03',
          generatedAt: isoDaysAgo(62, 10),
          signedAt: isoDaysAgo(47, 9),
          lines: [
            { label: 'Salário base', amount: 7200, type: 'provento' },
            { label: 'Meia-Velha — prêmio', amount: 850, type: 'provento' },
            { label: 'INSS', amount: 885, type: 'desconto' },
            { label: 'IRRF', amount: 570, type: 'desconto' },
          ],
        },
        {
          id: 'hol-ana-2026-02',
          competencia: '2026-02',
          grossSalary: 8400,
          additions: 1200,
          discounts: 1515,
          netSalary: 6885,
          status: 'pago',
          paidAt: isoDaysAgo(78, 14),
          generatedAt: isoDaysAgo(92, 10),
          lines: [
            { label: 'Salário base', amount: 7200, type: 'provento' },
            { label: 'Bônus Q1', amount: 1200, type: 'provento' },
            { label: 'INSS', amount: 924, type: 'desconto' },
            { label: 'IRRF', amount: 591, type: 'desconto' },
          ],
        },
      ],
      financialExtras: [
        {
          id: 'fin-ana-1',
          kind: 'premiacao',
          label: 'Meia-Velha — 4º ciclo',
          amount: 850,
          at: isoDaysAgo(30, 12),
          note: 'Premiação semestral',
        },
        {
          id: 'fin-ana-2',
          kind: 'beneficio',
          label: 'Vale refeição + transporte',
          amount: 680,
          at: isoDaysAgo(5, 8),
        },
        {
          id: 'fin-ana-3',
          kind: 'bonus',
          label: 'Bônus desempenho Q1',
          amount: 1200,
          at: isoDaysAgo(60, 10),
          note: 'Meta RH 102%',
        },
      ],
      goals: [
        {
          id: 'meta-ana-1',
          title: 'Tempo médio admissão digital',
          target: 5,
          current: 4.2,
          unit: 'dias',
          status: 'em_andamento',
          teamRank: 2,
          dueDate: isoDaysFromNow(90),
        },
        {
          id: 'meta-ana-2',
          title: 'Treinamentos NR em dia',
          target: 100,
          current: 98,
          unit: '%',
          status: 'em_andamento',
          teamRank: 1,
        },
      ],
      requests: [
        {
          id: 'req-ana-1',
          type: 'ferias',
          title: 'Solicitação de férias — 15 dias',
          status: 'aberta',
          createdAt: isoDaysAgo(2, 10),
          detail: 'Período sugerido: julho/2026',
        },
        {
          id: 'req-ana-atest-1',
          type: 'atestado',
          title: 'Atestado médico — 2 dias',
          status: 'aberta',
          createdAt: isoDaysAgo(1, 9),
          detail: 'Gripe — afastamento 2 dias com CID J11.1',
        },
      ],
      auditLog: [
        {
          id: 'aud-ana-1',
          at: isoDaysAgo(1, 15),
          actor: 'RH Admin',
          action: 'Salário atualizado',
          detail: 'R$ 7.200 — mérito 2025',
        },
        {
          id: 'aud-ana-2',
          at: isoDaysAgo(12, 14),
          actor: 'Ana Paula Mendes',
          action: 'Atestado anexado',
          detail: '1 dia de afastamento',
        },
      ],
      internalNotes: [
        {
          id: 'note-ana-1',
          at: isoDaysAgo(20, 11),
          author: 'Diretoria RH',
          body: 'Referência para programa de liderança 2026 — alta performance.',
        },
      ],
      agenda: [
        {
          id: 'ag-ana-1',
          at: isoDaysFromNow(42),
          kind: 'ferias',
          title: 'Janela de férias disponível',
          detail: '42 dias acumulados',
        },
        {
          id: 'ag-ana-2',
          at: isoDaysFromNow(14),
          kind: 'treinamento',
          title: 'NR-35 reciclagem',
          detail: 'Turma interna — 4h',
        },
        {
          id: 'ag-ana-3',
          at: isoDaysFromNow(3),
          kind: 'reuniao',
          title: '1:1 com gestor RH',
          detail: 'Revisão de metas Q2',
        },
        {
          id: 'ag-ana-4',
          at: '2026-08-01',
          kind: 'aniversario',
          title: 'Aniversário de empresa',
          detail: '5 anos na transportadora',
        },
      ],
      absences: [{ id: 'a1', date: isoDaysFromNow(-12), reason: 'Consulta médica', tipo: 'atestado' }],
      documents: [
        {
          id: 'd1',
          name: 'Contrato CLT',
          type: 'Contrato',
          category: 'contrato',
          status: 'ok',
          uploadedAt: isoDaysAgo(1200, 9),
          signedAt: isoDaysAgo(1200, 9),
        },
        {
          id: 'd2',
          name: 'RG',
          type: 'Identidade',
          category: 'rg',
          status: 'ok',
          uploadedAt: isoDaysAgo(1200, 9),
        },
        {
          id: 'd3',
          name: 'CPF',
          type: 'CPF',
          category: 'cpf',
          status: 'ok',
          uploadedAt: isoDaysAgo(1200, 9),
        },
        {
          id: 'd4',
          name: 'ASO periódico',
          type: 'Saúde',
          category: 'medico',
          status: 'ok',
          expiresAt: isoDaysFromNow(200),
          uploadedAt: isoDaysAgo(90, 10),
        },
        {
          id: 'd5',
          name: 'Certificado NR-01',
          type: 'Treinamento',
          category: 'certificado',
          status: 'ok',
          uploadedAt: isoDaysAgo(200, 10),
        },
      ],
      linkedProfileId: 'prof-ana',
      equipeMatricula: '98765432100',
      updatedAt: now,
    },
    {
      id: 'colab-11122233344',
      companyId: CID,
      fullName: 'Ana Clara Santos',
      document: '11122233344',
      email: 'ana.clara.santos@logtademo.com.br',
      phone: '(11) 91234-5678',
      address: 'Rua Augusta, 1200',
      city: 'São Paulo',
      state: 'SP',
      sector: 'Comercial',
      role: 'Assistente Comercial',
      admissionDate: '2024-03-10',
      employmentStatus: 'ativo',
      currentSalary: 4200,
      equipeMatricula: '11122233344',
      absences: [],
      documents: [{ id: 'd-ana2', name: 'Contrato CLT', type: 'Contrato', category: 'contrato', status: 'ok' }],
      updatedAt: now,
    },
    {
      id: 'colab-45678912345',
      companyId: CID,
      fullName: 'Carlos Henrique',
      document: '45678912345',
      email: 'carlos.henrique@logtademo.com.br',
      phone: '(11) 96543-2109',
      address: 'Rua do Motorista, 88',
      city: 'Guarulhos',
      state: 'SP',
      sector: 'Frota',
      role: 'Motorista',
      admissionDate: '2020-01-10',
      currentSalary: 3500,
      salaryHistory: [
        {
          id: 'sal-carlos-1',
          effectiveDate: '2026-01-10',
          amount: 3500,
          note: 'Reajuste anual — dissídio',
        },
        {
          id: 'sal-carlos-0',
          effectiveDate: '2025-01-10',
          amount: 3200,
          note: 'Salário base anterior',
        },
      ],
      vacationStart: isoDaysFromNow(90),
      vacationEnd: isoDaysFromNow(104),
      vacationDaysAvailable: 18,
      trainingsCompleted: 4,
      motoristaOps: {
        trucksUsed: ['Scania R450 — ABC1D23', 'Volvo FH — XYZ9K88'],
        kmRodados: 128400,
        entregas: 342,
        multas: 1,
        ocorrencias: 3,
        rotasAtivas: 2,
        consumoMedio: '2,8 km/l',
      },
      absences: [
        { id: 'a2', date: isoDaysFromNow(-3), reason: 'Falta não justificada', tipo: 'falta' },
        {
          id: 'a-carlos-atest',
          date: isoDaysAgo(2, 8),
          reason: 'Repouso médico — 3 dias',
          tipo: 'atestado',
        },
      ],
      requests: [
        {
          id: 'req-carlos-atest',
          type: 'atestado',
          title: 'Atestado pós consulta',
          status: 'aberta',
          createdAt: isoDaysAgo(2, 8),
          detail: 'Encaminhamento médico — 3 dias de afastamento',
        },
      ],
      documents: [
        {
          id: 'd1',
          name: 'CNH categoria E',
          type: 'CNH',
          category: 'cnh',
          status: 'vencendo',
          expiresAt: isoDaysFromNow(45),
        },
        { id: 'd2', name: 'MOPP', type: 'Certificação', category: 'certificado', status: 'ok' },
      ],
      linkedProfileId: 'prof-carlos',
      updatedAt: now,
    },
    {
      id: 'colab-comercial-juliana',
      companyId: CID,
      fullName: 'Juliana Costa',
      document: '11122233344',
      email: 'juliana.costa@logtademo.com.br',
      phone: '(11) 94321-0987',
      address: 'Av. Brigadeiro Faria Lima, 3400',
      city: 'São Paulo',
      state: 'SP',
      sector: 'Comercial',
      role: 'Executiva Comercial',
      admissionDate: '2020-11-02',
      vacationStart: '',
      vacationEnd: '',
      absences: [],
      documents: [{ id: 'd1', name: 'Meta trimestral Q2', type: 'Comercial', status: 'ok' }],
      linkedProfileId: 'prof-juliana-costa',
      updatedAt: now,
    },
    {
      id: 'colab-32165498700',
      companyId: CID,
      fullName: 'Juliana Rocha',
      document: '32165498700',
      email: 'juliana.rocha@logtademo.com.br',
      phone: '(11) 95432-1098',
      address: 'Rua Funchal, 200',
      city: 'São Paulo',
      state: 'SP',
      sector: 'Fiscal',
      role: 'Coordenadora Fiscal',
      admissionDate: '2019-06-20',
      vacationStart: '',
      vacationEnd: '',
      absences: [],
      documents: [{ id: 'd1', name: 'Certificado digital A1', type: 'Fiscal', status: 'vencendo', expiresAt: isoDaysFromNow(7) }],
      linkedProfileId: 'prof-juliana',
      updatedAt: now,
    },
    {
      id: 'colab-22233344466',
      companyId: CID,
      fullName: 'Pedro Almeida',
      document: '22233344466',
      email: 'pedro.almeida@logtademo.com.br',
      sector: 'Operações',
      role: 'Motorista',
      admissionDate: '2018-04-12',
      employmentStatus: 'desligado',
      systemAccessBlocked: true,
      lastStatusReason: 'Pedido de demissão — rescisão acordada',
      equipeMatricula: '22233344466',
      absences: [],
      documents: [],
      timeline: [
        {
          id: 'tl-pedro-des',
          at: isoDaysAgo(14, 16),
          kind: 'desligamento',
          title: 'Desligamento da empresa',
          detail: 'Pedido de demissão — rescisão acordada',
        },
      ],
      linkedProfileId: 'mot-pedro',
      updatedAt: now,
    },
    {
      id: 'colab-11122233355',
      companyId: CID,
      fullName: 'André Ferreira',
      document: '11122233355',
      email: 'andre.ferreira@logtademo.com.br',
      sector: 'Operações',
      role: 'Motorista',
      admissionDate: '2019-09-01',
      employmentStatus: 'desligado',
      systemAccessBlocked: true,
      lastStatusReason: 'Dispensa sem justa causa',
      equipeMatricula: '11122233355',
      absences: [],
      documents: [],
      timeline: [
        {
          id: 'tl-andre-des',
          at: isoDaysAgo(32, 11),
          kind: 'desligamento',
          title: 'Desligamento da empresa',
          detail: 'Dispensa sem justa causa',
        },
      ],
      linkedProfileId: 'mot-andre',
      updatedAt: now,
    },
  ];
}

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  delayed: 'Atrasado',
  loading: 'Carregando',
  pending: 'Pendente',
  stopped: 'Parado',
  unloading: 'Descarga',
  incident: 'Ocorrência',
};

type SandboxClientRow = ReturnType<typeof buildSandboxClients>[number] & {
  owner_name?: string;
  owner_role?: string;
};

function resolveSandboxClientRow(clientOrLeadId: string): SandboxClientRow | null {
  const fromClient = buildSandboxClients().find((c) => c.id === clientOrLeadId);
  if (fromClient) return fromClient;

  const lead = buildSandboxLeads().find((l) => l.id === clientOrLeadId);
  if (!lead) return null;

  const meta = (lead.metadata ?? {}) as { owner_name?: string; owner_role?: string; segmento?: string };
  return {
    id: lead.id,
    company_id: CID,
    name: lead.name || lead.company_name || 'Lead',
    cnpj: '—',
    email: '',
    phone: '',
    city: '',
    status: 'prospect',
    revenue_ytd: Number(lead.value) || 0,
    owner_name: meta.owner_name ?? 'Comercial Logta',
    owner_role: meta.owner_role ?? 'Vendas',
  };
}

export function getSandboxClientProfile(clientId: string, _companyId: string = CID) {
  const client = resolveSandboxClientRow(clientId);
  if (!client) return null;

  const shipments = buildSandboxShipments().filter(
    (s) => (s.cliente_nome ?? (s.metadata as { cliente_nome?: string })?.cliente_nome) === client.name,
  );
  const ctes = buildSandboxCteList().filter((d) => d.client === client.name);

  const fretes = shipments.map((s) => ({
    id: s.numero_frete ?? s.id,
    shipmentId: s.id,
    origin: s.origin ?? '—',
    dest: s.destination ?? '—',
    status: SHIPMENT_STATUS_LABEL[s.status ?? ''] ?? s.status ?? '—',
    value: `R$ ${Number(s.valor_frete ?? (s.metadata as { valor_frete?: number })?.valor_frete ?? 0).toLocaleString('pt-BR')}`,
    date: s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—',
    carga: s.tipo_carga || 'Carga geral',
  }));

  const activeFretesCount = shipments.filter(
    (s) => s.status && !['delivered', 'entregue'].includes(s.status),
  ).length;

  const statusLabel =
    client.status === 'ativo'
      ? 'Ativo'
      : client.status === 'inadimplente'
        ? 'Inadimplente'
        : client.status === 'prospect'
          ? 'Prospect'
          : 'Bloqueado';

  return {
    name: client.name,
    segment: 'Transportadora',
    cnpj: client.cnpj,
    contractType: 'Contrato Ativo',
    status: statusLabel,
    ownerName: client.owner_name ?? 'Comercial Logta',
    ownerRole: client.owner_role ?? 'Vendas',
    volume: `R$ ${Number(client.revenue_ytd ?? 0).toLocaleString('pt-BR')}`,
    contactName: client.name,
    contactPhone: client.phone,
    contactEmail: client.email,
    address: client.city ? `${client.city}` : 'Endereço não cadastrado',
    activeFretesCount,
    totalRevenue: `R$ ${Number(client.revenue_ytd ?? 0).toLocaleString('pt-BR')}`,
    paidVolume: `R$ ${Math.round((client.revenue_ytd ?? 0) * 0.72).toLocaleString('pt-BR')}`,
    pendingVolume: `R$ ${Math.round((client.revenue_ytd ?? 0) * 0.28).toLocaleString('pt-BR')}`,
    limit: 'R$ 500.000,00',
    nps: client.status === 'ativo' ? 4.8 : 3.2,
    hasZaptro: !!client.phone,
    fretes,
    fiscal: ctes.map((doc) => ({
      nr: doc.nr,
      doc: 'CT-e',
      date: doc.date,
      val: doc.value,
      sefaz: doc.status,
      shipmentId: doc.shipmentId,
    })),
    crmLogs: [
      { date: 'Hoje', action: `${client.owner_name ?? 'Equipe comercial'} em atendimento ativo` },
      { date: 'Ontem', action: `${fretes.length} fretes vinculados ao cliente` },
    ],
  };
}

/** Nome do responsável comercial (CRM) → id do colaborador RH */
export const SANDBOX_OWNER_TO_COLAB_ID: Record<string, string> = {
  'Roberto Silva': 'colab-12345678901',
  'Ana Paula Mendes': 'colab-98765432100',
  'Juliana Costa': 'colab-comercial-juliana',
};

export function resolveColaboradorIdByOwnerName(ownerName?: string | null): string | null {
  if (!ownerName?.trim()) return null;
  return SANDBOX_OWNER_TO_COLAB_ID[ownerName.trim()] ?? null;
}

export function getOwnerNameByColaboradorId(colabId: string): string | null {
  const entry = Object.entries(SANDBOX_OWNER_TO_COLAB_ID).find(([, id]) => id === colabId);
  return entry?.[0] ?? null;
}

export function getColaboradorCrmPortfolio(colabId: string) {
  const ownerName = getOwnerNameByColaboradorId(colabId);
  const profile = buildSandboxColaboradorProfiles().find((p) => p.id === colabId);
  const clients = buildSandboxClients().filter((c) => c.owner_name === ownerName);
  const leads = buildSandboxLeads().filter((l) => {
    const meta = (l.metadata ?? {}) as { owner_name?: string };
    return meta.owner_name === ownerName;
  });
  const closedLeads = leads.filter((l) => l.status === 'fechado' || l.status === 'proposta');
  const revenueYtd = clients.reduce((s, c) => s + (c.revenue_ytd ?? 0), 0);

  return {
    colabId,
    ownerName: ownerName ?? profile?.fullName ?? 'Colaborador',
    profile,
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      city: c.city,
      revenueYtd: c.revenue_ytd ?? 0,
      ownerRole: c.owner_role,
    })),
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name || l.company_name || 'Lead',
      status: l.status,
      value: l.value ?? 0,
      segmento: ((l.metadata ?? {}) as { segmento?: string }).segmento,
    })),
    stats: {
      clientesAtivos: clients.filter((c) => c.status === 'ativo').length,
      clientesTotal: clients.length,
      leadsAbertos: leads.filter((l) => !['fechado'].includes(l.status ?? '')).length,
      negociosFechados: closedLeads.length + clients.filter((c) => c.status === 'ativo').length,
      faturamentoCarteira: revenueYtd,
      ticketMedio: clients.length ? Math.round(revenueYtd / clients.length) : 0,
    },
  };
}

export function getSandboxOperationalBundle(companyId: string = CID) {
  return {
    companyId,
    profiles: buildSandboxProfiles(),
    motoristas: buildSandboxMotoristas(),
    vehicles: buildSandboxVehicles(),
    shipments: buildSandboxShipments(),
    transactions: buildSandboxTransactions(),
    leads: buildSandboxLeads(),
    clients: buildSandboxClients(),
    cteList: buildSandboxCteList(),
    mdfeList: buildSandboxMdfeList(),
    fiscalStats: buildSandboxFiscalStats(),
    pontoRecords: buildSandboxPontoRecords(),
    colaboradorProfiles: buildSandboxColaboradorProfiles(),
  };
}
