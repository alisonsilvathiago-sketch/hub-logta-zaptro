import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  Calendar,
  Car,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  FileText,
  Fuel,
  Gauge,
  History,
  Landmark,
  LineChart,
  Link2,
  Percent,
  PieChart,
  QrCode,
  Receipt,
  Route,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import type { FinanceiroModuleCategory, FinanceiroModuleDef, FinanceiroModuleSection } from './types';

export const FINANCEIRO_OPERACIONAL_SECTIONS: FinanceiroModuleSection[] = [
  { id: 'viagem', title: 'Controle por Viagem' },
  { id: 'custos-op', title: 'Custos Operacionais' },
  { id: 'fretes', title: 'Fretes & Receita' },
  { id: 'integracoes-op', title: 'Integrações Operacionais' },
];

export const FINANCEIRO_GESTAO_SECTIONS: FinanceiroModuleSection[] = [
  { id: 'fluxo', title: 'Fluxo & Caixa' },
  { id: 'recebiveis', title: 'Recebíveis & Faturamento' },
  { id: 'pagaveis', title: 'Pagáveis & Custos' },
  { id: 'bancario', title: 'Bancário & Conciliação' },
  { id: 'relatorios', title: 'Relatórios & KPI' },
  { id: 'governanca', title: 'Governança & IA' },
];

const operacional: FinanceiroModuleDef[] = [
  { slug: 'custos-por-viagem', title: 'Custos por Viagem', description: 'Lucro, diesel, pedágio, diária, manutenção, motorista e margem real.', category: 'operacional', sectionId: 'viagem', icon: Route, iaEnabled: true },
  { slug: 'lucro-viagem', title: 'Lucro da Viagem', description: 'Margem líquida por CT-e / viagem com breakdown de custos.', category: 'operacional', sectionId: 'viagem', icon: TrendingUp, iaEnabled: true },
  { slug: 'custos-combustivel', title: 'Custos de Combustível', description: 'Consumo e custo de combustível por viagem e período.', category: 'operacional', sectionId: 'viagem', icon: Fuel, integrations: ['frota'] },
  { slug: 'controle-pedagios', title: 'Controle de Pedágios', description: 'Pedágios por rota, tag e viagem.', category: 'operacional', sectionId: 'viagem', icon: Receipt },
  { slug: 'controle-diarias', title: 'Controle de Diárias', description: 'Diárias de motorista e ajudante por viagem.', category: 'operacional', sectionId: 'viagem', icon: Wallet, integrations: ['rh'] },
  { slug: 'margem-operacional', title: 'Margem Operacional', description: 'Margem bruta e líquida da operação logística.', category: 'operacional', sectionId: 'viagem', icon: Percent, iaEnabled: true },
  { slug: 'controle-combustivel', title: 'Controle de Combustível', description: 'Abastecimentos e custo por km.', category: 'operacional', sectionId: 'custos-op', icon: Fuel, integrations: ['frota'], externalPath: '/frota/combustivel' },
  { slug: 'custos-veiculo', title: 'Custos por Veículo', description: 'TCO por placa: combustível, manutenção e depreciação.', category: 'operacional', sectionId: 'custos-op', icon: Car, integrations: ['frota'], externalPath: '/frota' },
  { slug: 'custos-motorista', title: 'Custos por Motorista', description: 'Salário, diárias, multas e combustível por condutor.', category: 'operacional', sectionId: 'custos-op', icon: Users, integrations: ['rh'], externalPath: '/rh/operacional/custos-motorista' },
  { slug: 'controle-manutencao', title: 'Controle de Manutenção', description: 'OS e custos de manutenção vinculados à frota.', category: 'operacional', sectionId: 'custos-op', icon: Wrench, integrations: ['frota'], externalPath: '/frota/manutencao' },
  { slug: 'controle-multas', title: 'Controle de Multas', description: 'Multas de trânsito e impacto financeiro.', category: 'operacional', sectionId: 'custos-op', icon: AlertTriangle },
  { slug: 'controle-comissoes', title: 'Controle de Comissões', description: 'Comissões de frete, agenciador e representante.', category: 'operacional', sectionId: 'custos-op', icon: BadgeCheck },
  { slug: 'controle-fretes', title: 'Controle de Fretes', description: 'Receita e custo por frete contratado.', category: 'operacional', sectionId: 'fretes', icon: Truck, integrations: ['logistica'], externalPath: '/logistica' },
  { slug: 'simulador-frete', title: 'Simulador de Frete', description: 'Precificação de frete com margem e custos operacionais.', category: 'operacional', sectionId: 'fretes', icon: Calculator, iaEnabled: true, externalPath: '/financeiro/dashboard' },
  { slug: 'simulador-lucro', title: 'Simulador de Lucro', description: 'Simule lucro líquido por viagem ou período.', category: 'operacional', sectionId: 'fretes', icon: LineChart, iaEnabled: true, externalPath: '/financeiro/dashboard' },
  { slug: 'simulador-operacional', title: 'Simulador Operacional', description: 'Cenários de custo operacional e capacidade.', category: 'operacional', sectionId: 'fretes', icon: Gauge, iaEnabled: true, externalPath: '/financeiro/dashboard' },
  { slug: 'integracao-logistica', title: 'Integração Logística', description: 'Viagens, entregas e CT-e no financeiro.', category: 'operacional', sectionId: 'integracoes-op', icon: Link2, integrations: ['logistica'], externalPath: '/logistica' },
  { slug: 'integracao-frota', title: 'Integração Frota', description: 'Custos de frota sincronizados ao financeiro.', category: 'operacional', sectionId: 'integracoes-op', icon: Truck, integrations: ['frota'], externalPath: '/frota' },
  { slug: 'integracao-rh', title: 'Integração RH', description: 'Folha, diárias e custos de pessoal.', category: 'operacional', sectionId: 'integracoes-op', icon: Users, integrations: ['rh'], externalPath: '/rh' },
];

