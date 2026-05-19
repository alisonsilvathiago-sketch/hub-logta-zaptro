import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CalendarClock,
  Car,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileCheck,
  FileSignature,
  FileText,
  Fuel,
  Gauge,
  GitBranch,
  GraduationCap,
  HardHat,
  History,
  Link2,
  MapPin,
  MessageSquare,
  Plane,
  Radio,
  RefreshCw,
  Route,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Truck,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { RhModuleCategory, RhModuleDef, RhModuleSection } from './types';

export const RH_ADMIN_SECTIONS: RhModuleSection[] = [
  { id: 'jornada', title: 'Jornada & Ponto' },
  { id: 'documentos', title: 'Documentos & Compliance' },
  { id: 'pessoas', title: 'Pessoas & Ciclo de Vida' },
  { id: 'performance', title: 'Performance & Desenvolvimento' },
  { id: 'comunicacao', title: 'Comunicação Interna' },
  { id: 'governanca', title: 'Governança & Integrações' },
];

export const RH_OPERATIONAL_SECTIONS: RhModuleSection[] = [
  { id: 'equipe-op', title: 'Equipe em Operação' },
  { id: 'jornada-op', title: 'Jornada & Viagem' },
  { id: 'docs-op', title: 'Documentos & Segurança' },
  { id: 'performance-op', title: 'Performance & Custos' },
  { id: 'alertas-op', title: 'Alertas & Inteligência' },
  { id: 'integracoes-op', title: 'Integrações Operacionais' },
];

