import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Truck,
  Users,
  UserX,
} from 'lucide-react';
import { LogtaDataTable } from '../../../components/LogtaDataTable';
import { LogtaDataTableExportActions } from '../../../components/LogtaExportToolbar';
import { LogtaKpiStrip } from '../../../components/LogtaKpiStrip';
import { LogtaEmptyState } from '../../../components/EmptyState';
import { useTenant } from '../../../contexts/TenantContext';
import { useLogtaProfile } from '../../../contexts/LogtaProfileContext';
import type { MotoristaRow } from '../../../contexts/OperationalDataContext';
import {
  buildEquipeInteligenteRows,
  equipeAvatarUrl,
  equipeResumoStats,
  type EquipeInteligenteRow,
} from '../lib/equipeInteligente';
import { equipeProfileUrl, formatEquipeDisplayId, resolveEquipeListRouteId } from '../lib/equipeRouteId';
import type { RhColaboradorListItem } from '../lib/mergeRhColaboradores';

const JORNADA_STYLES: Record<
  EquipeInteligenteRow['jornadaStatus'],
  { bg: string; text: string; dot: string }
> = {
  em_jornada: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  pausa: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  fora: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  ferias: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
  sem_registro: { bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500' },
};

function formatUltimoPonto(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EquipeColaboradorAvatar({
  row,
  size = 'md',
}: {
  row: Pick<EquipeInteligenteRow, 'full_name' | 'avatar_url' | 'id'>;
  size?: 'sm' | 'md';
}) {
  const [failed, setFailed] = React.useState(false);
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const src = equipeAvatarUrl(row);

  return (
    <div
      className={`${dim} shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-sm`}
    >
      {!failed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <Users size={size === 'sm' ? 14 : 20} />
        </div>
      )}
    </div>
  );
}

export function EquipeInteligenteView({
  colaboradores,
  motoristas,
  loading = false,
  onNewColaborador,
  canManageEquipe,
}: {
  colaboradores: RhColaboradorListItem[];
  motoristas: MotoristaRow[];
  loading?: boolean;
  onNewColaborador: () => void;
  canManageEquipe: boolean;
}) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const [search, setSearch] = React.useState('');

  const rows = useMemo(
    () => buildEquipeInteligenteRows(config?.id, colaboradores, motoristas),
    [config?.id, colaboradores, motoristas],
  );

  const resumo = useMemo(() => equipeResumoStats(rows), [rows]);

  const filtered = rows.filter((member) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      member.full_name.toLowerCase().includes(q) ||
      String(member.email ?? '').toLowerCase().includes(q) ||
      String(member.role ?? '').toLowerCase().includes(q) ||
      String(member.department ?? '').toLowerCase().includes(q) ||
      member.insights.some((i) => i.toLowerCase().includes(q))
    );
  });

  return (
    <LogtaDataTable
      title="Equipe — visão inteligente RH"
      filenameBase="rh-equipe"
      loading={loading}
      loadingLabel="Carregando equipe…"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nome, cargo, e-mail ou situação..."
      filteredItems={filtered.length}
      totalItems={colaboradores.length}
      filtersSummary={
        search.trim()
          ? `Busca: "${search.trim()}"`
          : 'Painel unificado — ponto, documentos e operação'
      }
      exportMeta={{
        companyName: config.companyName,
        generatedBy: profile?.full_name?.trim() || 'RH Logta',
      }}
      getExportData={(scope) => {
        const data = scope === 'all' ? rows : filtered;
        return {
          title: 'Equipe RH — Logta',
          filenameBase: scope === 'all' ? 'rh-equipe-todos' : 'rh-equipe-filtrado',
          columns: [
            'Colaborador',
            'Cargo',
            'Jornada',
            'Alertas',
            'Insights',
          ],
          rows: data.map((m) => [
            m.full_name,
            m.role || '—',
            m.jornadaLabel,
            m.alertasDocs + (m.cnhVencendo ? 1 : 0) + m.faltasMes,
            m.insights.join(' | '),
          ]),
        };
      }}
      toolbarBelow={
        <LogtaKpiStrip
          items={[
            { label: 'Colaboradores', value: resumo.total, icon: Users },
            {
              label: 'Em jornada',
              value: resumo.emJornada,
              hint: 'Entrada ou pausa hoje',
              icon: Clock,
            },
            { label: 'Sem ponto hoje', value: resumo.semRegistro, icon: UserX },
            { label: 'Com alerta', value: resumo.alertas, icon: AlertTriangle },
          ]}
        />
      }
      hideExportActions
      renderInlineActions={(actions) => (
        <LogtaDataTableExportActions
          {...actions}
          trailing={
            canManageEquipe ? (
              <button
                type="button"
                onClick={onNewColaborador}
                title="Novo colaborador"
                aria-label="Novo colaborador"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:opacity-90"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            ) : null
          }
        />
      )}
      filterSlot={
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-500 shadow-sm transition-all hover:text-gray-900"
        >
          <Filter size={18} /> Filtrar
        </button>
      }
      empty={
        !loading && colaboradores.length === 0 ? (
          <LogtaEmptyState
            type="rh"
            onAction={canManageEquipe ? onNewColaborador : undefined}
          />
        ) : undefined
      }
    >
      {colaboradores.length > 0 ? (
        <>
          {!canManageEquipe ? (
            <p className="mx-8 mt-6 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs font-semibold text-blue-900">
              A equipe é cadastrada pelo RH da transportadora. Quando novos colaboradores forem
              incluídos, todos os módulos passam a exibir os mesmos dados.
            </p>
          ) : null}
          {filtered.length > 0 ? (
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Colaborador
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Jornada
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Situação
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Alertas
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Último ponto
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const style = JORNADA_STYLES[row.jornadaStatus];
                  const alertCount =
                    row.alertasDocs + (row.cnhVencendo ? 1 : 0) + row.faltasMes;
                  return (
                    <tr
                      key={resolveEquipeListRouteId(row)}
                      onClick={() => {
                        const routeId = resolveEquipeListRouteId({
                          ...row,
                          document: row.rhProfile?.document,
                        });
                        navigate(equipeProfileUrl(routeId));
                      }}
                      className="group cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <EquipeColaboradorAvatar row={row} />
                          <div className="min-w-0">
                            <p className="truncate py-[30px] text-[12px] font-bold tracking-normal text-gray-900">
                              {row.full_name}
                            </p>
                            <p className="font-mono text-[9px] font-black text-primary">
                              ID {formatEquipeDisplayId(resolveEquipeListRouteId(row))}
                            </p>
                            <p className="truncate text-[9px] font-bold uppercase tracking-normal text-gray-500">
                              {row.role || 'Colaborador'}
                              {row.department ? ` · ${row.department}` : ''}
                            </p>
                            {row.isMotorista ? (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                                <Truck size={10} /> Motorista
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-normal ${style.bg} ${style.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {row.jornadaLabel}
                        </span>
                      </td>
                      <td className="max-w-xs px-8 py-5">
                        <p className="line-clamp-2 text-[10px] font-medium leading-snug tracking-normal text-gray-600">
                          {row.insights[0] ?? '—'}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {row.alertasDocs > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[9px] font-bold uppercase text-orange-800">
                              <AlertTriangle size={10} /> {row.alertasDocs} doc
                            </span>
                          ) : null}
                          {row.faltasMes > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold uppercase text-red-700">
                              <UserX size={10} /> {row.faltasMes} falta
                            </span>
                          ) : null}
                          {row.cnhVencendo ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase text-amber-800">
                              CNH
                            </span>
                          ) : null}
                          {alertCount === 0 ? (
                            <span className="text-[11px] font-semibold text-gray-400">Nenhum</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <EquipeColaboradorAvatar row={row} size="sm" />
                          <div className="min-w-0">
                            {row.lastPontoAt ? (
                              <>
                                <p className="text-[10px] font-black uppercase tracking-normal text-primary">
                                  {row.lastPontoLabel ?? 'Batida'}
                                </p>
                                <p className="flex items-center gap-1 text-[10px] font-bold text-gray-800">
                                  <Clock size={12} className="shrink-0 text-gray-400" />
                                  {formatUltimoPonto(row.lastPontoAt)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] font-bold text-gray-500">Sem batida</p>
                                <p className="text-[10px] font-medium text-gray-400">Nenhum registro</p>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-normal text-primary group-hover:underline">
                          Ver perfil <ChevronRight size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-12 text-center text-sm font-semibold text-gray-500">
              Nenhum colaborador encontrado para esta busca.
            </p>
          )}
        </>
      ) : null}
    </LogtaDataTable>
  );
}
