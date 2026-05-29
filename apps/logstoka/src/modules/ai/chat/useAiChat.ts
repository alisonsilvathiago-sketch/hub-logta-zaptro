import { useCallback, useState } from 'react';
import { logstokaApi } from '@/lib/logstokaApi';
import type { AiChatTurn } from '../types';

export function useAiChat(params?: { screen?: string; userName?: string; companyName?: string }) {
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async (message: string, history: AiChatTurn[]) => {
      setSending(true);
      try {
        const res = await logstokaApi.aiChat({
          message,
          history: history.filter((h) => h.role !== 'system'),
          screen: params?.screen,
          user_name: params?.userName,
          company_name: params?.companyName,
        });
        return res;
      } finally {
        setSending(false);
      }
    },
    [params?.screen, params?.userName, params?.companyName],
  );

  return { send, sending };
}