const adminModules: RhModuleDef[] = [
  { slug: 'escalas-jornada', title: 'Escalas e Jornada', description: 'Planeje turnos, escalas fixas e jornadas por centro de custo.', category: 'admin', sectionId: 'jornada', icon: CalendarClock, iaEnabled: true },
  { slug: 'controle-ponto', title: 'Controle de Ponto', description: 'Registros de entrada, saída e intervalos com trilha de auditoria.', category: 'admin', sectionId: 'jornada', icon: Clock },
  { slug: 'banco-horas', title: 'Banco de Horas', description: 'Saldo de horas extras, compensações e fechamento mensal.', category: 'admin', sectionId: 'jornada', icon: Timer },
  { slug: 'gestao-folgas', title: 'Gestão de Folgas', description: 'Solicitações, aprovações e calendário de folgas da equipe.', category: 'admin', sectionId: 'jornada', icon: Calendar },
  { slug: 'controle-ferias', title: 'Controle de Férias', description: 'Períodos aquisitivos, programação e aprovação de férias.', category: 'admin', sectionId: 'jornada', icon: Plane },
  { slug: 'geolocalizacao-ponto', title: 'Geolocalização do Ponto', description: 'Batidas de ponto com validação por GPS e cerca eletrônica.', category: 'admin', sectionId: 'jornada', icon: MapPin, integrations: ['rastreamento'] },
  { slug: 'documentacao-colaboradores', title: 'Documentação dos Colaboradores', description: 'Centralize contratos, ASO, NR e documentos admissionais.', category: 'admin', sectionId: 'documentos', icon: FileText, integrations: ['logdock'] },
  { slug: 'upload-cnh-exames', title: 'Upload CNH e Exames', description: 'Envio de CNH, toxicológico e exames periódicos via LogDock.', category: 'admin', sectionId: 'documentos', icon: Upload, integrations: ['logdock'] },
  { slug: 'vencimento-documentos', title: 'Vencimento de Documentos', description: 'Alertas automáticos de vencimento e renovação documental.', category: 'admin', sectionId: 'documentos', icon: AlertTriangle, iaEnabled: true },
  { slug: 'assinatura-digital', title: 'Assinatura Digital', description: 'Termos, advertências e documentos com assinatura eletrônica.', category: 'admin', sectionId: 'documentos', icon: FileSignature },
  { slug: 'ocorrencias-advertencias', title: 'Ocorrências e Advertências', description: 'Registro disciplinar com histórico e anexos.', category: 'admin', sectionId: 'documentos', icon: Scale },
  { slug: 'controle-multas', title: 'Controle de Multas', description: 'Multas de trânsito vinculadas a colaboradores e descontos.', category: 'admin', sectionId: 'documentos', icon: ShieldAlert },
  { slug: 'contratacoes', title: 'Contratações', description: 'Pipeline de admissão, documentos e onboarding.', category: 'admin', sectionId: 'pessoas', icon: UserPlus },
  { slug: 'desligamentos', title: 'Desligamentos', description: 'Checklist de desligamento, entrega de EPI e rescisão.', category: 'admin', sectionId: 'pessoas', icon: UserMinus },
  { slug: 'historico-funcionario', title: 'Histórico do Funcionário', description: 'Linha do tempo completa de eventos do colaborador.', category: 'admin', sectionId: 'pessoas', icon: History },
  { slug: 'timeline-funcionario', title: 'Timeline do Funcionário', description: 'Visualização cronológica integrada ao perfil RH.', category: 'admin', sectionId: 'pessoas', icon: GitBranch, externalPath: '/rh/equipe' },
  { slug: 'aprovacao-atestados', title: 'Aprovação de Atestados', description: 'Fluxo de atestados médicos com anexos e SLA.', category: 'admin', sectionId: 'pessoas', icon: ClipboardCheck },
  { slug: 'aprovacao-ferias', title: 'Aprovação de Férias', description: 'Aprovação em lote e calendário consolidado.', category: 'admin', sectionId: 'pessoas', icon: UserCheck },
  { slug: 'controle-salarial', title: 'Controle Salarial', description: 'Faixas salariais, reajustes e histórico de remuneração.', category: 'admin', sectionId: 'pessoas', icon: Banknote, integrations: ['financeiro'] },
  { slug: 'beneficios', title: 'Benefícios', description: 'VT, VR, plano de saúde e benefícios flexíveis.', category: 'admin', sectionId: 'pessoas', icon: Wallet },
  { slug: 'performance-individual', title: 'Performance Individual', description: 'Avaliações, metas individuais e feedback contínuo.', category: 'admin', sectionId: 'performance', icon: TrendingUp, iaEnabled: true },
  { slug: 'metas-kpi', title: 'Metas e KPI', description: 'OKRs e indicadores por cargo e unidade.', category: 'admin', sectionId: 'performance', icon: Target },
  { slug: 'treinamentos', title: 'Treinamentos Internos', description: 'Trilhas, turmas e certificação de conclusão.', category: 'admin', sectionId: 'performance', icon: GraduationCap },
  { slug: 'certificados', title: 'Certificados', description: 'Emissão e controle de certificados internos.', category: 'admin', sectionId: 'performance', icon: Award },
  { slug: 'ia-performance', title: 'IA de Performance', description: 'Insights preditivos sobre desempenho e risco de turnover.', category: 'admin', sectionId: 'performance', icon: Sparkles, iaEnabled: true },
  { slug: 'comunicacao-interna', title: 'Comunicação Interna', description: 'Mural, avisos segmentados e confirmação de leitura.', category: 'admin', sectionId: 'comunicacao', icon: MessageSquare },
  { slug: 'avisos-comunicados', title: 'Avisos e Comunicados', description: 'Comunicados oficiais com prioridade e expiração.', category: 'admin', sectionId: 'comunicacao', icon: Bell },
  { slug: 'solicitacoes-internas', title: 'Solicitações Internas', description: 'Chamados RH: benefícios, documentos e dúvidas.', category: 'admin', sectionId: 'comunicacao', icon: ClipboardList },
  { slug: 'chat-interno-rh', title: 'Chat Interno RH', description: 'Canal direto entre colaborador e RH.', category: 'admin', sectionId: 'comunicacao', icon: MessageSquare },
  { slug: 'suporte-colaborador', title: 'Central de Suporte', description: 'FAQ, tickets e status de solicitações.', category: 'admin', sectionId: 'comunicacao', icon: Briefcase },
  { slug: 'central-alertas', title: 'Central de Alertas', description: 'Painel unificado de alertas administrativos.', category: 'admin', sectionId: 'governanca', icon: Bell, externalPath: '/rh/alertas' },
  { slug: 'dashboard-executivo', title: 'Dashboard Executivo', description: 'Visão consolidada de pessoas, folha e alertas críticos.', category: 'admin', sectionId: 'governanca', icon: Activity, externalPath: '/rh/dashboard' },
  { slug: 'relatorios-rh', title: 'Relatórios RH', description: 'Exportação PDF/Excel de indicadores de RH.', category: 'admin', sectionId: 'governanca', icon: FileCheck },
  { slug: 'logs-atividade', title: 'Logs de Atividade', description: 'Auditoria de ações no módulo RH.', category: 'admin', sectionId: 'governanca', icon: History },
  { slug: 'permissoes-cargos', title: 'Permissões e Cargos', description: 'Perfis de acesso e matriz de permissões.', category: 'admin', sectionId: 'governanca', icon: Shield },
  { slug: 'auditoria-rh', title: 'Auditoria RH', description: 'Trilhas de conformidade e relatórios para auditoria.', category: 'admin', sectionId: 'governanca', icon: BadgeCheck },
  { slug: 'integracao-frota', title: 'Integração com Frota', description: 'Sincronização de motoristas, veículos e manutenção.', category: 'admin', sectionId: 'governanca', icon: Truck, integrations: ['frota'], externalPath: '/frota' },
  { slug: 'integracao-financeira', title: 'Integração Financeira', description: 'Folha estimada, diárias e custos por colaborador.', category: 'admin', sectionId: 'governanca', icon: Link2, integrations: ['financeiro'], externalPath: '/financeiro' },
  { slug: 'ia-jornada-excessiva', title: 'IA de Jornada Excessiva', description: 'Detecção proativa de excesso de jornada e fadiga.', category: 'admin', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-alertas-operacionais', title: 'IA de Alertas Operacionais', description: 'Priorização inteligente de alertas críticos.', category: 'admin', sectionId: 'governanca', icon: Sparkles, iaEnabled: true },
];

const operationalModules: RhModuleDef[] = [
  { slug: 'gestao-motoristas', title: 'Gestão de Motoristas', description: 'Cadastro, status e documentação da frota humana.', category: 'operational', sectionId: 'equipe-op', icon: Truck, externalPath: '/rh/motoristas' },
  { slug: 'gestao-ajudantes', title: 'Gestão de Ajudantes', description: 'Ajudantes de entrega e conferentes de carga.', category: 'operational', sectionId: 'equipe-op', icon: Users },
  { slug: 'motoristas-disponiveis', title: 'Motoristas Disponíveis', description: 'Painel em tempo real de disponibilidade operacional.', category: 'operational', sectionId: 'equipe-op', icon: UserCheck, iaEnabled: true },
  { slug: 'status-rota', title: 'Status em Rota', description: 'Quem está em viagem, parado ou aguardando carga.', category: 'operational', sectionId: 'equipe-op', icon: Route, integrations: ['rastreamento', 'logistica'] },
  { slug: 'escalas-viagem', title: 'Escalas de Viagem', description: 'Programação de viagens e composição de equipe.', category: 'operational', sectionId: 'jornada-op', icon: CalendarClock },
  { slug: 'controle-jornada', title: 'Controle de Jornada', description: 'Jornada legal, direção e repouso na estrada.', category: 'operational', sectionId: 'jornada-op', icon: Gauge, iaEnabled: true },
  { slug: 'ponto-gps', title: 'Controle de Ponto por GPS', description: 'Batidas validadas por geolocalização em rota.', category: 'operational', sectionId: 'jornada-op', icon: MapPin, integrations: ['rastreamento'] },
  { slug: 'horas-estrada', title: 'Horas na Estrada', description: 'Consolidado de horas rodadas por viagem.', category: 'operational', sectionId: 'jornada-op', icon: Clock },
  { slug: 'descanso-obrigatorio', title: 'Descanso Obrigatório', description: 'Controle de intervalos e alertas de infração.', category: 'operational', sectionId: 'jornada-op', icon: Timer, iaEnabled: true },
  { slug: 'cnh-categorias', title: 'CNH e Categorias', description: 'Validação de categoria CNH vs tipo de veículo.', category: 'operational', sectionId: 'docs-op', icon: FileCheck, integrations: ['logdock'] },
  { slug: 'exames-toxicologicos', title: 'Exames Toxicológicos', description: 'Controle de exames e validade toxicológica.', category: 'operational', sectionId: 'docs-op', icon: Shield },
  { slug: 'treinamentos-seguranca', title: 'Treinamentos de Segurança', description: 'NR, MOPP e reciclagens obrigatórias.', category: 'operational', sectionId: 'docs-op', icon: HardHat },
  { slug: 'direcao-defensiva', title: 'Direção Defensiva', description: 'Certificações e histórico de treinamentos.', category: 'operational', sectionId: 'docs-op', icon: Car },
  { slug: 'uniformes-epi', title: 'Uniformes e EPIs', description: 'Entrega, devolução e controle de EPIs.', category: 'operational', sectionId: 'docs-op', icon: Briefcase },
  { slug: 'ocorrencias-rota', title: 'Ocorrências em Rota', description: 'Incidentes, atrasos e desvios registrados.', category: 'operational', sectionId: 'docs-op', icon: AlertTriangle },
  { slug: 'acidentes-sinistros', title: 'Acidentes e Sinistros', description: 'Registro integrado ao PGR e seguros.', category: 'operational', sectionId: 'docs-op', icon: ShieldAlert, externalPath: '/pgr/seguros' },
  { slug: 'ranking-motoristas', title: 'Ranking de Motoristas', description: 'Score operacional e ranking mensal.', category: 'operational', sectionId: 'performance-op', icon: Award, externalPath: '/rh/desempenho' },
  { slug: 'performance-entrega', title: 'Performance por Entrega', description: 'OTIF, atrasos e qualidade por motorista.', category: 'operational', sectionId: 'performance-op', icon: TrendingUp, iaEnabled: true },
  { slug: 'kpi-operacional', title: 'KPI Operacional', description: 'Indicadores de produtividade da operação.', category: 'operational', sectionId: 'performance-op', icon: Activity },
  { slug: 'controle-diarias', title: 'Controle de Diárias', description: 'Diárias de viagem e adiantamentos.', category: 'operational', sectionId: 'performance-op', icon: Wallet, integrations: ['financeiro'] },
  { slug: 'custos-motorista', title: 'Custos por Motorista', description: 'Custo total: salário, diárias, multas e combustível.', category: 'operational', sectionId: 'performance-op', icon: Banknote, integrations: ['financeiro'] },
  { slug: 'combustivel-condutor', title: 'Combustível por Condutor', description: 'Consumo e abastecimentos por motorista.', category: 'operational', sectionId: 'performance-op', icon: Fuel, integrations: ['frota'], externalPath: '/frota/combustivel' },
  { slug: 'motorista-veiculo', title: 'Motorista ↔ Caminhão', description: 'Associação ativa motorista e veículo.', category: 'operational', sectionId: 'performance-op', icon: Link2, integrations: ['frota'] },
  { slug: 'troca-veiculo', title: 'Troca de Veículo', description: 'Histórico de trocas e motivos operacionais.', category: 'operational', sectionId: 'performance-op', icon: RefreshCw, integrations: ['frota'] },
  { slug: 'manutencao-motorista', title: 'Manutenção x Motorista', description: 'Vínculo de ordens de serviço ao condutor.', category: 'operational', sectionId: 'performance-op', icon: Wrench, integrations: ['frota'], externalPath: '/frota/manutencao' },
  { slug: 'frota-vinculada', title: 'Frota Vinculada ao RH', description: 'Visão consolidada frota + equipe.', category: 'operational', sectionId: 'performance-op', icon: Bus, integrations: ['frota'] },
  { slug: 'avisos-viagem', title: 'Avisos de Viagem', description: 'Push operacional para motoristas em rota.', category: 'operational', sectionId: 'alertas-op', icon: Bell },
  { slug: 'alertas-jornada', title: 'Alertas de Jornada Excessiva', description: 'Notificações de risco de infração de jornada.', category: 'operational', sectionId: 'alertas-op', icon: AlertTriangle, iaEnabled: true },
  { slug: 'alertas-cnh', title: 'Alertas CNH Vencendo', description: 'Renovação de CNH com antecedência configurável.', category: 'operational', sectionId: 'alertas-op', icon: FileCheck, iaEnabled: true },
  { slug: 'alertas-exames', title: 'Alertas Exames Pendentes', description: 'Exames vencidos ou próximos do vencimento.', category: 'operational', sectionId: 'alertas-op', icon: ClipboardCheck },
  { slug: 'ia-performance-operacional', title: 'IA Performance Operacional', description: 'Insights de produtividade e comportamento.', category: 'operational', sectionId: 'alertas-op', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-risco-atraso', title: 'IA de Risco de Atraso', description: 'Predição de atraso com base em jornada e rota.', category: 'operational', sectionId: 'alertas-op', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-comportamento-motorista', title: 'IA Comportamento Motorista', description: 'Padrões de condução e eventos de telemetria.', category: 'operational', sectionId: 'alertas-op', icon: Sparkles, iaEnabled: true },
  { slug: 'ia-excesso-jornada', title: 'IA Excesso de Jornada', description: 'Alertas preditivos antes da infração.', category: 'operational', sectionId: 'alertas-op', icon: Sparkles, iaEnabled: true },
  { slug: 'dashboard-operacional', title: 'Dashboard Operacional RH', description: 'Visão executiva da operação de pessoas.', category: 'operational', sectionId: 'integracoes-op', icon: Activity, externalPath: '/rh/dashboard' },
  { slug: 'relatorios-equipe', title: 'Relatórios de Equipe', description: 'Exportação operacional PDF/Excel.', category: 'operational', sectionId: 'integracoes-op', icon: FileText },
  { slug: 'relatorios-entrega', title: 'Relatórios de Entrega', description: 'Performance logística por motorista.', category: 'operational', sectionId: 'integracoes-op', icon: Route, integrations: ['logistica'] },
  { slug: 'controle-turnos', title: 'Controle de Turnos', description: 'Turnos por filial e centro de distribuição.', category: 'operational', sectionId: 'integracoes-op', icon: Calendar },
  { slug: 'gestao-filiais', title: 'Gestão de Filiais', description: 'Headcount e escalas por unidade.', category: 'operational', sectionId: 'integracoes-op', icon: Building2 },
  { slug: 'integracao-rastreamento', title: 'Integração Rastreamento', description: 'Status GPS e eventos de telemetria.', category: 'operational', sectionId: 'integracoes-op', icon: Radio, integrations: ['rastreamento'], externalPath: '/mapa-ao-vivo' },
  { slug: 'integracao-logistica', title: 'Integração Logística', description: 'Viagens, CT-e e entregas vinculadas.', category: 'operational', sectionId: 'integracoes-op', icon: Truck, integrations: ['logistica'], externalPath: '/logistica' },
  { slug: 'auditoria-operacional', title: 'Auditoria Operacional', description: 'Logs e conformidade da operação.', category: 'operational', sectionId: 'integracoes-op', icon: BadgeCheck },
];

export const RH_MODULES: RhModuleDef[] = [...adminModules, ...operationalModules];

export function getRhModule(slug: string, category: RhModuleCategory): RhModuleDef | undefined {
  return RH_MODULES.find((m) => m.slug === slug && m.category === category);
}

export function getRhModulesByCategory(category: RhModuleCategory): RhModuleDef[] {
  return RH_MODULES.filter((m) => m.category === category);
}

export function getRhSections(category: RhModuleCategory): RhModuleSection[] {
  return category === 'admin' ? RH_ADMIN_SECTIONS : RH_OPERATIONAL_SECTIONS;
}

export type RhAdminHubId = 'administrativo' | 'jornada-ponto' | 'documentos-compliance';

export const RH_ADMIN_HUB_CONFIG: Record<
  RhAdminHubId,
  { path: string; label: string; sectionIds?: string[]; excludeSectionIds?: string[] }
> = {
  administrativo: {
    path: '/rh/administrativo',
    label: 'RH Administrativo',
    excludeSectionIds: ['jornada', 'documentos'],
  },
  'jornada-ponto': {
    path: '/rh/jornada-ponto',
    label: 'Jornada & Ponto',
    sectionIds: ['jornada'],
  },
  'documentos-compliance': {
    path: '/rh/documentos-compliance',
    label: 'Documentos & Compliance',
    sectionIds: ['documentos'],
  },
};

export function getRhAdminHubForModule(module: RhModuleDef): RhAdminHubId {
  if (module.sectionId === 'jornada') return 'jornada-ponto';
  if (module.sectionId === 'documentos') return 'documentos-compliance';
  return 'administrativo';
}

export function getRhAdminHubConfig(hubId: RhAdminHubId) {
  return RH_ADMIN_HUB_CONFIG[hubId];
}

/** Seções do hub RH Administrativo (atalhos + dashboards dedicados). */
export type RhAdministrativoSectionId = 'pessoas' | 'performance' | 'comunicacao' | 'governanca';

export const RH_ADMINISTRATIVO_SECTION_NAV: RhAdministrativoSectionId[] = [
  'pessoas',
  'performance',
  'comunicacao',
  'governanca',
];

export function isRhAdministrativoSectionId(slug: string): slug is RhAdministrativoSectionId {
  return (RH_ADMINISTRATIVO_SECTION_NAV as string[]).includes(slug);
}

export function getRhSectionById(sectionId: string, category: RhModuleCategory = 'admin') {
  return getRhSections(category).find((s) => s.id === sectionId);
}
