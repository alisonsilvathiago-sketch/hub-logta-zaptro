import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import GuidedStepPanel from './GuidedStepPanel';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  recordGuidedConferenceComplete,
  recordGuidedConferenceItem,
  recordGuidedDivergenceActivity,
} from '@/lib/activityRecording';
import { addGuidedDivergence } from '@/lib/conferenceDivergences';
import { registerGuidedConferenceExits } from '@/lib/registerGuidedConferenceExits';
import { operationalOrdersToGuidedItems } from '@/lib/guidedOperationItem';
import { fetchConferenceHint } from '@/lib/operationalConferenceHint';
import { getOperationalProductLocation } from '@/lib/operationalProductLocation';
import type { OperationalOrder } from '@/lib/operationalFlow';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = {
  orders: OperationalOrder[];
  operatorMode?: boolean;
  operatorFocus?: boolean;
  autoRegisterExitsOnComplete?: boolean;
  navigateAfterExit?: boolean;
  onComplete?: () => void;
  onQuickExitComplete?: () => void;
};

const GuidedConferencePanel: React.FC<Props> = ({
  orders,
  operatorMode = false,
  operatorFocus = false,
  autoRegisterExitsOnComplete = false,
  navigateAfterExit = true,
  onComplete,
  onQuickExitComplete,
}) => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const items = useMemo(() => operationalOrdersToGuidedItems(orders), [orders]);

  return (
    <GuidedStepPanel
      items={items}
      operatorMode={operatorMode}
      operatorFocus={operatorFocus}
      pendingHref={LOGSTOKA_ROUTES.CONFERENCE_PENDING}
      doneTitle="Lista conferida"
      onComplete={() => {
        recordGuidedConferenceComplete({ companyId, actorName }, items.length);
        onComplete?.();
      }}
      onConfirm={(item) => {
        recordGuidedConferenceItem({ companyId, actorName }, item);
      }}
      onDivergence={(item, reason) => {
        if (!companyId) return;
        addGuidedDivergence(companyId, item, reason);
        recordGuidedDivergenceActivity({ companyId, actorName }, item, reason, 'operation');
      }}
      fetchHint={async (item) => {
        const order = orders.find((o) => o.id === item.id);
        if (!order) return null;
        return fetchConferenceHint(order, getOperationalProductLocation(order));
      }}
      quickExit={{
        enabled: true,
        autoRegisterOnComplete: autoRegisterExitsOnComplete,
        operatorLabel: actorName,
        onRegisterExits: async (confirmedItems) => {
          const result = await registerGuidedConferenceExits(companyId, actorName, confirmedItems);
          if (result.count === 0) {
            throw new Error('Nenhum item elegível para saída');
          }
          toast.success(`${result.count} saída(s) registrada(s) — estoque atualizado`);
          onQuickExitComplete?.();
          if (navigateAfterExit) {
            navigate('/app/movements?tab=exit');
          }
        },
      }}
    />
  );
};

export default GuidedConferencePanel;
