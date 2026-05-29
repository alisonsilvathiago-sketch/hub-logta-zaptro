import { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import {
  resolveWaLinkCustomerContext,
  type WaLinkCustomerContextSnapshot,
} from './waLinkCustomerContext';
import { syncWaLinkCrmContextToConversation } from './waLinkCrmContextSync';
import type { WaLinkConversation } from './waLinkInboxDb';

export type WaLinkAssigneeProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export function useWaLinkCustomerContext(
  conversation: WaLinkConversation | null,
  companyId: string | null,
) {
  const [assignee, setAssignee] = useState<WaLinkAssigneeProfile | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const bump = () => setRefreshTick((t) => t + 1);
    window.addEventListener('zaptro-quotes-updated', bump);
    window.addEventListener('zaptro-crm-active-routes', bump);
    window.addEventListener('zaptro-route-live', bump);
    return () => {
      window.removeEventListener('zaptro-quotes-updated', bump);
      window.removeEventListener('zaptro-crm-active-routes', bump);
      window.removeEventListener('zaptro-route-live', bump);
    };
  }, []);

  const snapshot = useMemo((): WaLinkCustomerContextSnapshot | null => {
    if (!conversation?.sender_number) return null;
    return resolveWaLinkCustomerContext({
      phone: conversation.sender_number,
      companyId: companyId || conversation.company_id || 'local-demo',
      senderName: conversation.sender_name,
      metadata: conversation.metadata,
    });
  }, [conversation, companyId, refreshTick]);

  useEffect(() => {
    const assignedId = conversation?.assigned_to?.trim();
    if (!assignedId) {
      setAssignee(null);
      return;
    }
    let cancelled = false;
    void supabaseZaptro
      .from('profiles')
      .select('id,full_name,avatar_url')
      .eq('id', assignedId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.id) {
          setAssignee({
            id: data.id,
            full_name: (data.full_name as string | null) ?? null,
            avatar_url: (data.avatar_url as string | null) ?? null,
          });
        } else {
          setAssignee({ id: assignedId, full_name: null, avatar_url: null });
        }
      })
      .catch(() => {
        if (!cancelled) setAssignee({ id: assignedId, full_name: null, avatar_url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [conversation?.assigned_to]);

  const lastSyncRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversation?.id || conversation.id.startsWith('wa-mirror-')) return;
    if (!snapshot) return;
    const key = `${conversation.id}:${snapshot.quotes.length}:${snapshot.routes.length}:${snapshot.companyName}`;
    if (lastSyncRef.current === key) return;
    lastSyncRef.current = key;
    void syncWaLinkCrmContextToConversation(
      conversation.id,
      snapshot,
      conversation.metadata ?? null,
    );
  }, [conversation?.id, conversation?.metadata, snapshot]);

  return { snapshot, assignee };
}
