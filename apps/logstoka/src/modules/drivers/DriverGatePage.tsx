import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ClipboardList, Search, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DriverGateRegisterModal, {
  type DriverGateFormState,
} from '@/components/drivers/DriverGateRegisterModal';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import Modal from '@/components/ui/Modal';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useWarehouses } from '@/hooks/useCatalog';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { appendDriverGate, filterDriverGates, loadMergedDriverGates, type DriverGatePeriod } from '@/lib/demoDriverGateStore';
import { upsertDemoDriver } from '@/lib/demoDriverStore';
import type { DemoDriverGateRecord } from '@/lib/logstokaDemoSeed';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';

const PERIOD_OPTIONS: { value: DriverGatePeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
];

const emptyForm = (warehouseId: string, direction: 'entry' | 'exit' = 'entry'): DriverGateFormState => ({
  direction,
  warehouseId,
  driverId: '',
  driverName: '',
  driverCpf: '',
  companyName: '',
  companyCnpj: '',
  vehiclePlate: '',
  productDescription: '',
  destination: '',
  registeredByName: '',
  notes: '',
  signatureDataUrl: '',
  signatureSignedAt: '',
  confirmed: false,
});

const directionLabel = (d: DemoDriverGateRecord['direction']) => (d === 'entry' ? 'Entrada' : 'Saída');

