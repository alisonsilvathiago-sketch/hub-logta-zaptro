import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Timer,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { showToast } from '../../../../components/Toast';
import { useTenant } from '../../../../contexts/TenantContext';
import { useLogtaProfile } from '../../../../contexts/LogtaProfileContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { equipeProfileUrl } from '../../lib/equipeRouteId';
import {
  buildAtestadosFromProfiles,
  computeAtestadosKpis,
  formatAtestadoDate,
  updateAtestadoAprovacao,
  type AtestadoAprovacaoRecord,
  type AtestadoAprovacaoStatus,
} from '../atestadosAprovacaoStorage';
import type { RhModuleDef } from '../../types';

type AprovacaoAtestadosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const statusLabel: Record<AtestadoAprovacaoStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

const statusClass: Record<AtestadoAprovacaoStatus, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  em_analise: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
};

type FilterTab = 'todos' | AtestadoAprovacaoStatus;

export function AprovacaoAtestadosView({ module, hubPath, hubLabel }: AprovacaoAtestadosViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [selected, setSelected] = useState<AtestadoAprovacaoRecord | null>(null);
  const [rhNote, setRhNote] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reviewer = profile?.full_name?.trim() || 'RH';

  const allRows = useMemo(
    () => buildAtestadosFromProfiles(companyId),
    [companyId, refreshKey],
  );

  const filtered = useMemo(() => {
    if (filter === 'todos') return allRows;
    return allRows.filter((r) => r.status === filter);
  }, [allRows, filter]);

  const kpis = useMemo(() => computeAtestadosKpis(allRows), [allRows]);

  const kpiCards = useMemo(
    () => [
      { title: 'Total enviados', value: String(kpis.total), trend: 'neutral' as const, icon: FileText },
      {
        title: 'Pendentes',
        value: String(kpis.pendentes),
        trend: kpis.pendentes > 0 ? ('down' as const) : ('neutral' as const),
        trendValue: kpis.pendentes > 0 ? 'Aguardando RH' : undefined,
        icon: AlertTriangle,
      },
      {
        title: 'Aprovados (mês)',
        value: String(kpis.aprovadosMes),
        trend: 'up' as const,
        trendValue: 'Corrente',
        icon: CheckCircle2,
      },
      { title: 'SLA médio', value: kpis.slaMedio, trend: 'neutral' as const, icon: Timer },
    ],
    [kpis],
  );

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleApprove = () => {
    if (!selected) return;
    updateAtestadoAprovacao(companyId, selected.id, { status: 'aprovado', rhNote: rhNote.trim() }, reviewer);
    showToast('success', 'Atestado aprovado e registrado no dossiê.', 'RH');
    setSelected(null);
    setRhNote('');
    bump();
  };

  const handleReject = () => {
    if (!selected) return;
    if (!rhNote.trim()) {
      showToast('error', 'Informe o motivo da recusa.', 'RH');
      return;
    }
    updateAtestadoAprovacao(companyId, selected.id, { status: 'recusado', rhNote: rhNote.trim() }, reviewer);
    showToast('info', 'Atestado recusado — colaborador pode reenviar.', 'RH');
    setSelected(null);
    setRhNote('');
    bump();
  };

  const handleMarkAnalysis = () => {
    if (!selected) return;
    updateAtestadoAprovacao(companyId, selected.id, { status: 'em_analise', rhNote: rhNote.trim() }, reviewer);
    showToast('success', 'Marcado como em análise.', 'RH');
    setSelected(null);
    setRhNote('');
    bump();
  };

  const openDetail = (row: AtestadoAprovacaoRecord) => {
    setSelected(row);
    setRhNote(row.rhNote ?? '');
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendente', label: 'Pendentes' },
    { id: 'em_analise', label: 'Em análise' },
    { id: 'aprovado', label: 'Aprovados' },
    { id: 'recusado', label: 'Recusados' },
  ];

  return (
    <div className="space-y-8 text-left">
      <Link
        to={`${hubPath}/pessoas`}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpiCards}
        mainContentTitle="Atestados enviados pelos colaboradores"
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-normal transition-all ${
                filter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum atestado neste filtro.
            </p>
          ) : (
            filtered.map((row, i) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openDetail(row)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-gray-900">{row.collaboratorName}</p>
                    <p className="text-xs text-gray-500">
                      {row.reason} · {row.days} dia(s)
                    </p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Enviado {formatAtestadoDate(row.submittedAt)}
                      {row.attachmentName ? ` · ${row.attachmentName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[row.status]}`}
                  >
                    {statusLabel[row.status]}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-gray-300 transition-colors group-hover:text-primary"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar — Atestados"
        getTabularData={() => ({
          title: 'Aprovação de atestados',
          filenameBase: 'rh-atestados',
          columns: ['Colaborador', 'Motivo', 'Dias', 'Enviado', 'Status', 'CID'],
          rows: allRows.map((r) => [
            r.collaboratorName,
            r.reason,
            String(r.days),
            formatAtestadoDate(r.submittedAt),
            statusLabel[r.status],
            r.cid ?? '—',
          ]),
        })}
      />

      {selected ? (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setSelected(null)}
          />
          <div
            className="relative max-h-[min(92dvh,720px)] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-gray-100 bg-white p-6 shadow-2xl sm:rounded-[32px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={ClipboardCheck}
              title="Detalhe do atestado"
              dotClassName="bg-primary"
              onClose={() => setSelected(null)}
            />

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-900">{selected.collaboratorName}</p>
                    <p className="text-xs font-medium text-gray-500">
                      {selected.role} · {selected.sector}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold ${statusClass[selected.status]}`}
                  >
                    {statusLabel[selected.status]}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Enviado em', formatAtestadoDate(selected.submittedAt)],
                  ['Início afastamento', formatAtestadoDate(selected.startDate)],
                  ['Dias', String(selected.days)],
                  ['CID', selected.cid ?? '—'],
                  ['Anexo', selected.attachmentName ?? '—'],
                  ['Origem', selected.source],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                    <dt className="text-[10px] font-black uppercase text-gray-400">{label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase text-gray-400">Motivo / observações</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-800">{selected.reason}</p>
              </div>

              {selected.reviewedAt ? (
                <p className="text-xs text-gray-500">
                  Analisado em {formatAtestadoDate(selected.reviewedAt)}
                  {selected.reviewedBy ? ` por ${selected.reviewedBy}` : ''}
                  {selected.rhNote ? ` — ${selected.rhNote}` : ''}
                </p>
              ) : null}

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase text-gray-400">
                  Parecer RH
                </label>
                <textarea
                  value={rhNote}
                  onChange={(e) => setRhNote(e.target.value)}
                  rows={3}
                  placeholder="Observações para aprovação ou recusa…"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate(equipeProfileUrl(selected.equipeRouteId), {
                      state: {
                        rhReturnTo: '/rh/administrativo/aprovacao-atestados',
                        rhReturnLabel: 'Aprovação de Atestados',
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:border-primary/30 hover:text-primary"
                >
                  <FileText size={14} /> Abrir dossiê completo
                </button>
                {(selected.status === 'pendente' || selected.status === 'em_analise') && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkAnalysis}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800"
                    >
                      <Clock size={14} /> Em análise
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      <CheckCircle2 size={14} /> Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700"
                    >
                      <XCircle size={14} /> Recusar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
