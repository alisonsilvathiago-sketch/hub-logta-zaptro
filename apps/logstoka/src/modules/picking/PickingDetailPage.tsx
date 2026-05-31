import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageCheck, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { recordPickingSeparatedToQueue } from '@/lib/conferenceHistory';
import { printPickingDayList } from '@/lib/printPickingDayList';
import { resolvePickingRowByKey } from '@/lib/resolvePickingRow';
import {
  markPickingSeparated,
  mergePickingLines,
  type PickingLine,
  type PickRow,
} from '@/lib/pickingSession';
import { MARKETPLACE_LABELS } from '@/types';

const PickingDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { key } = useParams<{ key: string }>();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { branding } = useLogstokaBranding();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const [row, setRow] = useState<PickRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key || !companyId) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void resolvePickingRowByKey(companyId, key)
      .then(setRow)
      .finally(() => setLoading(false));
  }, [key, companyId]);

  const line: PickingLine | null = row
    ? mergePickingLines(companyId, [row])[0] ?? null
    : null;

  const confirmSeparation = () => {
    if (!companyId || !line) return;
    if (line.status === 'conferenced') {
      toast.error('Item já conferido');
      return;
    }
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
    toast.success('Separado — incluído na conferência diária');
    navigate('/app/picking');
  };

  const handlePrint = () => {
    if (!line) return;
    printPickingDayList([line], branding.companyName ?? 'LogStoka WMS');
    toast.success('Lista de separação enviada para impressão');
  };

  if (loading) {
    return (
      <LogstokaDetailPageLayout backTo="/app/picking" title="Separação" subtitle="Carregando…">
        <div className="ls-card text-sm text-slate-500">Carregando item…</div>
      </LogstokaDetailPageLayout>
    );
  }

  if (!row || !line) {
    return (
      <LogstokaDetailPageLayout backTo="/app/picking" title="Separação" subtitle="Item não encontrado">
        <div className="ls-card text-sm text-slate-500">Item de picking não encontrado na fila de hoje.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo="/app/picking"
      backLabel="Voltar para separação"
      title={row.name}
      subtitle={`SKU ${row.sku} · ${MARKETPLACE_LABELS[row.marketplace as keyof typeof MARKETPLACE_LABELS] ?? row.marketplace ?? '—'}`}
      actions={
        <>
          <button type="button" className="ls-btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir picking list
          </button>
          <button type="button" className="ls-btn-primary" onClick={confirmSeparation}>
            <PackageCheck size={16} />
            Confirmar separação
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['SKU', row.sku],
          ['Loja', row.store || '—'],
          ['Quantidade a separar', `${row.quantity} un.`],
          ['Canal', MARKETPLACE_LABELS[row.marketplace as keyof typeof MARKETPLACE_LABELS] ?? row.marketplace ?? '—'],
          ['Status', line.status === 'separated' ? 'Na fila' : line.status === 'conferenced' ? 'Conferido' : 'Pendente'],
        ].map(([label, value]) => (
          <div key={String(label)} className="ls-card py-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default PickingDetailPage;
