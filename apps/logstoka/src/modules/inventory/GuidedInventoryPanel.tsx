import React, { useMemo } from 'react';
import GuidedStepPanel from '@/modules/operational/GuidedStepPanel';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  recordGuidedDivergenceActivity,
  recordInventoryComplete,
  recordInventoryCount,
} from '@/lib/activityRecording';
import { addGuidedDivergence, type DivergenceReason } from '@/lib/conferenceDivergences';
import { inventoryItemsToGuidedItems, type GuidedOperationItem } from '@/lib/guidedOperationItem';
import { fetchInventoryHint } from '@/lib/operationalInventoryHint';
import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = {
  inventoryId: string;
  items: DemoInventoryRow['ls_inventory_items'];
  operatorMode?: boolean;
  operatorFocus?: boolean;
  onComplete?: () => void;
  onConfirmCount: (item: DemoInventoryRow['ls_inventory_items'][number], quantity: number) => void | Promise<void>;
};

const GuidedInventoryPanel: React.FC<Props> = ({
  inventoryId,
  items,
  operatorMode = false,
  operatorFocus = false,
  onComplete,
  onConfirmCount,
}) => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const guidedItems = useMemo(() => inventoryItemsToGuidedItems(inventoryId, items), [inventoryId, items]);

  return (
    <GuidedStepPanel
      items={guidedItems}
      operatorMode={operatorMode}
      operatorFocus={operatorFocus}
      pendingHref={LOGSTOKA_ROUTES.CONFERENCE_PENDING}
      doneTitle="Contagem concluída"
      footnote="Conte no endereço indicado. Só avance após conferir ou registrar divergência."
      onComplete={() => {
        recordInventoryComplete({ companyId, actorName }, guidedItems.length);
        onComplete?.();
      }}
      onDivergence={(item: GuidedOperationItem, reason: DivergenceReason) => {
        if (!companyId) return;
        addGuidedDivergence(companyId, item, reason);
        recordGuidedDivergenceActivity({ companyId, actorName }, item, reason, 'inventory');
      }}
      onConfirm={async (item: GuidedOperationItem) => {
        const row = items.find((i) => i.id === item.id);
        if (!row) return;
        await onConfirmCount(row, item.systemQuantity ?? item.quantity);
        recordInventoryCount({ companyId, actorName }, item);
      }}
      fetchHint={fetchInventoryHint}
    />
  );
};

export default GuidedInventoryPanel;
