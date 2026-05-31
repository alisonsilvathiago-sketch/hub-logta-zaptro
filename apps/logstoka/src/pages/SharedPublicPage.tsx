import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Lock, AlertTriangle, Clock, Eye, MessageSquare, Send, CheckCircle, 
  XCircle, ChevronRight, Package, Box, RefreshCw, BarChart2, DollarSign 
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { secureSharing, type LsShareLink } from '@/lib/secureSharing';

export const SharedPublicPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<LsShareLink | null>(null);
  const [errorState, setErrorState] = useState<'expired' | 'revoked' | 'not_found' | null>(null);
  
  // States para interação
  const [visitorName, setVisitorName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<LsShareLink['comments']>([]);
  const [approval, setApproval] = useState<LsShareLink['approvalStatus']>('pending');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    
    // Simula tempo de carregamento da rede
    const timer = window.setTimeout(() => {
      const { share: data, error } = secureSharing.getShareLinkByToken(token);
      
      if (error) {
        setErrorState(error);
        setShare(data); // Apenas para auditoria se necessário
      } else if (data) {
        setShare(data);
        setComments(data.comments);
        setApproval(data.approvalStatus ?? 'pending');
        secureSharing.incrementVisits(token);
      }
      setLoading(false);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [token]);

  // Timer regressivo para expiração
  useEffect(() => {
    if (!share || errorState) return;

    const interval = window.setInterval(() => {
      const diff = new Date(share.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setErrorState('expired');
        window.clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        setTimeRemaining(`Expirando em ${Math.ceil(hours / 24)} dias`);
      } else {
        setTimeRemaining(
          `Expirando em: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [share, errorState]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;

    const author = visitorName.trim() || 'Auditor Externo';
    const updated = secureSharing.addCommentToShare(token, author, newComment.trim());
    if (updated) {
      setComments(updated.comments);
      setNewComment('');
      setVisitorName('');
      toast.success('Comentário enviado com sucesso!');
    }
  };

  const handleApproval = (status: 'approved' | 'rejected') => {
    if (!token) return;
    const updated = secureSharing.updateShareApproval(token, status);
    if (updated) {
      setApproval(status);
      toast.success(
        status === 'approved' 
          ? 'Estoque Aprovado com sucesso! O supervisor foi notificado.' 
          : 'Contagem Rejeitada. Notificação enviada para reavaliação.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans p-6 text-slate-800">
        <Toaster position="top-right" />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">LogStoka Secure Sharing</p>
            <p className="text-lg font-bold text-slate-600 mt-1">Carregando túnel criptografado seguro...</p>
          </div>
        </div>
      </div>
    );
  }

  // Telas de Erro (Expirado, Revogado, Não Encontrado)
  if (errorState || !share) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans p-6 text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-200/60 p-8 rounded-3xl shadow-xl text-center space-y-6 animate-fade-in">
          <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">
              {errorState === 'expired' 
                ? 'Este compartilhamento expirou' 
                : errorState === 'revoked' 
                  ? 'Acesso Revogado pelo Proprietário' 
                  : 'Conteúdo Não Disponível'}
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              {errorState === 'expired' 
                ? 'O tempo de validade deste link se esgotou e o conteúdo não está mais acessível.' 
                : errorState === 'revoked' 
                  ? 'O supervisor de WMS cancelou as permissões de acesso deste link manual ou automaticamente.' 
                  : 'O token fornecido é inválido ou a empresa de origem não existe.'}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
              <Lock size={12} /> LogStoka Security Tunnel
            </div>
            {share && (
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Ref: {share.name} · Gerado por WMS Supervisor
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isPresetSnapshot = share.snapshotData != null;
  const isViewOnly = share.permissions === 'view_only';
  const allowComments = share.permissions === 'view_comment';
  const allowApproval = share.permissions === 'view_approve';
  const allowReprove = share.permissions === 'view_reprove';

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 flex flex-col antialiased">
      <Toaster position="top-right" />
      
      {/* Sleek Glassmorphism Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_12px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/10">
            L
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1">
              LogStoka <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-lg text-xs font-bold border border-orange-100">Share</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Visualização Externa Segura</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRemaining ? (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100/70 px-3.5 py-1.5 text-xs font-bold text-orange-600 shadow-sm animate-pulse">
              <Clock size={13} className="text-orange-500" />
              {timeRemaining}
            </div>
          ) : null}
          <div className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200/40 rounded-full px-3 py-1.5 uppercase tracking-widest flex items-center gap-1.5">
            <Lock size={12} className="text-orange-600" /> Criptografado
          </div>
        </div>
      </header>

      {/* Main Grid Layout - Much more spacious and balanced */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Conteúdo Principal (Spacious layout, better text sizing) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card de Boas-Vindas e Metadados do Compartilhamento */}
          <section className="bg-white border border-slate-200/50 p-8 rounded-[28px] shadow-sm space-y-5 transition duration-200 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 px-3 py-1.5 text-slate-500 rounded-full border border-slate-200/20">
                {share.resourceType === 'product' ? '📦 Produto' : share.resourceType === 'inventory' ? '📋 Inventário' : '📊 Tabela'}
              </span>
              {isPresetSnapshot ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-50 border border-orange-200/40 px-3 py-1.5 text-orange-700 rounded-full flex items-center gap-1.5 shadow-sm">
                  🔒 Cópia Snapshot Congelada (Estático)
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100/30 px-3 py-1.5 text-emerald-600 rounded-full flex items-center gap-1">
                  ⚡ Sincronização Dinâmica (Tempo Real)
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                {share.name}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Criador: <strong className="text-slate-600">{share.creatorName}</strong></span>
                <span>·</span>
                <span>Gerado: <strong className="text-slate-600">{new Date(share.createdAt).toLocaleDateString('pt-BR')}</strong></span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye size={13} className="text-slate-400" /> <strong>{share.visits}</strong> acessos</span>
              </div>
            </div>

            {share.note ? (
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40 relative overflow-hidden">
                <p className="text-xs font-semibold text-slate-500 leading-relaxed relative z-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Observações do Emissor:</span>
                  {share.note}
                </p>
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-slate-500">
                  <MessageSquare size={80} />
                </div>
              </div>
            ) : null}
          </section>

          {/* RENDERIZADOR DADO COMPARTILHADO (Spacious list layout, styled cards) */}
          <section className="bg-white border border-slate-200/50 rounded-[28px] shadow-sm overflow-hidden transition duration-200 hover:shadow-md">
            <div className="border-b border-slate-100 px-8 py-5 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Ficha Operacional de Auditoria</span>
              <span className="text-xs font-extrabold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-200/30">Ref: {share.resourceId}</span>
            </div>
            
            {/* Visualizador de Detalhes do Produto */}
            {share.resourceType === 'product' ? (
              <div className="p-8 space-y-8">
                
                {/* Cabeçalho do Produto - Spacious and Premium */}
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                  {share.snapshotData?.main_image_url ? (
                    <img 
                      src={share.snapshotData.main_image_url} 
                      alt="" 
                      className="h-28 w-28 object-cover border border-slate-200 rounded-[22px] shadow-[0_4px_12px_rgba(15,23,42,0.04)] bg-white p-1"
                    />
                  ) : (
                    <div className="h-28 w-28 bg-slate-50 border border-slate-200/40 rounded-[22px] flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-400 gap-1.5 shadow-inner">
                      <Package size={20} className="text-slate-300" />
                      Sem Foto
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100/50">
                      Catálogo WMS Mestre
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-2">
                      {share.snapshotData?.name || 'Fralda Pluma Premium P 60un'}
                    </h3>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                      <span className="text-[10px] font-bold px-3 py-1 bg-slate-50 rounded-xl text-slate-600 border border-slate-200/20">
                        SKU: <strong className="text-slate-800">{share.snapshotData?.sku || 'PLM-FRD-P'}</strong>
                      </span>
                      <span className="text-[10px] font-bold px-3 py-1 bg-slate-50 rounded-xl text-slate-600 border border-slate-200/20">
                        Unidade: <strong className="text-slate-800">{share.snapshotData?.unit || 'UN'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Futurisic glowing WMS total stock card */}
                <div className="bg-slate-900 text-white p-8 rounded-[24px] shadow-xl relative overflow-hidden border border-slate-800">
                  <div className="relative z-10 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quantidade Geral Mestre Em Estoque</p>
                      <p className="text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
                        {share.snapshotData?.stockTotal?.toLocaleString('pt-BR') || '840'}{' '}
                        <span className="text-base font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">unidades totais</span>
                      </p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 border border-white/[0.05] mt-4">
                      <div className="h-5 w-5 bg-orange-500/20 rounded-md flex items-center justify-center text-orange-500 flex-shrink-0 mt-0.5">
                        <CheckCircle size={14} className="animate-pulse" />
                      </div>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        Varredura inteligente por IA consolidou dados de 4 planilhas operacionais, WMS local e todos os canais de marketplace integrados. 
                        {share.snapshotData?.divergencesFound ? (
                          <span className="text-orange-400 block font-bold mt-1">⚠️ Ajustes pendentes de conciliação detectados abaixo.</span>
                        ) : (
                          <span className="text-emerald-400 block font-bold mt-1">✓ Todos os registros estão 100% conciliados e sem divergências.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Glowing background circles for extreme premium feel */}
                  <div className="absolute right-0 bottom-0 h-40 w-40 bg-orange-600/10 rounded-full translate-x-12 translate-y-12 blur-2xl pointer-events-none" />
                  <div className="absolute left-1/3 top-0 h-28 w-28 bg-orange-500/5 rounded-full -translate-y-8 blur-xl pointer-events-none" />
                </div>

                {/* KPIs de Estoque Adicionais - Premium cards with icons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-white border border-slate-200/50 rounded-2xl flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.01)] hover:border-slate-200 transition">
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Disponível WMS</p>
                      <p className="text-2xl font-black text-slate-800">
                        {share.snapshotData?.stockAvailable?.toLocaleString('pt-BR') || '800'}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/10">
                      <Box size={18} />
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200/50 rounded-2xl flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.01)] hover:border-slate-200 transition">
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Reservado Pedidos</p>
                      <p className="text-2xl font-black text-slate-800">
                        {share.snapshotData?.stockReserved?.toLocaleString('pt-BR') || '40'}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/10">
                      <Eye size={18} />
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200/50 rounded-2xl flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.01)] hover:border-slate-200 transition col-span-1">
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Limite Mínimo</p>
                      <p className="text-2xl font-black text-slate-800">
                        {share.snapshotData?.min_stock?.toLocaleString('pt-BR') || '300'}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/10">
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                </div>

                {/* Table of WMS / Marketplace API integrations - More spacious row cards */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-slate-400 animate-spin-slow" />
                    Isolamento & Auditoria de Canais API
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    
                    <div className="bg-slate-50/70 border border-slate-200/40 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-200/50 text-slate-700 rounded-xl flex items-center justify-center font-bold text-xs">
                          WMS
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">WMS Central LogStoka</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Servidor Integrado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">840 un.</p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-200/60 rounded text-slate-600 block mt-1 uppercase">Servidor Master</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/40 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xs border border-orange-100/50">
                          ML
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">Mercado Livre (API Callback)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Webhook Ativo</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-amber-700">820 un.</p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-amber-50 border border-amber-100/50 rounded text-amber-700 block mt-1 uppercase">Aviso: Divergência ⚠️</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/40 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs border border-emerald-100/50">
                          SH
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">Shopee Store (OAuth Ativo)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Conexão Autenticada</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">840 un.</p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-50 border border-emerald-100/30 rounded text-emerald-600 block mt-1 uppercase flex items-center gap-0.5 justify-center">Conciliado ✓</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/40 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-200/50 text-slate-700 rounded-xl flex items-center justify-center font-bold text-xs">
                          XLS
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">Planilha Excel de Entrada</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Upload Lote Fralda-P</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">850 un.</p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 rounded text-slate-500 block mt-1 uppercase">Não Aprovada</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              /* Visualizador de Tabela Geral */
              <div className="p-8 space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center gap-4 shadow-md">
                  <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total de Linhas Compartilhadas</p>
                    <p className="text-xl font-black">15 Registros Conciliados</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-[18px] overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/50 text-slate-500">
                        <th className="p-4 font-bold uppercase">Código</th>
                        <th className="p-4 font-bold uppercase">Referência</th>
                        <th className="p-4 font-bold uppercase">Status</th>
                        <th className="p-4 font-bold uppercase text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">PLM-FRD-P</td>
                        <td className="p-4">Fralda Pluma P 60un</td>
                        <td className="p-4"><span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/30 text-emerald-600 uppercase">Aprovado</span></td>
                        <td className="p-4 font-black text-right text-slate-900">840</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">PLM-FRD-M</td>
                        <td className="p-4">Fralda Pluma M 50un</td>
                        <td className="p-4"><span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/30 text-emerald-600 uppercase">Aprovado</span></td>
                        <td className="p-4 font-black text-right text-slate-900">1.200</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">PLM-FRD-G</td>
                        <td className="p-4">Fralda Pluma G 40un</td>
                        <td className="p-4"><span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100/40 text-amber-700 uppercase">Pendente</span></td>
                        <td className="p-4 font-black text-right text-slate-900">320</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Lado Direito: Comentários e Aprovações */}
        <div className="space-y-8">
          
          {/* Painel de Aprovação de Estoque (Estilo WMS) */}
          {(allowApproval || allowReprove) ? (
            <section className="bg-white border border-slate-200/50 p-6 md:p-8 rounded-[28px] shadow-sm space-y-5 transition duration-200 hover:shadow-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-orange-600" />
                Decisão do Auditor
              </h3>
              
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Sua resposta será sincronizada de forma segura com o LogStoka WMS corporativo.
              </p>

              {approval === 'pending' ? (
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApproval('approved')}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 shadow-lg shadow-emerald-600/10 transition duration-150 active:scale-[0.98]"
                  >
                    <CheckCircle size={16} />
                    Aprovar Estoque (840 un)
                  </button>
                  {allowReprove && (
                    <button
                      type="button"
                      onClick={() => handleApproval('rejected')}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-red-50 text-red-600 font-extrabold text-xs py-3.5 px-4 border-2 border-red-100 hover:border-red-200 transition duration-150 active:scale-[0.98]"
                    >
                      <XCircle size={16} />
                      Rejeitar e Pedir Recontagem
                    </button>
                  )}
                </div>
              ) : (
                <div className={`p-5 rounded-2xl flex items-start gap-3 border-2 ${
                  approval === 'approved' 
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                    : 'bg-red-50/50 border-red-100 text-red-800'
                } animate-fade-in`}>
                  {approval === 'approved' ? (
                    <CheckCircle className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-extrabold text-xs">
                      {approval === 'approved' ? 'Estoque Aprovado ✓' : 'Estoque Reprovado ✗'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1.5 leading-relaxed">
                      Sua resposta foi enviada ao sistema central do LogStoka. Este link seguro permanece auditado com status final.
                    </p>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Painel de Comentários / Discussão - Bubbles, spacious layout */}
          {allowComments ? (
            <section className="bg-white border border-slate-200/50 p-6 md:p-8 rounded-[28px] shadow-sm flex flex-col transition duration-200 hover:shadow-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-orange-600" />
                Discussão e Notas
              </h3>

              {/* Lista de Comentários - Spacious message bubbles */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1 max-h-[300px] min-h-[160px] scrollbar-thin">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <MessageSquare className="text-slate-300" size={24} />
                    <p className="text-xs font-semibold text-slate-400 italic">
                      Nenhum comentário registrado ainda.
                    </p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const authorInitials = c.author.slice(0, 2).toUpperCase();
                    return (
                      <div key={c.id} className="flex gap-3 items-start animate-fade-in">
                        <div className="h-8 w-8 rounded-full bg-orange-100 border border-orange-200/30 text-orange-700 flex items-center justify-center text-[10px] font-black shrink-0">
                          {authorInitials}
                        </div>
                        <div className="bg-slate-50 border border-slate-200/30 p-4 rounded-2xl flex-1 space-y-1 relative shadow-[0_1px_3px_rgba(15,23,42,0.01)]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[10px] text-slate-700">{c.author}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 leading-normal">{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form para adicionar comentário - Spacious with custom inputs */}
              <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-5 space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Seu Nome / Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Thiago WMS Auditor"
                    className="ls-input text-xs"
                    style={{ height: '46px', minHeight: '46px', borderRadius: '12px' }}
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Mensagem</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Adicione um comentário ou nota..."
                      className="ls-input text-xs pr-12"
                      style={{ height: '46px', minHeight: '46px', borderRadius: '12px' }}
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-100 hover:bg-orange-100 transition p-1.5 rounded-lg shadow-sm"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </form>
            </section>
          ) : null}

          {/* Se nenhuma interação é permitida, mostra apenas aviso de View Only */}
          {isViewOnly ? (
            <section className="bg-white border border-slate-200/50 p-6 rounded-3xl shadow-sm text-center border-dashed">
              <p className="text-xs font-extrabold text-slate-400 flex items-center justify-center gap-1.5">
                <Lock size={13} className="text-orange-600 animate-pulse" />
                Visualização Protegida Somente Leitura
              </p>
            </section>
          ) : null}

        </div>
      </main>

      {/* Footer Público Limpo e Profissional */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-16 space-y-1">
        <div>LogStoka WMS Integrated Sharing Tunnel</div>
        <div className="text-[9px] text-slate-400 font-semibold tracking-normal lowercase mt-0.5">
          Protegido contra vazamento de dados. © {new Date().getFullYear()} LogStoka Inc.
        </div>
      </footer>
    </div>
  );
};
export default SharedPublicPage;
