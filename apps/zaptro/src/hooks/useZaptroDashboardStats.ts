import { useCallback, useEffect, useState } from 'react';
import { supabaseZaptro } from '../lib/supabase-zaptro';

export type ZaptroDashboardChartBar = {
  name: string;
  mensagens: number;
};

export type ZaptroDashboardQueueItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
};

export type ZaptroDashboardStats = {
  openConversations: number;
  messagesToday: number;
  totalContacts: number;
  avgResponse: string;
  agents: number;
  queue: ZaptroDashboardQueueItem[];
  monthlyChart: ZaptroDashboardChartBar[];
  weeklyChart: ZaptroDashboardChartBar[];
  loading: boolean;
};

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const EMPTY: ZaptroDashboardStats = {
  openConversations: 0,
  messagesToday: 0,
  totalContacts: 0,
  avgResponse: '—',
  agents: 0,
  queue: [],
  monthlyChart: MONTH_LABELS.map((name) => ({ name, mensagens: 0 })),
  weeklyChart: WEEK_LABELS.map((name) => ({ name, mensagens: 0 })),
  loading: true,
};

export function useZaptroDashboardStats(companyId: string | null | undefined): ZaptroDashboardStats {
  const [stats, setStats] = useState<ZaptroDashboardStats>(EMPTY);

  const reload = useCallback(async () => {
    if (!companyId) {
      setStats({ ...EMPTY, loading: false });
      return;
    }

    try {
      const { count: active } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['open', 'waiting']);

      const { count: totalContacts } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const { count: agents } = await supabaseZaptro
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('role', ['agent', 'atendimento']);

      const { data: attendanceData } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('created_at, last_customer_message_at')
        .eq('company_id', companyId)
        .not('last_customer_message_at', 'is', null)
        .limit(20);

      let avgResponse = '—';
      if (attendanceData && attendanceData.length > 0) {
        const avg =
          attendanceData.reduce((acc, c) => {
            const t1 = new Date(c.created_at).getTime();
            const t2 = new Date(c.last_customer_message_at as string).getTime();
            return acc + (t2 - t1);
          }, 0) / attendanceData.length;
        const mins = Math.max(0.5, Math.floor(avg / 60000));
        avgResponse = `${mins} min`;
      }

      const { data: convs } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('last_customer_message_at', { ascending: false })
        .limit(5);

      const queue: ZaptroDashboardQueueItem[] = (convs ?? []).map((c: Record<string, unknown>) => {
        const lastAt = c.last_customer_message_at as string | null | undefined;
        const name =
          (c.sender_name as string) ||
          (c.customer_name as string) ||
          (c.sender_number as string) ||
          (c.customer_phone as string) ||
          'Cliente';
        return {
          id: String(c.id),
          name,
          preview: (c.last_message as string) || 'Nova conversa',
          time: lastAt ? new Date(lastAt).toLocaleString('pt-BR') : '—',
        };
      });

      const { data: convIdRows } = await supabaseZaptro
        .from('whatsapp_conversations')
        .select('id')
        .eq('company_id', companyId);

      const convIds = (convIdRows ?? []).map((r) => r.id as string).filter(Boolean);
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);
      const sinceIso = since.toISOString();

      let messagesToday = 0;
      const timestamps: string[] = [];
      const chunk = 400;

      for (let i = 0; i < convIds.length; i += chunk) {
        const slice = convIds.slice(i, i + chunk);
        const { data: msgRows } = await supabaseZaptro
          .from('whatsapp_messages')
          .select('created_at')
          .in('conversation_id', slice)
          .gte('created_at', sinceIso);
        for (const row of msgRows ?? []) {
          if (!row?.created_at) continue;
          timestamps.push(row.created_at as string);
          const t = new Date(row.created_at as string).getTime();
          if (Number.isFinite(t) && t >= startToday.getTime()) messagesToday += 1;
        }
      }

      const monthlyChart = MONTH_LABELS.map((name) => ({ name, mensagens: 0 }));
      const weeklyChart = WEEK_LABELS.map((name) => ({ name, mensagens: 0 }));

      for (const iso of timestamps) {
        const d = new Date(iso);
        if (!Number.isFinite(d.getTime())) continue;
        const month = d.getMonth();
        const day = (d.getDay() + 6) % 7;
        if (monthlyChart[month]) monthlyChart[month].mensagens += 1;
        if (weeklyChart[day]) weeklyChart[day].mensagens += 1;
      }

      setStats({
        openConversations: active ?? 0,
        messagesToday,
        totalContacts: totalContacts ?? 0,
        avgResponse,
        agents: agents ?? 0,
        queue,
        monthlyChart,
        weeklyChart,
        loading: false,
      });
    } catch (e) {
      console.error('[useZaptroDashboardStats]', e);
      setStats({ ...EMPTY, loading: false });
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabaseZaptro
      .channel(`zaptro_dashboard_stats_${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        void reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        void reload();
      })
      .subscribe();

    return () => {
      void supabaseZaptro.removeChannel(channel);
    };
  }, [companyId, reload]);

  return stats;
}
