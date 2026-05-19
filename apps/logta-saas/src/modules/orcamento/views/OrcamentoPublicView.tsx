import React from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Printer,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { OrcamentoAlteracaoClienteModal } from '../components/OrcamentoAlteracaoClienteModal';
import {
  findOrcamentoByToken,
  submitClienteAlteracaoRequest,
  updateOrcamentoStatus,
  upsertOrcamento,
} from '../orcamentoStorage';
import type { OrcamentoProposal, OrcamentoStatus } from '../types';
import { LogtaBrandWordmark } from '../../../components/LogtaBrandWordmark';
import { showToast } from '../../../components/Toast';
import { loadEmpresaProfile, type EmpresaPublicProfile } from '../../../lib/empresaProfileStorage';
import {
  downloadOrcamentoPublicPdf,
  printOrcamentoPublic,
} from '../../../lib/orcamentoPublicExport';

function deviceLabel() {
  if (typeof navigator === 'undefined') return 'web';
  return `${navigator.platform} · ${navigator.userAgent.slice(0, 40)}`;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusLabel(status: OrcamentoStatus) {
  const map: Record<OrcamentoStatus, string> = {
    rascunho: 'Rascunho',
    enviado: 'Enviado',
    visualizado: 'Visualizado',
    negociacao: 'Em negociação',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    expirado: 'Expirado',
    alteracao_solicitada: 'Alteração solicitada',
  };
  return map[status] ?? status;
}

function statusBadgeClass(status: OrcamentoStatus) {
  if (status === 'aprovado') return 'bg-green-100 text-green-700';
  if (status === 'rejeitado') return 'bg-red-100 text-red-700';
  if (status === 'expirado') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

export function OrcamentoPublicView() {
  const { token = '' } = useParams();
  const [orc, setOrc] = React.useState<OrcamentoProposal | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [done, setDone] = React.useState<'aprovado' | 'rejeitado' | 'alteracao' | null>(null);
  const [empresa, setEmpresa] = React.useState<EmpresaPublicProfile | null>(null);
  const [alteracaoModalOpen, setAlteracaoModalOpen] = React.useState(false);
  const [submittingAlteracao, setSubmittingAlteracao] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const documentRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const found = findOrcamentoByToken(token);
    if (found && found.status === 'enviado') {
      const viewed = {
        ...found,
        status: 'visualizado' as const,
        viewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          ...found.history,
          {
            id: `v-${Date.now()}`,
            type: 'visualizado' as const,
            label: 'Cliente visualizou o orçamento',
            at: new Date().toISOString(),
          },
        ],
      };
      upsertOrcamento(found.companyId, viewed);
      setOrc(viewed);
    } else {
      setOrc(found);
    }
    setLoading(false);
  }, [token]);

  React.useEffect(() => {
    if (orc?.companyId) setEmpresa(loadEmpresaProfile(orc.companyId));
  }, [orc?.companyId]);

  const registerAction = (action: 'aprovado' | 'rejeitado' | 'alteracao_solicitada') => {
    if (!orc) return;
    const ip = '187.0.0.1';
    const device = deviceLabel();
    const statusMap = {
      aprovado: 'aprovado' as const,
      rejeitado: 'rejeitado' as const,
      alteracao_solicitada: 'alteracao_solicitada' as const,
    };
    const labels = {
      aprovado: 'Orçamento aceito digitalmente pelo cliente',
      rejeitado: 'Orçamento rejeitado pelo cliente',
      alteracao_solicitada: 'Cliente solicitou alteração no orçamento',
    };
    const next = updateOrcamentoStatus(orc.companyId, orc.id, statusMap[action], {
      historyLabel: labels[action],
      historyMeta: action === 'aprovado' ? `IP ${ip} · ${device}` : undefined,
      approvedAt: action === 'aprovado' ? new Date().toISOString() : undefined,
      approvedIp: action === 'aprovado' ? ip : undefined,
      approvedDevice: action === 'aprovado' ? device : undefined,
      approvedByClient: action === 'aprovado',
      paymentStatus: action === 'aprovado' ? 'aguardando_pagamento' : undefined,
      viewedAt: orc.viewedAt ?? new Date().toISOString(),
    });
    if (next) {
      setOrc(next);
      setDone(action === 'alteracao_solicitada' ? 'alteracao' : action);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current || !orc) return;
    printOrcamentoPublic(documentRef.current, `Orçamento ${orc.number}`);
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current || !orc || exportingPdf) return;
    setExportingPdf(true);
    try {
      await downloadOrcamentoPublicPdf(documentRef.current, `orcamento-${orc.number}`);
      showToast('success', 'PDF gerado com o mesmo layout da página.', 'Download');
    } catch {
      showToast('error', 'Não foi possível gerar o PDF. Tente imprimir e salvar como PDF.', 'Erro');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAlteracaoSubmit = (message: string) => {
    if (!orc) return;
    setSubmittingAlteracao(true);
    const next = submitClienteAlteracaoRequest(orc.companyId, orc.id, message);
    setSubmittingAlteracao(false);
    if (next) {
      setOrc(next);
      setAlteracaoModalOpen(false);
      setDone('alteracao');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <p className="text-xs font-bold uppercase text-gray-400">Carregando orçamento…</p>
      </div>
    );
  }

  if (!orc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F9FAFB] p-8 text-center">
        <FileText size={48} className="text-gray-300" />
        <h1 className="text-xl font-black text-gray-900">Orçamento não encontrado</h1>
        <p className="max-w-md text-sm text-gray-500">
          Este link pode ter expirado ou sido revogado. Solicite um novo link à equipe Logta.
        </p>
      </div>
    );
  }

  const issuedAt = orc.updatedAt || orc.createdAt;
  const routeLabel = `${orc.origin} → ${orc.destination}`;
  const company = empresa ?? loadEmpresaProfile(orc.companyId);
  const tableHeaderBg = '#3372ED';

  return (
    <div className="orcamento-public-page min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#F9FAFB] text-gray-900 print:bg-white">
      <div className="orcamento-public-shell mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <article
          id="orcamento-public-document"
          ref={documentRef}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-[40px] print:rounded-none print:border-0 print:shadow-none"
        >
          {/* Cabeçalho estilo invoice */}
          <header className="border-b border-gray-100 px-4 py-6 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-4 sm:mb-5">
                  {company.logoDataUrl ? (
                    <img
                      src={company.logoDataUrl}
                      alt={company.nomeFantasia}
                      className="h-12 w-auto max-w-[180px] object-contain object-left sm:h-16 sm:max-w-[220px]"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-[9px] font-black uppercase text-gray-400 sm:h-14 sm:w-14">
                      Logo
                    </div>
                  )}
                </div>
                <p className="text-sm font-black text-gray-900">{company.razaoSocial}</p>
                <p className="text-sm font-semibold text-gray-600">{company.nomeFantasia}</p>
                <p className="mt-1 text-xs text-gray-500">CNPJ {company.cnpj}</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{company.endereco}</p>
              </div>

              <div className="shrink-0 border-t border-gray-100 pt-5 text-left sm:border-0 sm:pt-0 lg:text-right">
                <p className="text-2xl font-black uppercase tracking-tight text-gray-900 sm:text-[27px]">Orçamento</p>
                <p className="mt-1 text-sm font-semibold text-gray-500">{formatDateLong(issuedAt)}</p>
                <p className="mt-2 break-all text-base font-black text-gray-900 sm:text-lg">{orc.number}</p>
                <span
                  className={`mt-3 inline-flex max-w-full rounded-full px-3 py-1.5 text-[10px] font-black uppercase sm:px-4 ${statusBadgeClass(orc.status)}`}
                >
                  {statusLabel(orc.status)}
                </span>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-10 sm:py-10">
            {/* Para / validade */}
            <div className="mb-8 grid grid-cols-1 gap-6 border-b border-gray-100 pb-8 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Para</p>
                <p className="mt-1 text-lg font-black text-gray-900">{orc.clientName || 'Cliente'}</p>
                {orc.clientEmail ? <p className="text-sm text-gray-500">{orc.clientEmail}</p> : null}
                {orc.clientDocument ? <p className="text-sm text-gray-500">{orc.clientDocument}</p> : null}
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Rota</p>
                <p className="mt-1 break-words font-bold text-gray-900">{routeLabel}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-500 sm:justify-end">
                  <ShieldCheck size={14} className="shrink-0 text-primary" />
                  Validade: {new Date(orc.validity).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Tabela de itens */}
            <div className="orcamento-public-table-wrap -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="min-w-[320px] overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr style={{ backgroundColor: tableHeaderBg }}>
                      <th className="px-3 py-3 text-[9px] font-black uppercase tracking-normal text-white sm:px-6 sm:py-3.5 sm:text-xs">
                        Descrição do serviço
                      </th>
                      <th className="hidden w-24 px-2 py-3 text-right text-[9px] font-black uppercase tracking-normal text-white sm:table-cell sm:w-28 sm:px-4 sm:py-3.5 sm:text-xs">
                        Valor unit.
                      </th>
                      <th className="w-12 px-2 py-3 text-center text-[9px] font-black uppercase tracking-normal text-white sm:w-20 sm:px-4 sm:py-3.5 sm:text-xs">
                        Qtd
                      </th>
                      <th className="w-24 px-3 py-3 text-right text-[9px] font-black uppercase tracking-normal text-white sm:w-32 sm:px-6 sm:py-3.5 sm:text-xs">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-black/[0.06]">
                      <td className="px-3 py-4 align-top sm:px-6 sm:py-5">
                        <p className="text-sm font-black text-gray-900 sm:text-base">Frete logístico</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">{orc.services}</p>
                        <p className="mt-2 text-[11px] font-semibold text-gray-400 sm:text-xs">
                          {orc.origin} · destino {orc.destination}
                        </p>
                        <p className="mt-2 text-xs font-bold text-gray-700 sm:hidden">
                          Unit.: R$ {formatBRL(orc.subtotal)}
                        </p>
                      </td>
                      <td className="hidden px-4 py-5 text-right align-top text-sm font-bold text-gray-900 sm:table-cell">
                        R$ {formatBRL(orc.subtotal)}
                      </td>
                      <td className="px-2 py-4 text-center align-top text-xs font-bold text-gray-700 sm:px-4 sm:py-5 sm:text-sm">
                        1
                      </td>
                      <td className="px-3 py-4 text-right align-top text-xs font-black text-gray-900 sm:px-6 sm:py-5 sm:text-sm">
                        R$ {formatBRL(orc.subtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nota + totais */}
            <div className="mt-[30px] flex flex-col gap-8 py-[11px] lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-md flex-1">
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Observações</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {orc.notes ||
                    'Valores sujeitos à disponibilidade operacional. Impostos estimados conforme regime da operação. Entre em contato para ajustes de rota, prazo ou condições comerciais.'}
                </p>
              </div>

              <div className="w-full max-w-sm shrink-0 space-y-2 lg:ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold uppercase tracking-normal text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">R$ {formatBRL(orc.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold uppercase tracking-normal text-gray-500">Impostos (12%)</span>
                  <span className="font-bold text-gray-900">R$ {formatBRL(orc.taxes)}</span>
                </div>
                <div className="mt-[11px] flex flex-col gap-2 rounded-2xl px-[5px] py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-[19px]">
                  <span className="text-[9px] font-black uppercase tracking-normal text-gray-700">
                    Total do orçamento
                  </span>
                  <span className="text-left text-xl font-black leading-none text-black sm:min-w-[200px] sm:text-right sm:text-[24px]">
                    R$ {formatBRL(orc.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do cliente — mantidas */}
            <div className="no-print mt-10 border-t border-gray-100 pt-8">
              {done ? (
                <div
                  className={`rounded-2xl p-4 text-center text-sm font-bold ${
                    done === 'aprovado'
                      ? 'bg-green-50 text-green-800'
                      : done === 'rejeitado'
                        ? 'bg-red-50 text-red-800'
                        : 'bg-orange-50 text-orange-800'
                  }`}
                >
                  {done === 'aprovado' && 'Obrigado! Seu aceite foi registrado com segurança.'}
                  {done === 'rejeitado' && 'Resposta registrada. Nossa equipe entrará em contato se desejar.'}
                  {done === 'alteracao' && 'Solicitação de alteração enviada. Retornaremos em breve.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => registerAction('aprovado')}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
                  >
                    <CheckCircle2 size={18} /> Aceitar orçamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlteracaoModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold text-gray-800 transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <MessageSquare size={18} /> Solicitar alteração
                  </button>
                  <button
                    type="button"
                    onClick={() => registerAction('rejeitado')}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                  >
                    <XCircle size={18} /> Rejeitar
                  </button>
                </div>
              )}

              <div className="no-print mt-6 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={exportingPdf}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary disabled:opacity-50"
                >
                  <Download size={14} /> {exportingPdf ? 'Gerando PDF…' : 'Baixar PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé estilo invoice */}
          <footer className="border-t border-gray-100 bg-gray-50/60 px-4 py-6 sm:px-10 sm:py-8">
            <p className="text-center text-base font-black text-gray-900 sm:text-lg">Obrigado pela confiança</p>
            <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-3 sm:gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Dúvidas?</p>
                <p className="mt-2 text-xs font-semibold text-gray-600">{company.nomeFantasia}</p>
                <p className="mt-1 text-xs text-gray-500">{company.endereco}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Responsável</p>
                <p className="mt-2 text-xs font-semibold text-gray-600">{orc.createdByName}</p>
                <p className="mt-1 text-xs text-gray-500">Emitido em {formatDateLong(orc.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Termos</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Aceite digital válido para fins operacionais. Ao aprovar, você confirma ciência dos valores e
                  condições apresentados neste documento.
                </p>
              </div>
            </div>
          </footer>
        </article>

        <LogtaBrandWordmark className="no-print my-8 sm:my-10" />

        <p className="no-print text-center text-[10px] font-semibold uppercase tracking-normal text-gray-400">
          Powered by Logta · Aceite digital com registro de data, IP e dispositivo
        </p>
      </div>

      <OrcamentoAlteracaoClienteModal
        open={alteracaoModalOpen}
        onClose={() => setAlteracaoModalOpen(false)}
        onSubmit={handleAlteracaoSubmit}
        submitting={submittingAlteracao}
      />
    </div>
  );
}
