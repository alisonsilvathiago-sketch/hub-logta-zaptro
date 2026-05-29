import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Pause,
  Phone,
  Play,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useTenant } from '../../../../contexts/TenantContext';
import { usePontoConfig } from '../hooks/usePontoConfig';
import {
  countAbsenceDays,
  enrichProfileFromSupabase,
  findColaboradorRhProfileByRouteId,
  getPontoRecordsForCollaborator,
  isOnVacation,
  mergeProfileFromPontoRecord,
} from '../colaboradorRhStorage';
import type { ColaboradorRhProfile } from '../colaboradorRhStorage';
import type { PontoRecord, PontoRecordType } from '../types';

const typeLabels: Record<PontoRecordType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  pausa_inicio: 'Início de pausa',
  pausa_fim: 'Retorno de pausa',
};

type ColaboradorJornadaViewProps = {
  hubPath?: string;
  hubLabel?: string;
};

export function ColaboradorJornadaView({
  hubPath = '/rh/jornada-ponto',
  hubLabel = 'Jornada & Ponto',
}: ColaboradorJornadaViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { config: tenantConfig } = useTenant();
  const companyId = tenantConfig?.id;
  const { records, refreshRecords } = usePontoConfig(companyId);

  const [profile, setProfile] = useState<ColaboradorRhProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'ponto' | 'ferias' | 'docs'>('geral');

  const routeId = decodeURIComponent(id ?? '');
  const isEquipePerfil = hubPath === '/rh/equipe';

  useEffect(() => {
    if (!companyId || !routeId) return;
    refreshRecords();
  }, [companyId, routeId, refreshRecords]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!companyId || !routeId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let rhProfile = findColaboradorRhProfileByRouteId(companyId, routeId);
      const pontoCollabId = rhProfile?.id ?? routeId;
      const pontoForColab = getPontoRecordsForCollaborator(records, pontoCollabId);
      const latest = pontoForColab[0];

      if (!rhProfile && latest) {
        rhProfile = mergeProfileFromPontoRecord(companyId, latest);
      }

      if (!rhProfile && routeId.startsWith('colab-')) {
        rhProfile = {
          id: routeId,
          companyId,
          fullName: 'Colaborador',
          document: routeId.replace('colab-', ''),
          sector: 'Operação',
          role: 'Colaborador',
          absences: [],
          documents: [],
          updatedAt: new Date().toISOString(),
        };
      }

      const supabaseLookupId = rhProfile?.linkedProfileId || routeId;
      const isUuid = /^[0-9a-f-]{36}$/i.test(supabaseLookupId);
      const isProfSlug = supabaseLookupId.startsWith('prof-');
      if (isUuid || isProfSlug) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseLookupId)
          .maybeSingle();
        if (data && rhProfile) {
          rhProfile = enrichProfileFromSupabase(rhProfile, data);
        } else if (data) {
          rhProfile = enrichProfileFromSupabase(
            {
              id: rhProfile?.id ?? routeId,
              companyId,
              fullName: data.full_name || data.email || 'Colaborador',
              document: rhProfile?.document ?? '',
              email: data.email,
              role: data.role,
              sector: data.department,
              absences: [],
              documents: [
                { id: 'd1', name: 'Contrato CLT', type: 'Contrato', status: 'ok' },
                { id: 'd2', name: 'ASO periódico', type: 'Saúde', status: 'vencendo', expiresAt: '2026-08-01' },
              ],
              updatedAt: new Date().toISOString(),
            },
            data,
          );
        }
      }

      if (rhProfile && pontoForColab.length > 0 && !rhProfile.fullName) {
        rhProfile = mergeProfileFromPontoRecord(companyId, pontoForColab[0], rhProfile);
      }

      if (!cancelled) {
        setProfile(rhProfile);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, routeId, records]);

  const history = useMemo(
    () => getPontoRecordsForCollaborator(records, profile?.id ?? routeId),
    [records, profile?.id, routeId],
  );

  const faltas = profile ? countAbsenceDays(profile) : 0;
  const emFerias = profile ? isOnVacation(profile) : false;

  const tabs = [
    { id: 'geral' as const, label: 'Visão geral' },
    { id: 'ponto' as const, label: 'Histórico de ponto' },
    { id: 'ferias' as const, label: 'Férias & ausências' },
    { id: 'docs' as const, label: 'Documentos' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-sm font-bold text-gray-500">Colaborador não encontrado.</p>
        <button type="button" onClick={() => navigate(hubPath)} className="text-xs font-black uppercase text-primary">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="logta-page-content space-y-8 animate-in fade-in duration-500 text-left">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User size={28} />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {emFerias ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">
                  Em férias
                </span>
              ) : (
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase text-green-700">
                  Ativo
                </span>
              )}
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[9px] font-black uppercase text-gray-600">
                {profile.sector || 'Setor não informado'}
              </span>
            </div>
            <h2 className="logta-page-title text-2xl sm:text-3xl">{profile.fullName}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {profile.role || 'Colaborador'} · CPF/matrícula {profile.document || '—'}
            </p>
            {isEquipePerfil ? (
              <p className="mt-2 font-mono text-[10px] font-bold text-gray-400">
                ID RH: {profile.id}
                {profile.linkedProfileId ? ` · Perfil: ${profile.linkedProfileId}` : ''}
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Batidas', value: String(history.length) },
            { label: 'Faltas', value: String(faltas) },
            { label: 'Documentos', value: String(profile.documents.length) },
            {
              label: 'Férias',
              value: profile.vacationStart
                ? `${new Date(profile.vacationStart).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                : '—',
            },
          ].map((k) => (
            <div key={k.label} className="logta-stat-card !p-4">
              <p className="logta-stat-card__label">{k.label}</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary text-xl">{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === t.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isEquipePerfil ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/rh/jornada-ponto/controle-ponto"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:border-primary/30 hover:text-primary"
          >
            <Clock size={14} /> Controle de ponto
          </Link>
          {profile.linkedProfileId?.startsWith('prof-') ||
          routeId.startsWith('prof-') ||
          /comercial|vendas/i.test(profile.role || '') ? (
            <Link
              to={`/crm/comercial/${profile.linkedProfileId || routeId}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-primary/10"
            >
              Carteira comercial CRM
            </Link>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'geral' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="logta-panel-card p-6 sm:p-8">
            <h3 className="logta-card-heading mb-4">Dados do colaborador</h3>
            <dl className="space-y-4 text-sm">
              <InfoRow icon={Mail} label="E-mail" value={profile.email || 'Não informado'} />
              <InfoRow icon={Phone} label="Telefone" value={profile.phone || 'Não informado'} />
              <InfoRow
                icon={MapPin}
                label="Endereço"
                value={
                  [profile.address, profile.city, profile.state].filter(Boolean).join(', ') || 'Não informado'
                }
              />
              <InfoRow icon={Shield} label="Setor" value={profile.sector || '—'} />
              <InfoRow icon={Calendar} label="Admissão" value={profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString('pt-BR') : '—'} />
            </dl>
          </div>
          <div className="logta-panel-card p-6 sm:p-8">
            <h3 className="logta-card-heading mb-4">Últimas batidas</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">Sem registros de ponto ainda.</p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 5).map((r) => (
                  <PontoHistoryItem key={r.id} record={r} />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'ponto' ? (
        <div className="logta-panel-card overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <h3 className="logta-card-heading">Histórico completo de ponto</h3>
            <p className="mt-1 text-xs text-gray-500">Todas as entradas, saídas e pausas — trilha de auditoria.</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-4">
            {history.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Nenhum registro.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((r) => (
                  <PontoHistoryItem key={r.id} record={r} detailed />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'ferias' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="logta-panel-card p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Sun size={18} className="text-amber-500" />
              <h3 className="logta-card-heading">Férias programadas</h3>
            </div>
            {profile.vacationStart && profile.vacationEnd ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">
                  {new Date(profile.vacationStart).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(profile.vacationEnd).toLocaleDateString('pt-BR')}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {emFerias ? 'Colaborador em período de férias agora.' : 'Período agendado.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum período de férias cadastrado.</p>
            )}
          </div>
          <div className="logta-panel-card p-6 sm:p-8">
            <h3 className="logta-card-heading mb-4">Ausências e faltas ({faltas})</h3>
            {profile.absences.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma falta registrada no período.</p>
            ) : (
              <ul className="space-y-2">
                {profile.absences.map((a) => (
                  <li key={a.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-black uppercase text-gray-400">{a.tipo}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(a.date).toLocaleDateString('pt-BR')} — {a.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'docs' ? (
        <div className="logta-panel-card p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="logta-card-heading">Documentos do colaborador</h3>
          </div>
          {profile.documents.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum documento vinculado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-400">{doc.type}</p>
                  {doc.expiresAt ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Validade: {new Date(doc.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  ) : null}
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      doc.status === 'ok'
                        ? 'bg-green-50 text-green-700'
                        : doc.status === 'vencendo'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <dt className="text-[10px] font-black uppercase text-gray-400">{label}</dt>
        <dd className="font-semibold text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

function PontoHistoryItem({ record, detailed }: { record: PontoRecord; detailed?: boolean }) {
  const when = new Date(record.timestamp);
  const Icon =
    record.type === 'entrada'
      ? LogIn
      : record.type === 'saida'
        ? LogOut
        : record.type === 'pausa_inicio'
          ? Pause
          : Play;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">{typeLabels[record.type]}</p>
        <p className="text-[10px] font-bold uppercase text-gray-400">{when.toLocaleString('pt-BR')}</p>
        {detailed ? (
          <p className="mt-1 text-[11px] text-gray-500">
            {record.validated ? 'Validado' : 'Revisar'} · {record.deviceInfo}
            {record.distanceMeters != null ? ` · ${Math.round(record.distanceMeters)}m` : ''}
          </p>
        ) : null}
      </div>
      {!record.validated ? (
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
          Alerta
        </span>
      ) : null}
    </li>
  );
}
