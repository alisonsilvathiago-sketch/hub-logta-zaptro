import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileCode,
  FileText,
  Globe,
  Sparkles,
  Truck,
  Code2,
  Key,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFiscalIntelligence } from '../context/FiscalIntelligenceContext';

export function FiscalCentralDashboard() {
  const navigate = useNavigate();
  const {
    stats,
    activeAlerts,
    insights,
    monitoring,
    refreshIntelligence,
  } = useFiscalIntelligence();

  const kpi = [
    { label: 'CT-e Emitidos (Mês)', value: stats.cteEmitidos.toString(), color: 'text-gray-900', icon: FileText },
    { label: 'MDF-e Ativos', value: stats.mdfeAtivos.toString(), color: 'text-blue-500', icon: Truck },
    { label: 'Pendentes SEFAZ', value: stats.pendentesSefaz.toString(), color: 'text-yellow-500', icon: Clock },
    { label: 'Rejeitados', value: stats.rejeitados.toString(), color: 'text-red-500', icon: AlertCircle },
  ];

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="rounded-[40px] border border-blue-200 bg-blue-50/70 p-6 sm:p-8 backdrop-blur-md shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase text-primary">Central fiscal inteligente logística</span>
              </div>
              <h3 className="logta-card-heading text-lg text-gray-900">Monitoramento SEFAZ e emissão ativos</h3>
              <p className="mt-1 text-sm font-semibold text-blue-800/80">
                {monitoring.label} · {monitoring.total} alerta(s) · {monitoring.critical} crítico(s)
              </p>
            </div>
            <button type="button" onClick={refreshIntelligence} className="hub-premium-pill secondary shrink-0 !bg-blue-600 !text-white !border-blue-700 hover:!bg-blue-700">
              <Activity size={16} /> Sincronizar SEFAZ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {kpi.map((stat, i) => (
            <div key={i} className="logta-stat-card group">
              <div className="relative z-10">
                <p className="logta-stat-card__label">{stat.label}</p>
                <p className={`logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon
                size={60}
                className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="logta-panel-card p-8">
              <h3 className="logta-card-heading mb-8">Volume de Faturamento Fiscal</h3>
              <div className="flex h-64 items-center justify-center text-sm font-bold text-gray-400">
                Gráfico inteligente — conecte emissões da API fiscal
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'NF-e / NFS-e', path: '/documentos/cte' },
                  { label: 'Manifestos', path: '/documentos/mdfe' },
                  { label: 'Fila SEFAZ', path: '/documentos/dashboard' },
                  { label: 'Rejeições', path: '/documentos/rejeitados' },
                ].map((l) => (
                  <Link
                    key={l.label}
                    to={l.path}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-center text-xs font-bold text-gray-800 hover:border-primary/30"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-[#18191B] border border-neutral-800 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Code2 size={120} className="text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#60a5fa]">Logta API Gateway (Fiscal & Pagamentos)</h3>
                    <p className="text-xs font-medium text-neutral-400 mt-0.5">Integração nativa RESTful para emissão de CT-e, MDF-e e Baixa Financeira automática.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800/80 shadow-inner">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Credenciais de Produção</p>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">Live</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1.5">API Key</p>
                        <div className="flex items-center gap-2 bg-[#121212] p-3 rounded-xl border border-neutral-800/80 group transition-colors hover:border-primary/40">
                          <Key size={14} className="text-neutral-500" />
                          <span className="text-sm font-mono text-neutral-300">sk_live_logta_8f92a1...</span>
                          <button onClick={() => { if((window as any).showToast) (window as any).showToast('success', 'Chave de API copiada para área de transferência.', 'API Keys') }} className="ml-auto text-neutral-500 hover:text-white transition-colors cursor-pointer"><Copy size={14} /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1.5">Webhook Endpoint (Recebimento)</p>
                        <div className="flex items-center gap-2 bg-[#121212] p-3 rounded-xl border border-neutral-800/80 group transition-colors hover:border-primary/40">
                          <Globe size={14} className="text-neutral-500" />
                          <span className="text-sm font-mono text-neutral-300">https://api.logta.com/v1/webhooks</span>
                          <button onClick={() => { if((window as any).showToast) (window as any).showToast('success', 'URL copiada para área de transferência.', 'API Keys') }} className="ml-auto text-neutral-500 hover:text-white transition-colors cursor-pointer"><Copy size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800/80 shadow-inner h-full flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-4">Módulos Liberados via API</p>
                        <ul className="space-y-3 text-xs font-semibold text-neutral-300">
                          <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" /> Emissão de CT-e SEFAZ (Síncrono/Assíncrono)</li>
                          <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" /> Geração de MDF-e Automático</li>
                          <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" /> Gateway de Pagamento (Contas a Receber)</li>
                          <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" /> Conciliação Bancária LogtaPay</li>
                        </ul>
                      </div>
                      <button onClick={() => { if((window as any).showToast) (window as any).showToast('info', 'Redirecionando para documentação da API.', 'Developers') }} className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md">
                        <ExternalLink size={14} /> Ler Documentação API
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[40px] border border-blue-200 bg-blue-50/70 p-8 backdrop-blur-md shadow-sm">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="logta-card-heading text-gray-900">IA fiscal</h3>
                </div>
                <div className="space-y-3">
                  {insights.map((ins) => (
                    <div key={ins.id} className="rounded-xl border border-blue-200/60 bg-white p-3 shadow-sm">
                      <p className="text-xs font-bold text-gray-900">{ins.title}</p>
                      <p className="mt-1 text-[11px] text-gray-600 font-medium">{ins.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <FileCode size={120} className="absolute -right-8 -bottom-8 opacity-[0.03] text-blue-600 pointer-events-none" />
            </div>

            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-4">Alertas fiscais em tempo real</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {activeAlerts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate(a.actionPath)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:border-primary/30"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{a.title}</p>
                        <p className="line-clamp-2 text-[10px] text-gray-500">{a.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-3">Integração operacional</h3>
              <ul className="space-y-2 text-xs font-medium text-gray-600">
                <li className="flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Fretes · motorista · rota
                </li>
                <li className="flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Timeline e memória fiscal
                </li>
                <li className="flex items-center gap-2">
                  <Truck size={14} className="text-primary" /> Frota e MDF-e vinculados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