const DriverGatePage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { visibleWarehouses, assignedWarehouseId } = useLogstokaWarehouseScope();
  const { warehouses: allWarehouses } = useWarehouses();
  const demo = isLogstokaDemoCompany(companyId);

  const physicalWarehouses = useMemo(
    () =>
      visibleWarehouses.filter((w) => w.type === 'physical' && w.is_active).length > 0
        ? visibleWarehouses.filter((w) => w.type === 'physical' && w.is_active)
        : allWarehouses.filter((w) => w.type === 'physical' && w.is_active),
    [visibleWarehouses, allWarehouses],
  );

  const defaultWarehouse = assignedWarehouseId ?? physicalWarehouses[0]?.id ?? '';

  const [records, setRecords] = useState<DemoDriverGateRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<DriverGateFormState>(() => emptyForm(defaultWarehouse));
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<DemoDriverGateRecord | null>(null);

  const [directionFilter, setDirectionFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [period, setPeriod] = useState<DriverGatePeriod>('last30');
  const [query, setQuery] = useState('');

  const reload = useCallback(() => {
    if (!companyId) return;
    setRecords(loadMergedDriverGates(companyId));
  }, [companyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener('logstoka:demo-driver-gates-updated', onUpdate);
    return () => window.removeEventListener('logstoka:demo-driver-gates-updated', onUpdate);
  }, [reload]);

  const filtered = useMemo(
    () =>
      filterDriverGates(records, {
        direction: directionFilter,
        warehouseId: warehouseFilter || undefined,
        query,
        period,
      }),
    [records, directionFilter, warehouseFilter, query, period],
  );

  const { paginatedItems, footerProps } = useTablePagination(filtered);

  const kpis = useMemo(() => {
    const today = filterDriverGates(records, { period: 'today', warehouseId: warehouseFilter || undefined });
    return {
      entriesToday: today.filter((r) => r.direction === 'entry').length,
      exitsToday: today.filter((r) => r.direction === 'exit').length,
      total: filtered.length,
    };
  }, [records, filtered.length, warehouseFilter]);

  const openModal = (direction: 'entry' | 'exit' = 'entry') => {
    setForm(emptyForm(defaultWarehouse, direction));
    setModalOpen(true);
  };

  const submitGate = async () => {
    if (!companyId || !demo) {
      toast.error('Registro de portaria disponível no modo demo');
      return;
    }
    if (!form.warehouseId) {
      toast.error('Selecione o CD');
      return;
    }
    if (!form.driverName.trim()) {
      toast.error('Informe o motorista');
      return;
    }
    if (!form.driverCpf.trim()) {
      toast.error('Informe o CPF');
      return;
    }
    if (!form.companyName.trim() || !form.companyCnpj.trim()) {
      toast.error('Informe empresa e CNPJ');
      return;
    }
    if (!form.vehiclePlate.trim()) {
      toast.error('Informe a placa do veículo');
      return;
    }
    if (!form.registeredByName.trim()) {
      toast.error('Informe quem registrou na portaria');
      return;
    }
    if (!form.signatureDataUrl) {
      toast.error('Assinatura do motorista é obrigatória');
      return;
    }
    if (!form.confirmed) {
      toast.error('Confirme o termo de registro');
      return;
    }

    setSaving(true);
    try {
      const driver = upsertDemoDriver(companyId, {
        full_name: form.driverName.trim(),
        cpf: form.driverCpf.trim(),
        company_name: form.companyName.trim(),
        company_cnpj: form.companyCnpj.trim(),
        warehouse_id: form.warehouseId,
      });

      appendDriverGate(companyId, {
        direction: form.direction,
        warehouse_id: form.warehouseId,
        driver_id: driver.id,
        driver_name: form.driverName.trim(),
        driver_cpf: form.driverCpf.trim(),
        company_name: form.companyName.trim(),
        company_cnpj: form.companyCnpj.trim(),
        vehicle_plate: form.vehiclePlate.trim(),
        product_description: form.productDescription,
        destination: form.destination,
        signature_data_url: form.signatureDataUrl,
        signed_at: form.signatureSignedAt || new Date().toISOString(),
        registered_by_name: form.registeredByName.trim(),
        notes: form.notes,
      });

      toast.success(`${directionLabel(form.direction)} registrada com assinatura`);
      setModalOpen(false);
      setForm(emptyForm(defaultWarehouse));
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        eyebrow="Operação WMS"
        icon={<Truck size={20} strokeWidth={2.25} />}
        title="Portaria — motoristas"
        subtitle="Entrada e saída com identificação, placa, produto/destino e assinatura digital. Histórico empresa-wide."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="ls-btn-primary text-sm" onClick={() => openModal('entry')}>
              <ArrowDownLeft size={15} className="mr-1 inline" />
              Entrada
            </button>
            <button type="button" className="ls-btn-secondary text-sm" onClick={() => openModal('exit')}>
              <ArrowUpRight size={15} className="mr-1 inline" />
              Saída
            </button>
          </div>
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Entradas hoje', value: kpis.entriesToday },
          { label: 'Saídas hoje', value: kpis.exitsToday },
          { label: 'Registros no filtro', value: kpis.total },
        ]}
      />

      <section className="ls-page-table">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[140px]">
            <label className="ls-label">Tipo</label>
            <select className="ls-input" value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as typeof directionFilter)}>
              <option value="all">Entrada e saída</option>
              <option value="entry">Só entradas</option>
              <option value="exit">Só saídas</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="ls-label">CD</label>
            <select className="ls-input" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              <option value="">Todos os CDs</option>
              {physicalWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="ls-label">Período</label>
            <select className="ls-input" value={period} onChange={(e) => setPeriod(e.target.value as DriverGatePeriod)}>
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="ls-label">Buscar</label>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
              <input
                className="ls-input pl-9"
                placeholder="Nome, CPF, placa, empresa…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data / hora</th>
                <th>CD</th>
                <th>Motorista</th>
                <th>Empresa</th>
                <th>Placa</th>
                <th>Produto / destino</th>
                <th>Registrado por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm font-semibold text-[#737373]">
                    Nenhum registro no período selecionado.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className={`ls-badge ${row.direction === 'entry' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'}`}
                      >
                        {directionLabel(row.direction)}
                      </span>
                    </td>
                    <td>{new Date(row.created_at).toLocaleString('pt-BR')}</td>
                    <td>{row.warehouse_name}</td>
                    <td className="text-sm font-semibold">
                      {row.driver_name}
                      <div className="text-xs font-medium text-[#737373]">{row.driver_cpf}</div>
                    </td>
                    <td className="text-xs">
                      {row.company_name}
                      <div className="text-[#737373]">{row.company_cnpj}</div>
                    </td>
                    <td>{row.vehicle_plate}</td>
                    <td className="text-xs">
                      {row.product_description || '—'}
                      {row.destination ? <div className="text-[#737373]">→ {row.destination}</div> : null}
                    </td>
                    <td className="text-xs">{row.registered_by_name}</td>
                    <td>
                      <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => setDetail(row)}>
                        <ClipboardList size={12} className="mr-1 inline" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} />
      </section>

      <DriverGateRegisterModal
        open={modalOpen}
        saving={saving}
        companyId={companyId}
        form={form}
        warehouses={physicalWarehouses}
        defaultOperatorName={profile?.full_name ?? ''}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => void submitGate()}
      />

      <Modal
        open={Boolean(detail)}
        title={detail ? `${directionLabel(detail.direction)} · ${detail.driver_name}` : 'Detalhes'}
        subtitle={detail ? new Date(detail.created_at).toLocaleString('pt-BR') : undefined}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">CD</dt>
                <dd className="font-bold">{detail.warehouse_name}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">Placa</dt>
                <dd className="font-bold">{detail.vehicle_plate}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">Empresa</dt>
                <dd className="font-bold">
                  {detail.company_name}
                  <div className="text-xs font-medium text-[#737373]">{detail.company_cnpj}</div>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">Registrado por</dt>
                <dd className="font-bold">{detail.registered_by_name}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">Produto / carga</dt>
                <dd className="font-bold">{detail.product_description || '—'}</dd>
              </div>
              {detail.destination ? (
                <div className="col-span-2">
                  <dt className="text-[10px] font-extrabold uppercase text-[#a3a3a3]">Destino</dt>
                  <dd className="font-bold">{detail.destination}</dd>
                </div>
              ) : null}
            </dl>
            {detail.signature_data_url ? (
              <div>
                <p className="mb-2 text-[10px] font-extrabold uppercase text-[#a3a3a3]">Assinatura</p>
                <img
                  src={detail.signature_data_url}
                  alt="Assinatura do motorista"
                  className="max-h-32 rounded-lg border border-[#ececec] bg-white"
                />
                <p className="mt-2 text-xs font-semibold text-[#737373]">
                  Assinado em {new Date(detail.signed_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold text-[#737373]">Sem assinatura digital neste registro demo.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default DriverGatePage;
