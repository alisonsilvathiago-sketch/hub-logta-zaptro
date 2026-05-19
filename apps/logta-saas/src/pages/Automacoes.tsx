import React, { useState } from 'react';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { useHubEntitlements } from '../contexts/HubEntitlementsContext';
import { getHubMasterUrl } from '@/lib/hub';
import { 
  Cpu, 
  Zap, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Settings, 
  MessageSquare, 
  DollarSign, 
  FileText, 
  Truck, 
  Brain, 
  History, 
  Sliders, 
  ChevronRight, 
  Mail, 
  Bell, 
  Layers, 
  GitCommit, 
  GitFork, 
  CornerDownRight,
  ShieldAlert,
  Activity,
  UserCheck,
  MapPin
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'frete' | 'financeiro' | 'fiscal' | 'notificacao' | 'ia';
  active: boolean;
  executions: number;
  successRate: number;
  trigger: string;
  action: string;
}

interface LogEntry {
  id: string;
  time: string;
  workflowName: string;
  triggerEvent: string;
  result: 'sucesso' | 'erro' | 'processando';
  details: string;
}

const Automacoes = () => {
  const { entitlements } = useHubEntitlements();
  const [activeTab, setActiveTab] = useState<'workflows' | 'editor' | 'logs' | 'regras'>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  if (entitlements && !entitlements.features.automationPremium) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <ShieldAlert className="h-14 w-14 text-amber-500" />
        <h1 className="logta-page-title">Automações premium bloqueadas</h1>
        <p className="max-w-md text-sm font-medium text-gray-600">
          Seu plano atual não inclui automações avançadas. O Hub Master ativa este módulo automaticamente após
          upgrade de assinatura.
        </p>
        <a
          href={`${getHubMasterUrl()}/billing`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-gray-950 px-6 py-3 text-sm font-black text-white shadow-lg"
        >
          Ver planos no Hub
        </a>
      </div>
    );
  }

  // Workflows predefinidos
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: 'wf-1',
      name: 'Emissão Instantânea de CT-e',
      description: 'Assim que um frete é criado, envia as informações e emite o CT-e automaticamente na SEFAZ.',
      category: 'fiscal',
      active: true,
      executions: 1240,
      successRate: 99.8,
      trigger: 'Frete Criado',
      action: 'Emitir CT-e SEFAZ'
    },
    {
      id: 'wf-2',
      name: 'Roteirização Inteligente por IA',
      description: 'Analisa o trânsito, histórico de pedágios e rotas para atribuir o melhor caminho ao motorista.',
      category: 'ia',
      active: true,
      executions: 842,
      successRate: 98.4,
      trigger: 'Rota Definida',
      action: 'Calcular Rota Inteligente'
    },
    {
      id: 'wf-3',
      name: 'Faturamento Automático pós-Entrega',
      description: 'Gera a fatura de cobrança automaticamente no momento em que o motorista confirma a entrega.',
      category: 'financeiro',
      active: true,
      executions: 512,
      successRate: 100,
      trigger: 'Frete Entregue',
      action: 'Gerar Fatura Financeira'
    },
    {
      id: 'wf-4',
      name: 'Notificação de Rastreamento (WhatsApp)',
      description: 'Envia mensagens automáticas ao cliente a cada mudança de status do frete.',
      category: 'notificacao',
      active: true,
      executions: 3102,
      successRate: 99.1,
      trigger: 'Alteração de Status',
      action: 'Enviar WhatsApp Cliente'
    },
    {
      id: 'wf-5',
      name: 'Alerta de Atraso Crítico',
      description: 'Detecta veículos parados há mais de 1 hora fora do ponto de parada e avisa o operador.',
      category: 'frete',
      active: false,
      executions: 45,
      successRate: 95.6,
      trigger: 'Veículo Parado',
      action: 'Enviar Alerta Operador'
    }
  ]);

  // Histórico de Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'log-101', time: '10:42:15', workflowName: 'Emissão Instantânea de CT-e', triggerEvent: 'Frete #FR-8890 criado', result: 'sucesso', details: 'CT-e 12401 autorizado com sucesso pela SEFAZ.' },
    { id: 'log-102', time: '10:42:18', workflowName: 'Notificação de Rastreamento (WhatsApp)', triggerEvent: 'Alteração de status #FR-8890', result: 'sucesso', details: 'WhatsApp enviado para o número (11) 99999-9999.' },
    { id: 'log-103', time: '10:20:01', workflowName: 'Roteirização Inteligente por IA', triggerEvent: 'Rota definida #FR-8891', result: 'sucesso', details: 'Rota otimizada com economia estimada de 14% de combustível.' },
    { id: 'log-104', time: '09:55:30', workflowName: 'Faturamento Automático pós-Entrega', triggerEvent: 'Frete #FR-8889 entregue', result: 'sucesso', details: 'Fatura de R$ 4.500,00 gerada e enviada por e-mail.' },
    { id: 'log-105', time: '09:15:12', workflowName: 'Emissão Instantânea de CT-e', triggerEvent: 'Frete #FR-8892 criado', result: 'erro', details: 'Rejeição 225: Falha no Esquema XML. Corrigido e reenviado.' },
    { id: 'log-106', time: '08:30:00', workflowName: 'Alerta de Atraso Crítico', triggerEvent: 'Veículo parado #BRA-2L22', result: 'sucesso', details: 'Alerta enviado ao operador e motorista notificado via app.' }
  ]);

  // Estados do Editor Visual Interativo (Zapier style)
  const [editorTrigger, setEditorTrigger] = useState('Frete Criado');
  const [editorCondition, setEditorCondition] = useState('Valor maior que R$ 5.000');
  const [editorAction, setEditorAction] = useState('Gerar CT-e Automaticamente');
  const [editorNotification, setEditorNotification] = useState('Enviar WhatsApp ao Cliente');

  // Regras Gerais
  const [antiRecursaoLimit, setAntiRecursaoLimit] = useState(10);
  const [horarioInicio, setHorarioInicio] = useState('00:00');
  const [horarioFim, setHorarioFim] = useState('23:59');
  const [alertarFalhas, setAlertarFalhas] = useState(true);

  const toggleWorkflow = (id: string) => {
    setWorkflows(workflows.map(wf => wf.id === id ? { ...wf, active: !wf.active } : wf));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'frete': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'financeiro': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'fiscal': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'notificacao': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'ia': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          wf.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || wf.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="logta-page h-full w-full space-y-8 animate-in fade-in duration-500 overflow-y-auto text-left scrollbar-hide">
      
      <LogtaModuleHeader
        title={
          <h1 className="logta-page-title flex items-center gap-3">
            <Cpu size={28} className="text-primary animate-pulse shrink-0" />
            Automações & Regras
          </h1>
        }
        subtitle="Crie fluxos de trabalho inteligentes, conecte módulos do sistema e elimine tarefas manuais."
        tabs={
          <LogtaWaveTabStrip
            variant="button"
            tabs={[
              { id: 'workflows', label: 'Painel de Fluxos', shortLabel: 'Fluxos', icon: Layers },
              { id: 'editor', label: 'Criador Visual', shortLabel: 'Criador', icon: GitFork },
              { id: 'logs', label: 'Histórico de Logs', shortLabel: 'Logs', icon: History },
              { id: 'regras', label: 'Regras Gerais', shortLabel: 'Regras', icon: Sliders },
            ]}
            activeId={activeTab}
            onTabChange={(id) => setActiveTab(id as typeof activeTab)}
          />
        }
        tabQuickAddLabel="Novo fluxo"
        onTabQuickAdd={() => setActiveTab('editor')}
      />

      {/* Main Workspace */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* TAB 1: WORKFLOWS LIST */}
        {activeTab === 'workflows' && (
          <div className="space-y-8">
            
            {/* Top Cards (Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Fluxos Ativos', value: workflows.filter(w => w.active).length, total: workflows.length, color: 'text-primary', desc: 'Ativos rodando agora' },
                { label: 'Total Execuções (Mês)', value: '5,741', total: null, color: 'text-emerald-500', desc: 'Tarefas manuais poupadas' },
                { label: 'Taxa de Sucesso', value: '99.2%', total: null, color: 'text-blue-500', desc: 'Sem intervenção operacional' },
                { label: 'Economia Estimada', value: 'R$ 14.8k', total: null, color: 'text-indigo-500', desc: 'Tempo e custos reduzidos' },
              ].map((m, i) => (
                <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{m.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`logta-dashboard-stat-card__value ${m.color}`}>{m.value}</p>
                    {m.total && <span className="text-xs font-bold text-gray-400">/ {m.total}</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-normal mt-2">{m.desc}</p>
                </div>
              ))}
            </div>

            {/* Core Autopilot Highlight */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white rounded-[40px] p-8 relative overflow-hidden shadow-xl border border-indigo-900/30">
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-normal text-indigo-300">Logta AI Autopilot</span>
                <h2 className="text-2xl font-black tracking-tight">O seu ERP rodando no piloto automático.</h2>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Ao unificar o motor de automação com a nossa inteligência artificial, o sistema gera rotas inteligentes, recalcula fretes, emite documentos fiscais automáticos e gerencia sua equipe sem necessidade de cliques manuais.
                </p>
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setActiveTab('editor')} className="px-6 py-3.5 bg-white text-indigo-950 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer">
                    <Zap size={14} fill="currentColor" /> Configurar Novo Piloto
                  </button>
                </div>
              </div>
              <Brain size={180} className="absolute -right-8 -bottom-10 opacity-10 text-white transform rotate-12" />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar fluxos de automação..." 
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                <Filter size={18} className="text-gray-400" />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
                >
                  <option value="todos">Todas Categorias</option>
                  <option value="frete">Operação de Frete</option>
                  <option value="financeiro">Financeiras</option>
                  <option value="fiscal">Fiscais</option>
                  <option value="notificacao">Notificações</option>
                  <option value="ia">Inteligência Artificial (IA)</option>
                </select>
              </div>
            </div>

            {/* Workflows Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkflows.map((wf) => (
                <div key={wf.id} className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                  <div>
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal border ${getCategoryColor(wf.category)}`}>
                        {wf.category === 'ia' ? '⚡ ' : ''}{wf.category.toUpperCase()}
                      </span>
                      <button 
                        onClick={() => toggleWorkflow(wf.id)}
                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 cursor-pointer
                          ${wf.active ? 'bg-primary' : 'bg-gray-200'}`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform
                          ${wf.active ? 'translate-x-6' : 'translate-x-0'}`} 
                        />
                      </button>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-primary transition-colors mb-2">{wf.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium mb-6">{wf.description}</p>
                  </div>

                  {/* Flow Overview (Trigger -> Action) */}
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-normal mb-1">Gatilho (Trigger)</p>
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><Play size={12} className="text-emerald-500" /> {wf.trigger}</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-300" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-normal mb-1">Ação (Action)</p>
                      <span className="text-xs font-bold text-primary flex items-center gap-1"><Cpu size={12} /> {wf.action}</span>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-50 text-[10px] font-bold text-gray-400">
                    <span>{wf.executions.toLocaleString()} execuções</span>
                    <span className="text-emerald-500 font-black">{wf.successRate}% de sucesso</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL EDITOR (ZAPIER STYLE) */}
        {activeTab === 'editor' && (
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Criador de Fluxos (Workflows)</h2>
                <p className="text-xs text-gray-400 mt-1">Conecte blocos lógicos estruturando gatilhos, condições e ações automáticas.</p>
              </div>
              <button 
                onClick={() => {
                  alert('Fluxo salvo com sucesso e adicionado ao painel!');
                  setActiveTab('workflows');
                }}
                className="px-6 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Salvar Fluxo
              </button>
            </div>

            {/* Visual Editor Canvas */}
            <div className="relative bg-gray-50 rounded-[40px] p-12 border-2 border-dashed border-gray-200 flex flex-col items-center gap-8 min-h-[600px] justify-center overflow-hidden">
              
              {/* BLOCK 1: TRIGGER */}
              <div className="relative z-10 w-full max-w-md bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all text-left">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black">1</div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Play size={24} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-normal">GATILHO (TRIGGER)</span>
                    <h3 className="text-sm font-bold text-gray-900">Se este evento ocorrer:</h3>
                    <select 
                      value={editorTrigger}
                      onChange={(e) => setEditorTrigger(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                    >
                      <option value="Frete Criado">Frete Criado no Sistema</option>
                      <option value="Frete Atrasado">Frete Ficar Atrasado</option>
                      <option value="CT-e Rejeitado">CT-e for Rejeitado SEFAZ</option>
                      <option value="Pagamento Recebido">Pagamento Recebido</option>
                      <option value="Veículo Parado">Veículo Ficar Parado &gt; 1h</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ARROW DOWN */}
              <div className="w-1 bg-emerald-500 h-8 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-8 border-t-emerald-500 border-x-8 border-x-transparent" />
              </div>

              {/* BLOCK 2: CONDITION (IF) */}
              <div className="relative z-10 w-full max-w-md bg-white border-2 border-amber-500 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all text-left">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-black">2</div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <GitFork size={24} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-normal">CONDIÇÃO (IF CONDITION)</span>
                    <h3 className="text-sm font-bold text-gray-900">Verificar condição lúdica:</h3>
                    <select 
                      value={editorCondition}
                      onChange={(e) => setEditorCondition(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                    >
                      <option value="Valor maior que R$ 5.000">Valor do frete maior que R$ 5.000,00</option>
                      <option value="Cliente Premium">Cliente pertence à categoria 'Premium'</option>
                      <option value="Rota para fora do estado">Rota ultrapassa divisas do Estado (Interestadual)</option>
                      <option value="Sem motorista atribuído">Ainda sem motorista vinculado no sistema</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ARROW DOWN */}
              <div className="w-1 bg-amber-500 h-8 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-8 border-t-amber-500 border-x-8 border-x-transparent" />
              </div>

              {/* BLOCK 3: ACTION (THEN) */}
              <div className="relative z-10 w-full max-w-md bg-white border-2 border-blue-500 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all text-left">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-black">3</div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Cpu size={24} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-normal">AÇÃO AUTOMÁTICA (THEN DO)</span>
                    <h3 className="text-sm font-bold text-gray-900">Execute esta tarefa do sistema:</h3>
                    <select 
                      value={editorAction}
                      onChange={(e) => setEditorAction(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                    >
                      <option value="Gerar CT-e Automatically">Gerar e Emitir CT-e na SEFAZ</option>
                      <option value="Roteirização IA">Calcular Melhor Rota por Inteligência Artificial</option>
                      <option value="Atribuir Motorista">Atribuir Motorista Inteligente mais próximo</option>
                      <option value="Criar Cobrança">Criar Fatura de Cobrança no Contas a Receber</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ARROW DOWN */}
              <div className="w-1 bg-blue-500 h-8 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-8 border-t-blue-500 border-x-8 border-x-transparent" />
              </div>

              {/* BLOCK 4: ADDITIONAL NOTIFICATION */}
              <div className="relative z-10 w-full max-w-md bg-white border-2 border-purple-500 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all text-left">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-black">4</div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-normal">NOTIFICAÇÃO DE CANAL (NOTIFY)</span>
                    <h3 className="text-sm font-bold text-gray-900">Enviar aviso imediato:</h3>
                    <select 
                      value={editorNotification}
                      onChange={(e) => setEditorNotification(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                    >
                      <option value="Enviar WhatsApp ao Cliente">Enviar mensagem Whatsapp ao Cliente</option>
                      <option value="Enviar E-mail Operacional">Enviar E-mail com PDF/XML</option>
                      <option value="Notificar Motorista App">Notificar Motorista no Aplicativo Celular</option>
                      <option value="Enviar Push ao Operador">Disparar Alerta Sonoro no Painel Central</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BG Grid Elements (Visual effect) */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            </div>
          </div>
        )}

        {/* TAB 3: LOGS HISTORY */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Logs de Automação</h2>
                <p className="text-xs text-gray-400 mt-1">Registro em tempo real de todas as ações que o motor inteligente realizou de forma autônoma.</p>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl hover:text-red-500 hover:border-red-100 transition-all text-xs font-bold"
              >
                Limpar Logs
              </button>
            </div>

            {/* Logs Table */}
            <div className="border border-gray-200 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Hora / Código</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Automação Executada</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Evento Disparador</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Resultado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Detalhes do Processo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-400 group-hover:text-primary transition-colors">{log.time}</span>
                        <p className="text-[9px] font-black text-gray-300 mt-0.5">{log.id.toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{log.workflowName}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-lg text-[10px] font-bold">{log.triggerEvent}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-normal flex items-center gap-1.5 w-fit
                          ${log.result === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.result === 'sucesso' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {log.result}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-600 max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Log Detail Modal (Charcoal Black) */}
            {selectedLog && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white text-left">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Detalhes da Execução</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedLog.id.toUpperCase()} • {selectedLog.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedLog(null)} 
                      className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors text-white cursor-pointer"
                    >
                      <span className="text-sm font-bold">✕</span>
                    </button>
                  </div>

                  <div className="space-y-5 text-sm font-semibold">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Automação Executada</span>
                      <p className="text-white font-bold text-base">{selectedLog.workflowName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Evento Disparador</span>
                        <p className="text-primary font-bold text-xs">{selectedLog.triggerEvent}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-normal flex items-center gap-1.5 w-fit mt-1
                          ${selectedLog.result === 'sucesso' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 'bg-red-950/40 text-red-400 border border-red-900/30'}`}>
                          {selectedLog.result === 'sucesso' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {selectedLog.result.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-neutral-850">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Logs Detalhados do Processo</span>
                      <p className="text-gray-300 leading-relaxed bg-neutral-900/50 p-4 rounded-2xl border border-neutral-850 mt-1 font-mono text-xs whitespace-pre-wrap">
                        {selectedLog.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button 
                      onClick={() => setSelectedLog(null)}
                      className="px-6 py-3 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GENERAL RULES & CONFIGS */}
        {activeTab === 'regras' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Regras Gerais do Sistema</h2>
                <p className="text-xs text-gray-400 mt-1">Configure as políticas e diretrizes operacionais de todo o motor de automação.</p>
              </div>

              <div className="space-y-6">
                {/* Rule Item: Operational Hours */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">Janela de Horário de Operação</h3>
                    <p className="text-[11px] text-gray-400">Restrinja o processamento de fluxos e envio de notificações para evitar horários indesejados.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={horarioInicio}
                      onChange={(e) => setHorarioInicio(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none" 
                    />
                    <span className="text-gray-400 font-bold">até</span>
                    <input 
                      type="time" 
                      value={horarioFim}
                      onChange={(e) => setHorarioFim(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none" 
                    />
                  </div>
                </div>

                {/* Rule Item: Anti-Recursion Loop Limit */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">Prevenção contra Loops de Automação</h3>
                    <p className="text-[11px] text-gray-400">Número máximo de execuções recursivas em um único ciclo para evitar problemas em cadeia.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={antiRecursaoLimit}
                      onChange={(e) => setAntiRecursaoLimit(Number(e.target.value))}
                      className="w-20 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none text-center" 
                    />
                    <span className="text-xs text-gray-400 font-bold">vezes</span>
                  </div>
                </div>

                {/* Rule Item: Alert Operational Failures */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">Notificar Operadores em Caso de Falha</h3>
                    <p className="text-[11px] text-gray-400">Ativa um sinalizador visual e envia e-mail urgente caso alguma automação retorne erro.</p>
                  </div>
                  <button 
                    onClick={() => setAlertarFalhas(!alertarFalhas)}
                    className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 cursor-pointer
                      ${alertarFalhas ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform
                      ${alertarFalhas ? 'translate-x-6' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="logta-card-heading">Segurança no Piloto Automático</h3>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Para garantir total conformidade com a SEFAZ e evitar cobranças duplicadas, todas as automações fiscais e financeiras possuem um "Modo de Teste" ativado por padrão.
                </p>
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Recomendações:</p>
                  <div className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Sempre valide novas automações de CT-e no modo homologação primeiro.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Ajuste o limite de loop recursivo de acordo com a quantidade diária de faturamento.</span>
                  </div>
                </div>
              </div>
              <Cpu size={150} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default Automacoes;
