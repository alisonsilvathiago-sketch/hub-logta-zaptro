import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Plus, Truck, User, Wrench } from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../lib/seed';
import { NovoManutencaoModal } from '../components/NovoManutencaoModal';
import {
  loadFrotaManutencoes,
  manutencoesByPlaca,
  normalizePlaca,
  tipoManutencaoLabel,
  type FrotaManutencaoRecord,
} from '../frotaManutencaoStorage';

type VeiculoRow = {
  id: string;
  placa: string;
  modelo: string;
  status?: string;
};

type Props = {
  veiculos: VeiculoRow[];
};

export function FrotaManutencaoVeiculoDetailView({ veiculos }: Props) {
  const { placa: placaParam } = useParams<{ placa: string }>();
  const placaKey = normalizePlaca(placaParam);
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [registros, setRegistros] = useState<FrotaManutencaoRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const veiculo = useMemo(
    () => veiculos.find((v) => normalizePlaca(v.placa) === placaKey),
    [veiculos, placaKey],
  );

  const reload = useCallback(() => {
    setRegistros(manutencoesByPlaca(companyId, placaKey));
  }, [companyId, placaKey]);

  useEffect(() => {
    reload();
    const onSync = () => reload();
    window.addEventListener('logta-operational-sync', onSync);
    return () => window.removeEventListener('logta-operational-sync', onSync);
  }, [reload]);

  const totais = useMemo(() => {
    let total = 0;
    registros.forEach((r) => {
      total += r.valor;
    });
    const ultima = registros[0];
    return { total, qtd: registros.length, ultima };
  }, [registros]);

  const emOficina =
    veiculo?.status === 'manutencao' || veiculo?.status === 'maintenance';

  const veiculoOptions = veiculos.map((v) => ({
    id: v.id,
    placa: v.placa,
    modelo: v.modelo,
  }));

  if (!placaKey) {
    return (
      <div className="py-[30px] text-left">
        <button
          type="button"
          onClick={() => navigate('/frota/manutencao')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar à manutenção
        </button>
        <p className="mt-6 text-sm text-gray-500">Placa inválida.</p>
      </div>
    );
  }

  const modelo = veiculo?.modelo || registros[0]?.modelo || '—';

  return (
    <>
      <div className="space-y-6 py-[30px] text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          type="button"
          onClick={() => navigate('/frota/manutencao')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Voltar à central de manutenção
        </button>

        <div className="logta-panel-card--operational flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              <Truck size={26} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-normal text-primary">
                Histórico de manutenção do veículo
              </p>
              <h2 className="logta-card-heading text-2xl text-gray-900">{placaKey}</h2>
              <p className="mt-1 text-sm font-medium text-gray-600">{modelo}</p>
              {emOficina ? (
                <span className="mt-2 inline-block rounded-lg bg-red-100 px-3 py-1 text-[10px] font-black uppercase text-red-700">
                  Em oficina agora
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Plus size={18} /> Novo lançamento
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Total investido</p>
            <p className="logta-finance-stat-card__value text-red-500">
              R$ {totais.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Serviços realizados</p>
            <p className="logta-finance-stat-card__value text-primary">{totais.qtd}</p>
          </div>
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Último serviço</p>
            <p className="logta-finance-stat-card__value text-sm sm:text-lg">
              {totais.ultima
                ? new Date(totais.ultima.realizadoEm).toLocaleDateString('pt-BR')
                : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-[40px] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <h3 className="logta-card-heading mb-6">Tudo que foi feito neste veículo</h3>

          {registros.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
              <Wrench className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm font-medium text-gray-500">
                Nenhum lançamento para {placaKey} ainda.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                <Plus size={16} /> Registrar primeira manutenção
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {registros.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 transition-all hover:border-primary/20 hover:bg-white"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase text-primary">
                      {tipoManutencaoLabel(r.tipo)}
                    </span>
                    <p className="text-xl font-black text-red-500">
                      R$ {r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400">
                        <Calendar size={12} /> Quando foi
                      </dt>
                      <dd className="text-sm font-bold text-gray-900">
                        {new Date(r.realizadoEm).toLocaleString('pt-BR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400">
                        <User size={12} /> Quem fez
                      </dt>
                      <dd className="text-sm font-bold text-gray-900">{r.responsavel}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="mb-1 text-[10px] font-black uppercase text-gray-400">
                        Problema / motivo da manutenção
                      </dt>
                      <dd className="text-sm font-medium text-gray-700">
                        {r.motivo || r.observacao || '—'}
                      </dd>
                    </div>
                    {r.observacao && r.motivo ? (
                      <div className="sm:col-span-2">
                        <dt className="mb-1 text-[10px] font-black uppercase text-gray-400">
                          Detalhes adicionais
                        </dt>
                        <dd className="text-sm font-medium text-gray-600">{r.observacao}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400">
                        <DollarSign size={12} /> Pagamento
                      </dt>
                      <dd className="text-sm font-bold text-gray-900">
                        {r.financeTransactionId ? (
                          <Link
                            to="/financeiro/pagar"
                            className="text-primary hover:underline"
                          >
                            Lançado no Financeiro
                          </Link>
                        ) : (
                          <span className="text-amber-600">Pendente de vínculo</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>

        {veiculo ? (
          <Link
            to={`/frota/veiculos/${encodeURIComponent(veiculo.placa)}`}
            className="inline-flex text-xs font-bold text-primary hover:underline"
          >
            Ver ficha completa do veículo →
          </Link>
        ) : null}
      </div>

      <NovoManutencaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={companyId}
        veiculos={veiculoOptions}
        initialPlaca={placaKey}
        onSaved={reload}
      />
    </>
  );
}
