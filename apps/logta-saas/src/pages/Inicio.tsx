import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  ArrowUp,
  Plus,
  LayoutDashboard,
  Users,
  DollarSign,
  Sparkles,
  Package,
  Truck,
  MapPin,
  Cpu,
  FileText,
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useHubEntitlements } from '../contexts/HubEntitlementsContext';
import { useLogtaModuleActivation } from '../contexts/LogtaModuleActivationContext';
import { loadOnboardingProfile, MODULE_ROUTE, trialDaysRemaining } from '../lib/onboardingStorage';
import { supabase } from '../lib/supabase';

const CHALLENGE_SHORT_LABEL: Record<string, string> = {
  organizacao: 'Organização',
  financeiro: 'Financeiro',
  entregas: 'Entregas',
  automacao: 'Automação',
  clientes: 'Clientes',
  operacao: 'Operação',
};

const Inicio = () => {
  const { config } = useTenant();
  const { entitlements, consumeAiCredits, trialBannerMessage: hubTrialMsg } = useHubEntitlements();
  const { hasModule, activation, mainChallenge } = useLogtaModuleActivation();
  const onboarding = useMemo(() => loadOnboardingProfile(), []);
  const trialLeft = trialDaysRemaining();
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ query: string; answer: string } | null>(null);

  const displayName =
    config?.companyName === 'LOGTA' || !config?.companyName ? 'Logta' : config.companyName;

  const iaSuggestions = useMemo(() => {
    const queries = activation.challengePlan?.iaStarterQueries ?? [];
    const iconMap: Record<
      string,
      React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
    > = {
      layout: LayoutDashboard,
      dollar: DollarSign,
      users: Users,
      truck: Truck,
      package: Package,
      map: MapPin,
      file: FileText,
      cpu: Cpu,
    };
    const colors = ['text-purple-500', 'text-blue-500', 'text-green-500', 'text-amber-500', 'text-cyan-400'];
    return queries.map((s, i) => ({
      Icon: iconMap[s.icon] ?? LayoutDashboard,
      label: s.label,
      query: s.query,
      color: colors[i % colors.length],
    }));
  }, [activation.challengePlan?.iaStarterQueries]);

  const moduleQuickLinks = useMemo(() => {
    if (!onboarding?.modules?.length) return [];
    const labels: Record<string, string> = {
      financeiro: 'Financeiro',
      crm: 'CRM',
      operacoes: 'Operação',
      frota: 'Frota',
      rastreamento: 'Rastreamento',
      oficina: 'Oficina',
      hubchat: 'HubChat',
      ia: 'IA & Automação',
      logdock: 'LogDrive',
      relatorios: 'Relatórios',
    };
    return onboarding.modules.map((id) => ({
      id,
      to: MODULE_ROUTE[id],
      label: labels[id] ?? id,
    }));
  }, [onboarding]);

  const simulateAIResponse = useCallback(
    async (query: string) => {
      if (!entitlements?.ai.enabled) {
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              type: 'warning',
              title: 'IA indisponível',
              message: 'Sua conta não tem IA ativa. O Hub Master controla créditos e planos.',
            },
          }),
        );
        return;
      }
      if (!consumeAiCredits(1)) {
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              type: 'error',
              title: 'Créditos insuficientes',
              message: 'Recarregue créditos ou faça upgrade no Hub Master.',
            },
          }),
        );
        return;
      }
      setIsThinking(true);
      setAiResponse(null);

      try {
        // 1. Fetch real-time context data — filtered by company_id for multi-tenant isolation
        const companyId = config?.id;
        if (!companyId) throw new Error('company_id not loaded');

        const [{ data: v }, { data: t }, { count: totalMot }, { count: totalColab }, { data: f }] = await Promise.all([
          supabase.from('vehicles').select('status').eq('company_id', companyId),
          supabase.from('transactions').select('type, amount').eq('company_id', companyId),
          supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('shipments').select('status').eq('company_id', companyId)
        ]);

        const totalVeiculos = v?.length || 0;
        const veiculosEmRota = v?.filter((x) => x.status === 'em_rota').length || 0;
        const veiculosManutencao = v?.filter((x) => x.status === 'manutencao').length || 0;

        const entradas = t?.filter(x => x.type === 'receita' || x.type === 'entrada').reduce((acc, x) => acc + Number(x.amount), 0) || 0;
        const saidas = t?.filter(x => x.type === 'despesa' || x.type === 'saida').reduce((acc, x) => acc + Number(x.amount), 0) || 0;
        const saldo = entradas - saidas;

        const totalMotoristas = totalMot || 0;
        const totalColaboradores = totalColab || 0;

        const totalFretes = f?.length || 0;
        const fretesEntregues = f?.filter((x: any) => x.status === 'delivered' || x.status === 'Entregue').length || 0;
        const fretesTransito = f?.filter((x: any) => x.status === 'in_transit' || x.status === 'Em Trânsito').length || 0;

        const systemPrompt = `Você é o Assistente de IA Logta Inteligência Logística. Seu modelo base é o Ollama Llama 3.
Abaixo estão dados operacionais reais e consolidados do sistema da transportadora:
- Frota: ${totalVeiculos} veículos cadastrados (${veiculosEmRota} em trânsito/em rota, ${veiculosManutencao} em manutenção).
- Financeiro: Entradas de R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Saídas de R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Saldo consolidado: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
- Equipe: ${totalColaboradores} colaboradores registrados, incluindo ${totalMotoristas} motoristas ativos.
- Operações/TMS: ${totalFretes} fretes totais (${fretesEntregues} entregues com sucesso, ${fretesTransito} em trânsito).

Responda à pergunta do usuário com base nos dados operacionais acima de forma extremamente profissional, objetiva, prestativa e refinada, no idioma Português (Brasil).`;

        let answer = '';

        // 2. Query Ollama Llama 3 via local server
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
          const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
              ],
              stream: false
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (ollamaResponse.ok) {
            const resData = await ollamaResponse.json();
            answer = resData?.message?.content || resData?.response || '';
          }
        } catch (ollamaErr) {
          console.warn('Ollama Llama 3 local indisponível ou CORS ativado. Usando inteligência analítica local Logta:', ollamaErr);
        }

        // 3. Resilient fallback if Ollama is not active
        if (!answer) {
          const q = query.toLowerCase();
          if (q.includes('frota') || q.includes('veículo') || q.includes('carro') || q.includes('caminhão')) {
            answer = `Sua frota atual possui ${totalVeiculos} veículos cadastrados. Destes, ${veiculosEmRota} estão em rota ativa no momento e ${veiculosManutencao} estão em manutenção. A saúde geral da frota está operacional.`;
          } else if (q.includes('financeiro') || q.includes('contas') || q.includes('faturamento') || q.includes('saldo') || q.includes('caixa')) {
            answer = `Analisando seu financeiro: as entradas totais somam R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e as saídas registradas são de R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O saldo atual consolidado é de R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
          } else if (q.includes('motorista') || q.includes('equipe') || q.includes('colaborador') || q.includes('funcionário')) {
            answer = `Você conta com uma equipe de ${totalColaboradores} colaboradores cadastrados, incluindo ${totalMotoristas} motoristas profissionais. A gestão de RH está sincronizada.`;
          } else if (q.includes('entrega') || q.includes('frete') || q.includes('operação') || q.includes('viagem')) {
            answer = `Na sua operação, existem ${totalFretes} fretes registrados. ${fretesEntregues} já foram finalizados com sucesso e ${fretesTransito} estão em trânsito agora.`;
          } else {
            answer = `Olá! Sou a IA da Logta (Llama 3). Identifiquei que você está perguntando sobre "${query}". Posso analisar dados de Frota, Financeiro, Equipe e Operações em tempo real para te dar um diagnóstico preciso. Como deseja prosseguir?`;
          }
        }

        setAiResponse({ query, answer });
      } catch (error) {
        console.error('Erro na IA:', error);
        setAiResponse({ query, answer: 'Desculpe, tive um problema ao acessar os dados em tempo real. Por favor, tente novamente em instantes.' });
      } finally {
        setIsThinking(false);
      }
    },
    [consumeAiCredits, entitlements?.ai.enabled],
  );

  const handleSend = () => {
    const q = inputValue.trim();
    if (!q || isThinking) return;
    simulateAIResponse(q);
    setInputValue('');
  };

  const heroGradient =
    'linear-gradient(180deg, rgb(0,0,0) 0%, rgb(0,0,0) 24%, rgb(10,31,74) 40%, rgb(29,78,216) 62%, rgb(59,130,246) 70%, rgb(147,197,253) 82%, rgb(249,250,251) 95%)';

  return (
    <div
      className="scrollbar-hide flex min-h-full w-full min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6 animate-in fade-in duration-1000 bg-neutral-950 sm:px-6 sm:py-8"
      style={{ backgroundImage: heroGradient }}
    >
      <div className="w-full max-w-3xl space-y-10 pb-20">
        {hubTrialMsg ? (
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-center text-xs font-bold text-white shadow-lg backdrop-blur-md sm:text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <span>{hubTrialMsg}</span>
          </div>
        ) : trialLeft !== null && trialLeft > 0 ? (
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-center text-xs font-bold text-white shadow-lg backdrop-blur-md sm:text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              Teste grátis: <strong className="text-white">{trialLeft}</strong>{' '}
              {trialLeft === 1 ? 'dia restante' : 'dias restantes'} · Ambiente personalizado para{' '}
              <strong className="text-white">{onboarding?.companyName ?? displayName}</strong>
            </span>
          </div>
        ) : null}
        {entitlements ? (
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[11px] font-semibold text-gray-300 backdrop-blur-md">
            {hasModule('ia') ? (
              <>
                <span>
                  Créditos IA: <strong className="text-white">{entitlements.ai.creditsBalance}</strong>
                </span>
                <span className="text-gray-600">·</span>
                <span>
                  Uso no mês: {entitlements.ai.creditsUsedThisMonth} / {entitlements.ai.creditsMonthlyAllowance}
                </span>
                {hasModule('logdock') ? <span className="text-gray-600">·</span> : null}
              </>
            ) : null}
            {hasModule('logdock') ? (
              <span>
                LogDrive:{' '}
                {Math.round(entitlements.logdock.usedBytes / (1024 * 1024))} /{' '}
                {Math.round(entitlements.logdock.limitBytes / (1024 * 1024))} MB
              </span>
            ) : null}
            {!hasModule('ia') && !hasModule('logdock') ? (
              <span className="text-gray-400">Plano e limites no Hub Master</span>
            ) : null}
          </div>
        ) : null}
        {!aiResponse && !isThinking && hasModule('ia') && (
          <div className="text-center space-y-3 animate-in slide-in-from-top-4 duration-700">
            <div className="inline-flex flex-col items-center gap-2 text-[11px] font-bold text-gray-500 sm:flex-row">
              <span className="inline-flex items-center gap-2">
                <span className="px-[22px] py-[6px] bg-blue-600 text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm">
                  LOGTA IA
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-bold">Assistente inteligente</span>
              </span>
              {mainChallenge ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-gray-300">
                  Foco: {CHALLENGE_SHORT_LABEL[mainChallenge] ?? mainChallenge}
                </span>
              ) : null}
            </div>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              Central de ajuda!
            </h1>
            <p className="text-sm text-gray-400 font-medium max-w-xl mx-auto pt-2">
              As sugestões abaixo foram ajustadas ao principal desafio que você indicou no cadastro — além dos módulos
              ativos.
            </p>
          </div>
        )}

        {!aiResponse && !isThinking && !hasModule('ia') && (
          <div className="space-y-3 text-center animate-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              Bem-vindo à {displayName}
            </h1>
            <p className="mx-auto max-w-xl pt-2 text-sm font-medium text-gray-400">
              Seu painel reflete os módulos ativos
              {mainChallenge ? (
                <>
                  {' '}
                  e prioriza{' '}
                  <strong className="text-gray-200">{CHALLENGE_SHORT_LABEL[mainChallenge] ?? mainChallenge}</strong>
                  {' '}
                  conforme o principal desafio que você marcou no cadastro.
                </>
              ) : (
                ' escolhidos no cadastro.'
              )}{' '}
              Use os atalhos abaixo ou o menu lateral. Para o assistente de IA nesta página, ative o módulo{' '}
              <strong className="text-gray-200">IA & Automação</strong> nas configurações da empresa quando disponível.
            </p>
          </div>
        )}

        {/* AI Response Area */}
        {hasModule('ia') && (isThinking || aiResponse) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {aiResponse && (
              <div className="flex justify-end">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-[24px] max-w-[80%]">
                  <p className="text-white text-sm font-medium">{aiResponse.query}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-start gap-4">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-xl shadow-black/5 flex-1 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
                {isThinking ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="text-base font-extrabold text-gray-400 uppercase tracking-normal ml-2">Analisando dados da {displayName}...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {aiResponse?.answer}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <button className="text-[10px] font-black uppercase text-primary hover:underline transition-all">Ver Detalhes no Módulo</button>
                      <button className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all ml-4" onClick={() => setAiResponse(null)}>Limpar Conversa</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasModule('ia') ? (
          <>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[24px] blur opacity-5 group-focus-within:opacity-10 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-white border border-gray-100 rounded-[20px] py-3.5 px-5 shadow-md shadow-gray-50 transition-all focus-within:border-primary/20">
                <textarea
                  placeholder={
                    entitlements?.ai.enabled
                      ? 'O que você deseja saber?'
                      : 'IA bloqueada — ative um plano no Hub Master'
                  }
                  disabled={!entitlements?.ai.enabled}
                  className="w-full bg-transparent border-none outline-none text-base text-gray-800 placeholder:text-gray-400 resize-none min-h-[64px] pr-12 scrollbar-hide disabled:cursor-not-allowed disabled:opacity-50"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
                      aria-label="Anexar"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
                      aria-label="Entrada por voz"
                    >
                      <Mic size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      className={`p-2 rounded-xl transition-all shadow-md ${inputValue.trim() && !isThinking ? 'bg-primary text-white shadow-primary/20 scale-105' : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'}`}
                      disabled={!inputValue.trim() || isThinking}
                      aria-label="Enviar"
                    >
                      <ArrowUp size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!aiResponse && !isThinking && (
              <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in duration-1000 slide-in-from-bottom-2">
                {iaSuggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => simulateAIResponse(item.query)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-100 rounded-full text-gray-500 font-semibold text-xs hover:bg-gray-50 hover:border-primary/20 hover:shadow-sm transition-all group"
                  >
                    <item.Icon size={14} className={`${item.color} group-hover:scale-105 transition-transform`} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}

        {!aiResponse && !isThinking && moduleQuickLinks.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
              Seus módulos
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {moduleQuickLinks.map(({ id, to, label }) => (
                <Link
                  key={id}
                  to={to}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inicio;
