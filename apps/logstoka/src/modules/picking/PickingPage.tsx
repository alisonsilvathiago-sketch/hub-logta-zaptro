import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardCheck,
  History,
  ListPlus,
  Package,
  PackageCheck,
  PackagePlus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { recordPickingSeparatedToQueue } from '@/lib/conferenceHistory';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PICKING, pickingDetailKey } from '@/lib/logstokaDemoSeed';
import {
  downloadPickingLinesCsv,
  printPickingDayList,
  sharePickingLines,
} from '@/lib/printPickingDayList';
import {
  filterPendingLines,
  filterSeparatedLines,
  markPickingPending,
  markPickingSeparated,
  mergePickingLines,
  separatedQueueStats,
  todaySessionLabel,
  type PickRow,
  type PickingLine,
} from '@/lib/pickingSession';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { supabase } from '@/lib/supabase';
import PickingDailyConferenceModal from './PickingDailyConferenceModal';
import PickingDayToolbar from './PickingDayToolbar';
import './pickingPage.css';

const PickingPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { branding } = useLogstokaBranding();
  const demo = isLogstokaDemoCompany(companyId);
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [baseRows, setBaseRows] = useState<PickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [conferenceOpen, setConferenceOpen] = useState(false);
  const [conferenceLines, setConferenceLines] = useState<PickingLine[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const refreshSession = useCallback(() => setTick((n) => n + 1), []);
  const todayLabel = useMemo(() => todaySessionLabel(), []);

  const loadBaseRows = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (demo) {
      setBaseRows(DEMO_PICKING);
      setLoading(false);
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const res = await supabase
      .from('ls_stock_movements')
      .select('marketplace, reference_code, ls_stock_movement_items(sku, quantity, ls_products(name))')
      .eq('company_id', companyId)
      .eq('movement_type', 'exit')
      .gte('created_at', start.toISOString());

    const map = new Map<string, PickRow>();
    for (const mov of res.data ?? []) {
      const movement = mov as unknown as {
        marketplace?: string | null;
        reference_code?: string | null;
        ls_stock_movement_items?: Array<{ sku: string; quantity: number; ls_products?: { name?: string } | null }>;
      };
      for (const item of movement.ls_stock_movement_items ?? []) {
        const key = `${item.sku}-${movement.marketplace}-${movement.reference_code}`;
        const existing = map.get(key);
        if (existing) existing.quantity += Number(item.quantity);
        else {
          map.set(key, {
            sku: item.sku,
            name: item.ls_products?.name ?? item.sku,
            marketplace: movement.marketplace,
            store: movement.reference_code,
            quantity: Number(item.quantity),
          });
        }
      }
    }
    setBaseRows([...map.values()].sort((a, b) => b.quantity - a.quantity));
    setLoading(false);
  }, [companyId, demo]);

  useEffect(() => {
    void loadBaseRows();
  }, [loadBaseRows]);

  useEffect(() => {
    const onUpdate = () => refreshSession();
    window.addEventListener('logstoka:picking-session-updated', onUpdate);
    return () => window.removeEventListener('logstoka:picking-session-updated', onUpdate);
  }, [refreshSession]);

  const allLines = useMemo(() => {
    void tick;
    return mergePickingLines(companyId, baseRows);
  }, [baseRows, companyId, tick]);

  const queueLines = useMemo(() => filterSeparatedLines(allLines), [allLines]);
  const pendingLines = useMemo(() => filterPendingLines(allLines), [allLines]);
  const queueStats = useMemo(() => separatedQueueStats(allLines), [allLines]);

  const { paginatedItems: queuePage, footerProps: queueFooter } = useTablePagination(queueLines, 15, 'pick-queue');
  const { paginatedItems: pendingPage, footerProps: pendingFooter } = useTablePagination(pendingLines, 10, 'pick-pending');

  const selectedQueueLines = useMemo(
    () => queueLines.filter((line) => selectedKeys.has(line.key)),
    [queueLines, selectedKeys],
  );

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === queueLines.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(queueLines.map((line) => line.key)));
    }
  };

  const addToQueue = (line: PickingLine) => {
    if (!companyId) return;
    markPickingSeparated(companyId, line);
    recordPickingSeparatedToQueue({
      companyId,
      actorName,
      actorId: profile?.id,
      sku: line.sku,
      productName: line.name,
      quantity: line.quantity,
      marketplace: line.marketplace,
      store: line.store,
    });
    toast.success('Adicionado à fila de hoje');
    refreshSession();
  };

  const removeFromQueue = (keys: string[]) => {
    if (!companyId || keys.length === 0) return;
    keys.forEach((key) => markPickingPending(companyId, key));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => next.delete(key));
      return next;
    });
    toast.success(keys.length === 1 ? 'Removido da fila' : `${keys.length} itens removidos da fila`);
    refreshSession();
  };

  const addAllPending = () => {
    if (!companyId || pendingLines.length === 0) return;
    pendingLines.forEach((line) => {
      markPickingSeparated(companyId, line);
      recordPickingSeparatedToQueue({
        companyId,
        actorName,
        actorId: profile?.id,
        sku: line.sku,
        productName: line.name,
        quantity: line.quantity,
        marketplace: line.marketplace,
        store: line.store,
      });
    });
    toast.success(`${pendingLines.length} item(ns) na fila de hoje`);
    refreshSession();
  };

  const openConference = (lines: PickingLine[]) => {
    if (lines.length === 0) {
      toast.error('Nenhum item na fila para conferir');
      return;
    }
    setConferenceLines(lines);
    setConferenceOpen(true);
  };

  const handleConferenceFromToolbar = () => {
    const target = selectedQueueLines.length > 0 ? selectedQueueLines : queueLines;
    openConference(target);
  };

  const handlePrint = () => {
    const target = selectedQueueLines.length > 0 ? selectedQueueLines : queueLines;
    if (target.length === 0) return;
    try {
      printPickingDayList(target, branding.companyName ?? 'LogStoka WMS');
    } catch {
      toast.error('Permita pop-ups para imprimir a fila');
    }
  };

  const handleDownload = () => {
    const target = selectedQueueLines.length > 0 ? selectedQueueLines : queueLines;
    if (target.length === 0) return;
    downloadPickingLinesCsv(target);
    toast.success('CSV baixado');
  };

  const handleShare = async () => {
    const target = selectedQueueLines.length > 0 ? selectedQueueLines : queueLines;
    if (target.length === 0) return;
    try {
      await sharePickingLines(target);
      toast.success('Lista copiada / compartilhada');
    } catch {
      toast.error('Não foi possível compartilhar');
    }
  };

  const handleConferenceDone = () => {
    setSelectedKeys(new Set());
    refreshSession();
  };

  return (
    <div className="ls-picking-page space-y-5">
      <LogstokaPageHeader
        eyebrow="Expedição"
        icon={<ClipboardCheck size={20} strokeWidth={2.25} />}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Conferência do dia
            <span className="ls-pick-day-badge">
              <CalendarDays size={14} aria-hidden />
              {todayLabel}
            </span>
          </span>
        }
        subtitle="Fila dos pedidos separados hoje. Selecione, confira e dê baixa — ao concluir, os itens somem da lista e o estoque é atualizado automaticamente."
        actions={
          <>
            <Link to={LOGSTOKA_ROUTES.PICKING_HISTORY} className="ls-btn-secondary inline-flex items-center gap-2 text-sm">
              <History size={16} />
              Histórico
            </Link>
            <button
              type="button"
              className="ls-btn-primary inline-flex items-center gap-2 text-sm"
              disabled={queueLines.length === 0}
              onClick={() => openConference(queueLines)}
            >
              <ClipboardCheck size={16} />
              Dar baixa na fila
            </button>
          </>
        }
      />

      <LogstokaKpiStrip
        items={[
          {
            label: 'Separados hoje',
            value: queueStats.skus,
            hint: `${queueStats.units.toLocaleString('pt-BR')} un. na fila`,
          },
          {
            label: 'Canais na fila',
            value: queueStats.channels,
          },
          {
            label: 'Selecionados',
            value: selectedQueueLines.length,
            hint: selectedQueueLines.length ? `${selectedQueueLines.reduce((s, l) => s + l.quantity, 0)} un.` : 'marque na tabela',
          },
          {
            label: 'Disponíveis hoje',
            value: queueStats.pendingToAdd,
            hint: 'ainda não na fila',
          },
        ]}
      />

      <section className="ls-pick-card">
        <div className="ls-pick-card__head">
          <div>
            <h2 className="ls-pick-card__title">
              <Package size={18} aria-hidden />
              Fila de separados hoje
            </h2>
            <p className="ls-pick-card__desc">
              {queueLines.length
                ? `${queueLines.length} SKU(s) · ${queueStats.units.toLocaleString('pt-BR')} un. aguardando conferência e baixa`
                : 'Nenhum pedido na fila — adicione separações abaixo ou na operação do dia'}
            </p>
          </div>
          <PickingDayToolbar
            selectedCount={selectedQueueLines.length}
            queueCount={queueLines.length}
            loading={loading}
            onRefresh={() => void loadBaseRows()}
            onConference={handleConferenceFromToolbar}
            onPrint={handlePrint}
            onDownload={handleDownload}
            onShare={() => void handleShare()}
            onRemoveSelected={() => removeFromQueue(selectedQueueLines.map((line) => line.key))}
          />
        </div>

        {queueLines.length === 0 ? (
          <div className="ls-pick-empty">
            <PackageCheck size={36} className="text-orange-400" aria-hidden />
            <p className="mt-3 font-bold text-[#383838]">Fila vazia para hoje</p>
            <p className="mt-1 max-w-md text-sm text-[#737373]">
              Separe os pedidos do dia na tabela abaixo. Eles entram aqui até você conferir e dar baixa.
            </p>
          </div>
        ) : (
          <>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        className="ls-pick-checkbox"
                        aria-label="Selecionar todos da fila"
                        checked={queueLines.length > 0 && selectedKeys.size === queueLines.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>SKU</th>
                    <th>Produto</th>
                    <th>Canal</th>
                    <th>Loja</th>
                    <th>Qtd.</th>
                    <th aria-label="Ações" className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {queuePage.map((line) => (
                    <tr key={line.key} className={selectedKeys.has(line.key) ? 'ls-pick-row--selected' : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          className="ls-pick-checkbox"
                          checked={selectedKeys.has(line.key)}
                          aria-label={`Selecionar ${line.name}`}
                          onChange={() => toggleSelect(line.key)}
                        />
                      </td>
                      <td className="font-bold">{line.sku}</td>
                      <td>{line.name}</td>
                      <td>
                        {line.marketplace ? (
                          <MarketplaceLogo marketplace={line.marketplace} size={22} showLabel linkToHub />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{line.store || '—'}</td>
                      <td className="font-black text-orange-700">{line.quantity}</td>
                      <td>
                        <Link
                          to={`/app/picking/${pickingDetailKey(line)}`}
                          className="ls-pick-detail-link"
                          aria-label={`Detalhe ${line.name}`}
                        >
                          →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LogstokaTableFooter {...queueFooter} itemLabel="itens na fila" />
          </>
        )}
      </section>

      {pendingLines.length > 0 ? (
        <section className="ls-pick-card ls-pick-card--secondary">
          <div className="ls-pick-card__head">
            <div>
              <h2 className="ls-pick-card__title">
                <PackagePlus size={18} aria-hidden />
                Disponíveis para separar hoje
              </h2>
              <p className="ls-pick-card__desc">
                {pendingLines.length} SKU(s) do dia ainda fora da fila — adicione para conferir depois
              </p>
            </div>
            <button type="button" className="ls-pick-add-all-btn" onClick={addAllPending}>
              <ListPlus size={16} strokeWidth={2.25} aria-hidden />
              Adicionar todos à fila
            </button>
          </div>

          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Canal</th>
                  <th>Loja</th>
                  <th>Qtd.</th>
                  <th aria-label="Adicionar à fila" className="w-16 text-right" />
                </tr>
              </thead>
              <tbody>
                {pendingPage.map((line) => (
                  <tr key={line.key}>
                    <td className="font-bold">{line.sku}</td>
                    <td>{line.name}</td>
                    <td>
                      {line.marketplace ? (
                        <MarketplaceLogo marketplace={line.marketplace} size={22} showLabel linkToHub />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{line.store || '—'}</td>
                    <td className="font-black text-[#525252]">{line.quantity}</td>
                    <td className="ls-pick-add-cell">
                      <LogstokaIconTooltip label="Adicionar à fila de hoje">
                        <button
                          type="button"
                          className="ls-pick-add-btn"
                          aria-label={`Adicionar ${line.name} à fila`}
                          onClick={() => addToQueue(line)}
                        >
                          <ListPlus size={17} strokeWidth={2.25} aria-hidden />
                          <span className="ls-pick-add-btn__label">Na fila</span>
                        </button>
                      </LogstokaIconTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...pendingFooter} itemLabel="disponíveis" />
        </section>
      ) : null}

      <PickingDailyConferenceModal
        open={conferenceOpen}
        lines={conferenceLines}
        onClose={() => setConferenceOpen(false)}
        onChanged={handleConferenceDone}
      />
    </div>
  );
};

export default PickingPage;
