import { aiUnavailableShort } from '@/modules/ai/constants';

/** Base URL da API LogStoka no browser. */
export function resolveLogstokaApiBase(): string {
  if (import.meta.env.DEV) {
    return '/logstoka-api';
  }
  const configured = import.meta.env.VITE_LOGSTOKA_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return '/logstoka-api';
}

export function formatLogstokaApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed')
  ) {
    return import.meta.env.DEV
      ? 'API LogStoka offline. Inicie: npm run dev --prefix apps/logstoka/server (porta 8788) e recarregue a página.'
      : 'Serviço indisponível no momento. Tente novamente em instantes.';
  }

  if (lower.includes('unauthorized') || raw.includes('401')) {
    return 'Sessão expirada. Faça login novamente e tente de novo.';
  }

  if (lower.includes('indisponível') || lower.includes('503')) {
    return aiUnavailableShort();
  }

  return raw || 'Erro ao contactar a API LogStoka.';
}
