import React, { useEffect, useMemo, useRef } from 'react';
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
import {
  completeConferenceHistorySession,
  createConferenceSessionId,
  recordConferenceExitRegistered,
  recordConferenceItemConfirmed,
  recordConferenceItemDivergence,
  startConferenceHistorySession,
  type ConferenceHistorySource,
} from '@/lib/conferenceHistory';
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
  conferenceSource?: ConferenceHistorySource;
  conferenceSessionId?: string;
  onComplete?: () => void;
  onQuickExitComplete?: () => void;
};

const GuidedConferencePanel: React.FC<Props> = ({
  orders,
  operatorMode = false,
  operatorFocus = false,
  autoRegisterExitsOnComplete = false,
  navigateAfterExit = true,
  conferenceSource = 'operation_sheet',
  conferenceSessionId,
  onComplete,
  onQuickExitComplete,
}) => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const actorName = profile?.full_name?.trim() || 'Operador';
  const actorId = profile?.id;
  const actorEmail = profile?.email;
  const items = useMemo(() => operationalOrdersToGuidedItems(orders), [orders]);
  const sessionIdRef = useRef(conferenceSessionId ?? createConferenceSessionId());
  const sessionStartedRef = useRef(false);
  const divergenceCountRef = useRef(0);

  useEffect(() => {
    if (!companyId || orders.length === 0 || sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    const units = orders.reduce((sum, order) => sum + order.quantity, 0);
    startConferenceHistorySession({
      companyId,
      sessionId: sessionIdRef.current,
      actorName,
      actorId,
      actorEmail,
      source: conferenceSource,
      itemCount: orders.length,
      unitsExpected: units,
    });
  }, [actorEmail, actorId, actorName, companyId, conferenceSource, orders]);

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
        if (!companyId) return;
        recordConferenceItemConfirmed({
          companyId,
          sessionId: sessionIdRef.current,
          actorName,
          actorId,
          source: conferenceSource,
          sku: item.sku,
          productName: item.productName,
          quantityExpected: item.quantity,
          marketplace: item.marketplace,
          store: item.orderRef,
          orderRef: item.orderRef,
        });
      }}
      onDivergence={(item, reason) => {
        if (!companyId) return;
        divergenceCountRef.current += 1;
        addGuidedDivergence(companyId, item, reason);
        recordGuidedDivergenceActivity({ companyId, actorName }, item, reason, 'operation');
        recordConferenceItemDivergence({
          companyId,
          sessionId: sessionIdRef.current,
          actorName,
          actorId,
          source: conferenceSource,
          sku: item.sku,
          productName: item.productName,
          quantityExpected: item.quantity,
          quantityActual: reason === 'wrong_qty' ? undefined : item.quantity,
          reason,
          marketplace: item.marketplace,
          store: item.orderRef,
          orderRef: item.orderRef,
        });
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
          if (companyId) {
            for (const item of confirmedItems) {
              recordConferenceExitRegistered({
                companyId,
                sessionId: sessionIdRef.current,
                actorName,
                actorId,
                source: conferenceSource,
                sku: item.sku,
                productName: item.productName,
                quantityRegistered: item.quantity,
                orderRef: item.orderRef,
              });
            }
            const units = confirmedItems.reduce((sum, item) => sum + item.quantity, 0);
            completeConferenceHistorySession({
              companyId,
              sessionId: sessionIdRef.current,
              actorName,
              actorId,
              source: conferenceSource,
              confirmedCount: confirmedItems.length,
              divergenceCount: divergenceCountRef.current,
              unitsRegistered: units,
            });
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
