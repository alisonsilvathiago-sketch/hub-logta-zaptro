import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Loader2, Plus, Wrench } from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../lib/seed';
import { NovoManutencaoModal } from '../components/NovoManutencaoModal';
import {
  loadFrotaManutencoes,
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
  loading?: boolean;
};

export function FrotaManutencaoView({ veiculos, loading }: Props) {
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [registros, setRegistros] = useState<FrotaManutencaoRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(() => {
    setRegistros(loadFrotaManutencoes(companyId));
  }, [companyId]);

  useEffect(() => {
    reload();
    const onSync = () => reload();
    window.addEventListener('logta-operational-sync', onSync);
    return () => window.removeEventListener('logta-operational-sync', onSync);
  }, [reload]);

  const emOficina = veiculos.filter((v) => v.status === 'manutencao' || v.status === 'maintenance');

  const totais = useMemo(() => {
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    let totalGeral = 0;
    let totalMes = 0;
    registros.forEach((r) => {
      totalGeral += r.valor;
      const d = new Date(r.realizadoEm);
      if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) totalMes += r.valor;
    });
    return { totalGeral, totalMes, qtd: registros.length };
  }, [registros]);

  const veiculoOptions = veiculos.map((v) => ({
    id: v.id,
    placa: v.placa,
    modelo: v.modelo,
  }));

  return (
    <>
      <div className="space-y-6 py-[30px] text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="logta-panel-card--operational flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">Central de manutenção</p>
            <h3 className="logta-card-heading text-xl text-gray-900 sm:text-2xl">
              Óleo, pneus, filtros, motor e revisões
            </h3>
            <p className="mt-2 text-sm font-medium text-gray-600">
              Todos os serviços da frota em um só lugar, com lançamento automático no Financeiro.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Plus size={18} /> Lançar manutenção
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Gasto no mês</p>
            <p className="logta-finance-stat-card__value text-red-500">
              R$ {totais.totalMes.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Total manutenção</p>
            <p className="logta-finance-stat-card__value">
              R$ {totais.totalGeral.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="logta-finance-stat-card">
            <p className="logta-finance-stat-card__label">Lançamentos</p>
            <p className="logta-finance-stat-card__value text-primary">{totais.qtd}</p>
            <Link
              to="/financeiro/pagar"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline"
            >
              <DollarSign size={12} /> Ver no Financeiro
            </Link>
          </div>
        </div>

        {emOficina.length > 0 ? (
          <div className="rounded-[20px] border border-red-100 bg-red-50/60 p-6">
            <h4 className="logta-card-heading mb-4 text-red-800">Veículos em manutenção</h4>
            <ul className="space-y-2">
              {emOficina.map((v) => (
                <li key={v.id}>
                  <Link
                    to={`/frota/manutencao/${encodeURIComponent(v.placa)}`}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-red-100 bg-white px-4 py-3 transition-all hover:border-primary/30"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{v.placa}</p>
                      <p className="text-[10px] font-bold uppercase text-gray-500">{v.modelo}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-red-600">Em oficina</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-[40px] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="logta-card-heading">Histórico de manutenções</h3>
            <span className="rounded-[14px] bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-normal text-[#F5F5F5] shadow-none">
              {registros.length} registros
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : registros.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
              <Wrench className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm font-medium text-gray-500">Nenhum lançamento ainda.</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                <Plus size={16} /> Primeiro lançamento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.map((r) => (
                <Link
                  key={r.id}
                  to={`/frota/manutencao/${encodeURIComponent(r.placa)}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 transition-all hover:border-primary/20 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary">
                        {tipoManutencaoLabel(r.tipo)}
                      </span>
                      <span className="text-sm font-black text-gray-900">{r.placa}</span>
                      <span className="text-[10px] font-bold uppercase text-gray-400">{r.modelo}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      Realizado por <strong>{r.responsavel}</strong>
                      {r.motivo ? ` · ${r.motivo}` : r.observacao ? ` · ${r.observacao}` : ''}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">
                      {new Date(r.realizadoEm).toLocaleDateString('pt-BR')}
                      {r.financeTransactionId ? ' · Vinculado ao Financeiro' : ''}
                    </p>
                  </div>
                  <p className="text-lg font-black text-red-500">
                    R$ {r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <NovoManutencaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={companyId}
        veiculos={veiculoOptions}
        onSaved={reload}
      />
    </>
  );
}