const gestao: FinanceiroModuleDef[] = [
  { slug: 'fluxo-caixa', title: 'Fluxo de Caixa', description: 'Entradas, saídas e saldo projetado.', category: 'gestao', sectionId: 'fluxo', icon: PieChart, externalPath: '/financeiro/fluxo' },
  { slug: 'centro-custos', title: 'Centro de Custos', description: 'Rateio por filial, rota e departamento.', category: 'gestao', sectionId: 'fluxo', icon: Building2 },
  { slug: 'projecao-financeira', title: 'Projeção Financeira', description: 'Forecast de caixa 30/60/90 dias.', category: 'gestao', sectionId: 'fluxo', icon: LineChart, iaEnabled: true },
  { slug: 'contas-receber', title: 'Contas a Receber', description: 'Títulos a receber e recebimentos.', category: 'gestao', sectionId: 'recebiveis', icon: TrendingUp, externalPath: '/financeiro/receber' },
  { slug: 'faturamento', title: 'Faturamento', description: 'Emissão e controle de faturas de serviço.', category: 'gestao', sectionId: 'recebiveis', icon: FileText },
  { slug: 'emissao-faturas', title: 'Emissão de Faturas', description: 'Geração de faturas em lote por cliente.', category: 'gestao', sectionId: 'recebiveis', icon: Receipt },
  { slug: 'emissao-boletos', title: 'Emissão de Boletos', description: 'Boletos registrados e remessa bancária.', category: 'gestao', sectionId: 'recebiveis', icon: Banknote, integrations: ['bancario'] },
  { slug: 'pix-integrado', title: 'PIX Integrado', description: 'Cobrança e recebimento via PIX.', category: 'gestao', sectionId: 'recebiveis', icon: QrCode, integrations: ['bancario'] },
  { slug: 'inadimplencia', title: 'Controle de Inadimplência', description: 'Clientes em atraso e régua de cobrança.', category: 'gestao', sectionId: 'recebiveis', icon: AlertTriangle, iaEnabled: true },
  { slug: 'contas-pagar', title: 'Contas a Pagar', description: 'Despesas, vencimentos e pagamentos.', category: 'gestao', sectionId: 'pagaveis', icon: TrendingDown, externalPath: '/financeiro/pagar' },
  { slug: 'parcelamentos', title: 'Controle de Parcelamentos', description: 'Parcelas e renegociações.', category: 'gestao', sectionId: 'pagaveis', icon: Calendar },
  { slug: 'aprovacao-pagamentos', title: 'Aprovação de Pagamentos', description: 'Workflow de aprovação antes do pagamento.', category: 'gestao', sectionId: 'pagaveis', icon: ClipboardCheck },
  { slug: 'aprovacao-multiusuario', title: 'Aprovação Multiusuário', description: 'Alçadas e dupla aprovação.', category: 'gestao', sectionId: 'pagaveis', icon: Shield },
  { slug: 'gestao-fornecedores', title: 'Gestão de Fornecedores', description: 'Cadastro e histórico com fornecedores.', category: 'gestao', sectionId: 'pagaveis', icon: Building2 },
  { slug: 'controle-contratos', title: 'Controle de Contratos', description: 'Contratos financeiros e reajustes.', category: 'gestao', sectionId: 'pagaveis', icon: FileCheck },
  { slug: 'controle-assinaturas', title: 'Controle de Assinaturas', description: 'SaaS, seguros e assinaturas recorrentes.', category: 'gestao', sectionId: 'pagaveis', icon: CreditCard },
  { slug: 'controle-bancario', title: 'Controle Bancário', description: 'Contas correntes e saldos bancários.', category: 'gestao', sectionId: 'bancario', icon: Landmark, integrations: ['bancario'] },
  { slug: 'conciliacao-bancaria', title: 'Conciliação Bancária', description: 'Conciliação OFX e extrato automático.', category: 'gestao', sectionId: 'bancario', icon: ArrowLeftRight, integrations: ['bancario'] },
  { slug: 'integracao-bancaria', title: 'Integração Bancária', description: 'Open Finance e APIs bancárias.', category: 'gestao', sectionId: 'bancario', icon: Link2, integrations: ['bancario'] },
  { slug: 'gestao-tributaria', title: 'Gestão Tributária', description: 'Obrigações e calendário fiscal.', category: 'gestao', sectionId: 'relatorios', icon: Scale, integrations: ['fiscal'] },
  { slug: 'impostos', title: 'Impostos', description: 'ICMS, PIS/COFINS e retenções.', category: 'gestao', sectionId: 'relatorios', icon: Percent, integrations: ['fiscal'] },
  { slug: 'dre', title: 'DRE', description: 'Demonstrativo de resultado do exercício.', category: 'gestao', sectionId: 'relatorios', icon: BarChart3 },
  { slug: 'relatorios-financeiros', title: 'Relatórios Financeiros', description: 'Exportação PDF/Excel de relatórios.', category: 'gestao', sectionId: 'relatorios', icon: FileText },
  { slug: 'dashboard-executivo', title: 'Dashboard Executivo', description: 'Visão consolidada da saúde financeira.', category: 'gestao', sectionId: 'relatorios', icon: Activity, externalPath: '/financeiro/dashboard' },
  { slug: 'kpi-financeiro', title: 'KPI Financeiro', description: 'Indicadores-chave da operação financeira.', category: 'gestao', sectionId: 'relatorios', icon: Target },
  { slug: 'meta-receita', title: 'Meta de Receita', description: 'Metas e acompanhamento de receita.', category: 'gestao', sectionId: 'relatorios', icon: TrendingUp },
  { slug: 'meta-lucro', title: 'Meta de Lucro', description: 'Metas de lucro operacional e líquido.', category: 'gestao', sectionId: 'relatorios', icon: Zap },
  { slug: 'comparativo-mensal', title: 'Comparativo Mensal', description: 'Mês atual vs anterior.', category: 'gestao', sectionId: 'relatorios', icon: Calendar },
  { slug: 'comparativo-anual', title: 'Comparativo Anual', description: 'Ano corrente vs ano anterior.', category: 'gestao', sectionId: 'relatorios', icon: BarChart3 },
  { slug: 'gestao-clientes', title: 'Gestão de Clientes', description: 'Financeiro por cliente e limite de crédito.', category: 'gestao', sectionId: 'relatorios', icon: Users, integrations: ['crm'], externalPath: '/crm/clientes' },
  { slug: 'historico-financeiro', title: 'Histórico Financeiro', description: 'Linha do tempo de movimentações.', category: 'gestao', sectionId: 'governanca', icon: History },
  { slug: 'auditoria-financeira', title: 'Auditoria Financeira', description: 'Trilhas e conformidade financeira.', category: 'gestao', sectionId: 'governanca', icon: BadgeCheck },
  { slug: 'logs-financeiros', title: 'Logs Financeiros', description: 'Registro de alterações e acessos.', category: 'gestao', sectionId: 'governanca', icon: History },
  { slug: 'alertas-financeiros', title: 'Alertas Financeiros', description: 'Central de alertas críticos.', category: 'gestao', sectionId: 'governanca', icon: Bell, externalPath: '/financeiro/alertas' },
  { slug: 'alertas-vencimento', title: 'Alertas de Vencimento', description: 'Vencimentos próximos e em atraso.', category: 'gestao', sectionId: 'governanca', icon: AlertTriangle, externalPath: '/financeiro/alertas' },
  { slug: 'integracao-fiscal', title: 'Integração Fiscal', description: 'NF-e, CT-e e obrigações fiscais.', category: 'gestao', sectionId: 'governanca', icon: FileCheck, integrations: ['fiscal'], externalPath: '/documentos' },
  { slug: 'ia-financeira', title: 'IA Financeira', description: 'Insights automáticos sobre sua operação.', category: 'gestao', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-previsao-caixa', title: 'IA Previsão de Caixa', description: 'Predição de saldo e risco de caixa.', category: 'gestao', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-risco-financeiro', title: 'IA Risco Financeiro', description: 'Score de risco e inadimplência.', category: 'gestao', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-gastos-excessivos', title: 'IA Gastos Excessivos', description: 'Detecção de anomalias de despesa.', category: 'gestao', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
  { slug: 'calculadora-inteligente', title: 'Central Inteligente Financeira', description: 'Frete, lucro, combustível, margem e projeção com IA.', category: 'gestao', sectionId: 'governanca', icon: Calculator, iaEnabled: true, externalPath: '/financeiro/central' },
];

export const FINANCEIRO_MODULES: FinanceiroModuleDef[] = [...operacional, ...gestao];

export function getFinanceiroModule(slug: string, category: FinanceiroModuleCategory): FinanceiroModuleDef | undefined {
  return FINANCEIRO_MODULES.find((m) => m.slug === slug && m.category === category);
}

export function getFinanceiroModulesByCategory(category: FinanceiroModuleCategory): FinanceiroModuleDef[] {
  return FINANCEIRO_MODULES.filter((m) => m.category === category);
}

export function getFinanceiroSections(category: FinanceiroModuleCategory): FinanceiroModuleSection[] {
  return category === 'operacional' ? FINANCEIRO_OPERACIONAL_SECTIONS : FINANCEIRO_GESTAO_SECTIONS;
}
