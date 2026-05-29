import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Palmtree, XCircle } from 'lucide-react';
import { showToast } from '../../../../components/Toast';
import { useLogtaProfile } from '../../../../contexts/LogtaProfileContext';
import { buildEquipeRouteId } from '../../lib/equipeRouteId';
import { findColaboradorRhProfileByRouteId } from '../../ponto/colaboradorRhStorage';
import type { ColaboradorRhProfile } from '../../ponto/colaboradorRhStorage';
import {
  findFeriasRecordById,
  formatFeriasDate,
  updateFeriasAprovacao,
  type FeriasAprovacaoStatus,
} from '../feriasAprovacaoStorage';

const STATUS_LABEL: Record<FeriasAprovacaoStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

const STATUS_CLASS: Record<FeriasAprovacaoStatus, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  em_analise: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
};

type FeriasAprovacaoPanelProps = {
  companyId: string;
  profile: ColaboradorRhProfile;
  feriasId: string;
  returnTo: string;
  returnLabel: string;
  onProfileUpdated: (next: ColaboradorRhProfile) => void;
};

export function FeriasAprovacaoPanel({
  companyId,
  profile,
  feriasId,
  returnTo,
  returnLabel,
  onProfileUpdated,
}: FeriasAprovacaoPanelProps) {
  const navigate = useNavigate();
  const { profile: reviewerProfile } = useLogtaProfile();
  const reviewer = reviewerProfile?.full_name?.trim() || 'RH';
  const [rhNote, setRhNote] = useState('');
  const [tick, setTick] = useState(0);

  const record = useMemo(
    () => findFeriasRecordById(companyId, feriasId),
    [companyId, feriasId, tick],
  );

  useEffect(() => {
    if (record?.rhNote) setRhNote(record.rhNote);
  }, [record?.id, record?.rhNote]);

  if (!record || record.profileId !== profile.id) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Solicitação de férias não encontrada.
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="ml-2 font-bold text-primary underline"
        >
          Voltar para {returnLabel}
        </button>
      </div>
    );
  }

  const canDecide = record.status === 'pendente' || record.status === 'em_analise';

  const applyStatus = (status: FeriasAprovacaoStatus) => {
    if (status === 'recusado' && !rhNote.trim()) {
      showToast('error', 'Informe o motivo da recusa.', 'RH');
      return;
    }
    updateFeriasAprovacao(companyId, record.id, { status, rhNote: rhNote.trim() }, reviewer);
    setTick((t) => t + 1);
    const msg =
      status === 'aprovado'
        ? 'Férias aprovadas — período registrado no dossiê, agenda e solicitações.'
        : status === 'recusado'
          ? 'Solicitação de férias reprovada.'
          : status === 'em_analise'
            ? 'Marcada como em andamento.'
            : 'Status atualizado.';
    showToast('success', msg, 'RH');
    const refreshed = findColaboradorRhProfileByRouteId(companyId, buildEquipeRouteId(profile));
    if (refreshed) onProfileUpdated(refreshed);
  };

  return (
    <div className="rounded-[32px] border border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Palmtree size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              Aprovação de férias
            </p>
            <h3 className="text-lg font-black text-gray-900">{record.reason}</h3>
            <p className="mt-1 text-xs font-medium text-gray-600">
              {formatFeriasDate(record.startDate)}
              {record.endDate ? ` → ${formatFeriasDate(record.endDate)}` : ''}
              {' · '}
              {record.days} dia(s)
              {record.saldoDias != null ? ` · Saldo ${record.saldoDias}d` : ''}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${STATUS_CLASS[record.status]}`}
        >
          {STATUS_LABEL[record.status]}
        </span>
      </div>

      {record.reviewedAt ? (
        <p className="mt-4 text-xs text-gray-500">
          Última decisão: {formatFeriasDate(record.reviewedAt)}
          {record.reviewedBy ? ` · ${record.reviewedBy}` : ''}
          {record.rhNote ? ` — ${record.rhNote}` : ''}
        </p>
      ) : null}

      <div className="mt-5">
        <label className="mb-1.5 block text-[10px] font-black uppercase text-gray-400">
          Parecer RH
        </label>
        <textarea
          value={rhNote}
          onChange={(e) => setRhNote(e.target.value)}
          rows={3}
          placeholder="Observações para aprovação, análise ou recusa…"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/50"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {canDecide ? (
          <>
            <button
              type="button"
              onClick={() => applyStatus('em_analise')}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800"
            >
              <Clock size={14} /> Em andamento
            </button>
            <button
              type="button"
              onClick={() => applyStatus('aprovado')}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
            >
              <CheckCircle2 size={14} /> Aprovar férias
            </button>
            <button
              type="button"
              onClick={() => applyStatus('recusado')}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700"
            >
              <XCircle size={14} /> Reprovar
            </button>
          </>
        ) : (
          <p className="text-xs font-semibold text-gray-600">
            Solicitação <strong>{STATUS_LABEL[record.status].toLowerCase()}</strong> — o dossiê,
            timeline e solicitações já refletem esta decisão.
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:border-primary/30"
        >
          Voltar para {returnLabel}
        </button>
      </div>
    </div>
  );
}
