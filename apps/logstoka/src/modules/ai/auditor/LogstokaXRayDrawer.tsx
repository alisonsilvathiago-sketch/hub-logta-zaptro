import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogstokaXRay, XRayPageContext } from './LogstokaXRayContext';
import { runXRayAudit, resolveDiagnosticItem, XRayDiagnosticItem, XRayAuditResult } from './xrayAuditor';
import { toast } from 'react-hot-toast';

function getContextTitle(context: XRayPageContext): string {
  switch (context) {
    case 'products': return 'Catálogo de Produtos';
    case 'stock': return 'Posições de Estoque WMS';
    case 'movements': return 'Fluxo de Movimentações';
    case 'marketplace': return 'Canais de Marketplace';
    case 'integrations': return 'Integrações Ativas';
    case 'conference': return 'Conferência Operacional';
    case 'picking': return 'Guias de Separadores';
    case 'reports': return 'Relatórios e Métricas';
    case 'global':
    default:
      return 'Auditoria Operacional Global';
  }
}

const LogstokaXRayDrawer: React.FC = () => {
  const { isOpen, activeContext, closeXRay, onResolve } = useLogstokaXRay();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(true);
  const [scanStep, setScanStep] = useState(0);
  const [scanPercent, setScanPercent] = useState(0);
  const [auditData, setAuditData] = useState<XRayAuditResult | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Trigger audit whenever context changes or when opened
  useEffect(() => {
    if (!isOpen) return;

    setScanning(true);
    setScanStep(0);
    setScanPercent(0);
    setIgnoredIds(new Set());
    setAuditData(null);

    // Dynamic 0% to 100% counter over 3.2 seconds
    const duration = 3200;
    const intervalTime = 40;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep++;
      const percent = Math.min(100, Math.round((currentStep / steps) * 100));
      setScanPercent(percent);

      if (percent >= 75) setScanStep(3);
      else if (percent >= 50) setScanStep(2);
      else if (percent >= 25) setScanStep(1);

      if (percent === 100) {
        window.clearInterval(timer);
        const data = runXRayAudit(activeContext);
        setAuditData(data);
        // Brief visual delay for 100% progress state
        window.setTimeout(() => {
          setScanning(false);
        }, 400);
      }
    }, intervalTime);

    return () => {
      window.clearInterval(timer);
    };
  }, [isOpen, activeContext]);

  if (!isOpen) return null;

  const handleResolve = async (item: XRayDiagnosticItem) => {
    if (resolvingId) return;
    setResolvingId(item.id);

    try {
      const success = await resolveDiagnosticItem(item.id);
      if (success) {
        toast.success(`IA corrigiu com sucesso: "${item.title}"`);
        // Recalculate audit
        const freshData = runXRayAudit(activeContext);
        setAuditData(freshData);
        // Call resolution callback to refresh parent table/page data
        onResolve();
      }
    } catch (err) {
      toast.error('Não foi possível completar a correção automatizada.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleIgnore = (itemId: string) => {
    setIgnoredIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    toast.success('Ocorrência ocultada temporariamente.');
  };

  const handleView = (item: XRayDiagnosticItem) => {
    if (item.targetUrl) {
      navigate(item.targetUrl);
      closeXRay();
    }
  };

  const visibleItems = auditData?.items.filter(item => !ignoredIds.has(item.id)) || [];

  return createPortal(
    <div className="ls-xray-scanner-overlay" role="dialog" aria-label="Raio-X Inteligente de Operações WMS" onClick={closeXRay}>
      {scanning ? (
        <div className="ls-xray-scanner-card" onClick={(e) => e.stopPropagation()}>
          {/* Laser passando da esquerda para a direita devagar */}
          <div className="ls-xray-scanner-laser" />

          {/* HUD concêntrico rotativo */}
          <div className="ls-ia-scanner-overlay__hud !relative !h-auto !mb-6 !mt-2">
            <div className="ls-ia-scanner-overlay__hud-outer" />
            <div className="ls-ia-scanner-overlay__hud-inner" style={{ border: '2.5px dashed rgba(234, 88, 12, 0.25)' }} />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 border border-orange-200/50 shadow-inner">
              <RefreshCw size={36} className="text-orange-600 animate-spin" />
            </div>
          </div>

          <h3 className="text-[17px] font-black tracking-wide uppercase mb-1.5 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-orange-600">
            🔍 Raio-X: {getContextTitle(activeContext)}
          </h3>
          <p className="text-[12px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed mb-6">
            Mecanismo Llama 3.2 cruzando logs operacionais e verificando conformidade em tempo real...
          </p>

          {/* Log e Progresso Dinâmico em Porcentagem */}
          <div className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200/40 px-4 py-3 rounded-2xl shadow-inner mb-4 max-w-[290px] mx-auto">
            Aguarde, estamos escaneando a página... [{scanPercent}%]
          </div>

          <div className="font-mono text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-normal">
            {scanStep === 0 && '⚡ CONECTANDO À INTELIGÊNCIA AUDITORA WMS...'}
            {scanStep === 1 && '🔍 VARRENDO TABELAS DE DADOS DO TENANT...'}
            {scanStep === 2 && '🧬 ANALISANDO REGRAS DE CONFORMIDADE E PREÇOS...'}
            {scanStep === 3 && '🤖 FINALIZANDO DIAGNÓSTICO OPERACIONAL...'}
          </div>
        </div>
      ) : (
        /* Diagnostic Results Dashboard */
        <div 
          className="ls-xray-scanner-card !max-w-md !p-6 flex flex-col max-h-[85vh] overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                <Sparkles size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-black text-slate-900 leading-tight">🔍 Raio-X Operacional</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600">
                  {getContextTitle(activeContext)}
                </p>
              </div>
            </div>
            <button type="button" className="text-slate-400 hover:text-slate-600 transition" onClick={closeXRay} aria-label="Fechar">
              <X size={18} />
            </button>
          </header>

          {/* Body content wrapper */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
            
            {/* Score & Summary */}
            {auditData && (
              <div className="bg-orange-50/50 border border-orange-200/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div 
                    className={`h-12 w-12 rounded-full flex flex-col items-center justify-center font-black text-sm border-2 shrink-0 ${
                      auditData.score >= 95 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : auditData.score >= 80 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-red-500 bg-red-50 text-red-700'
                    }`}
                  >
                    {auditData.score}%
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Saúde da Seção</p>
                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                      {auditData.score >= 95 
                        ? 'Excelente · Sem Gargalos!' 
                        : auditData.score >= 80 
                          ? 'Bom · Requer Ajustes' 
                          : 'Crítico · Risco de Prejuízo'}
                    </h4>
                  </div>
                </div>
                <div className="text-[11.5px] font-semibold text-slate-600 leading-relaxed text-left">
                  "{auditData.summary}"
                </div>
              </div>
            )}

            {/* Diagnostic Items List */}
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-1 text-left">Ocorrências Encontradas</p>
              
              {visibleItems.length === 0 || visibleItems.every(item => item.status === 'ok') ? (
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <h5 className="text-xs font-black text-emerald-800">O sistema está correto ✓</h5>
                  <p className="text-[11px] text-emerald-600 font-semibold max-w-[240px] mx-auto leading-normal">
                    Excelente! A Inteligência Artificial concluiu o Raio-X e não encontrou nenhum erro ou falha de conformidade nesta página.
                  </p>
                </div>
              ) : (
                visibleItems
                  .filter(item => item.status !== 'ok')
                  .map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleView(item)}
                      title={item.targetUrl ? "Clique para ir corrigir este erro" : undefined}
                      className={`bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5 transition hover:scale-[1.01] flex flex-col gap-2 relative overflow-hidden text-left ${
                        item.targetUrl ? 'cursor-pointer' : ''
                      } ${
                        item.status === 'error' 
                          ? 'border-l-4 border-l-red-500' 
                          : 'border-l-4 border-l-amber-500'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-1.5 items-center min-w-0">
                          {item.status === 'error' ? (
                            <ShieldAlert size={14} className="text-red-500 shrink-0" />
                          ) : (
                            <AlertCircle size={14} className="text-amber-500 shrink-0" />
                          )}
                          <h5 className="text-xs font-black text-slate-800 truncate leading-snug">{item.title}</h5>
                        </div>
                        
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded-md ${
                          item.priority === 'high' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {item.priority === 'high' ? 'Alta' : 'Média'}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-500 leading-relaxed pr-1">
                        {item.message}
                      </p>

                      {/* Item footer actions */}
                      <div className="flex gap-2 justify-end pt-1 border-t border-slate-200/30 mt-1" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleIgnore(item.id)}
                          className="text-[9px] font-black text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          Ignorar
                        </button>
                        
                        {item.targetUrl && (
                          <button
                            type="button"
                            onClick={() => handleView(item)}
                            className="text-[9px] font-black text-orange-600 hover:text-orange-700 px-2 py-1 hover:bg-orange-50 rounded-lg transition cursor-pointer flex items-center gap-0.5"
                          >
                            Corrigir
                            <ArrowRight size={8} />
                          </button>
                        )}
                        
                        {item.canResolve && (
                          <button
                            type="button"
                            disabled={resolvingId !== null}
                            onClick={() => handleResolve(item)}
                            className="text-[9.5px] font-black bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:scale-105 active:scale-95 px-3 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer"
                          >
                            {resolvingId === item.id ? (
                              <>
                                <Loader2 size={10} className="animate-spin" />
                                Ajustando...
                              </>
                            ) : (
                              <>
                                Auto-Ajuste IA
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          
          {/* Footer detailing the AI operations scope */}
          <footer className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">
              IA Auditora · Llama 3.2 24/7
            </p>
            <button 
              type="button"
              className="text-[10px] font-black bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl transition"
              onClick={closeXRay}
            >
              Fechar
            </button>
          </footer>
        </div>
      )}
    </div>,
    document.body
  );
};

export default LogstokaXRayDrawer;
