import { supabase } from './supabase';

/**
 * Master Event Bridge
 * Barramento de eventos global para comunicação entre Hub, Zaptro, Logta e LogDock.
 * Utiliza Supabase Realtime (Broadcast) para mensagens de baixa latência.
 */

export type HubEvent = {
  type: string;
  payload: any;
  origin: 'HUB' | 'ZAPTRO' | 'LOGTA' | 'LOGDOCK' | 'SYSTEM';
  timestamp: string;
};

const HUB_CHANNEL = 'master-event-bridge';

/**
 * Envia um evento para o barramento global.
 */
export const broadcastEvent = async (event: Omit<HubEvent, 'timestamp'>) => {
  const fullEvent: HubEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };

  console.log(`[EventBridge] Broadcasting: ${fullEvent.type} from ${fullEvent.origin}`);
  
  return supabase.channel(HUB_CHANNEL).send({
    type: 'broadcast',
    event: fullEvent.type,
    payload: fullEvent
  });
};

/**
 * Inscreve-se para ouvir eventos específicos ou todos os eventos.
 */
export const subscribeToEvents = (callback: (event: HubEvent) => void) => {
  const channel = supabase.channel(HUB_CHANNEL);

  channel
    .on('broadcast', { event: '*' }, (payload) => {
      callback(payload.payload as HubEvent);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[EventBridge] Conectado ao barramento global.');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Helpers para eventos comuns
 */
export const notifySystemSync = () => broadcastEvent({
  type: 'SYSTEM_SYNC',
  origin: 'HUB',
  payload: { action: 'REFRESH_ALL_CONFIGS' }
});

export const notifyNewCustomer = (customerData: any) => broadcastEvent({
  type: 'CUSTOMER_CREATED',
  origin: 'SYSTEM',
  payload: customerData
});
