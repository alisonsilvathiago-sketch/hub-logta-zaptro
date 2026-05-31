/** Marca pública da inteligência LogStoka — nunca expor Llama/Ollama ao cliente. */
export const LOGSTOKA_AI_BRAND = 'Aiato';
export const LOGSTOKA_AI_TAGLINE = 'Inteligência operacional LogStoka';

/** Alias de UI — mesma marca; não referencia modelo interno. */
export const LOGSTOKA_AI_MODEL = LOGSTOKA_AI_BRAND;

export const AI_INICIO_EXAMPLES = [
  'Quantas saídas tivemos hoje?',
  'Quais produtos estão abaixo do estoque mínimo?',
  'Sugestões de reposição',
] as const;

export const AI_AGENT_LABELS: Record<string, string> = {
  stock: 'Estoque',
  movements: 'Movimentações',
  returns: 'Devoluções',
  inventory: 'Inventário',
  replenishment: 'Reposição',
  imports: 'Documentos',
  analytics: 'Análise & vendas',
  integrations: 'Integrações',
  products: 'Produtos & cadastro',
  daily_summary: 'Resumo diário',
  general: 'Operacional',
};

export function aiEngineStatusLabel(online: boolean | null): string {
  if (online === null) return 'conectando…';
  if (online) return 'motor activo';
  return 'reconectando…';
}

export function aiAnalyzingLabel(): string {
  return `${LOGSTOKA_AI_BRAND} a analisar…`;
}

export function aiEmptyReplyMessage(): string {
  return `Não consegui gerar uma resposta agora. O ${LOGSTOKA_AI_BRAND} está a reconectar — tente novamente em instantes.`;
}

export function aiUnavailableWithDashboardHint(): string {
  return `${LOGSTOKA_AI_BRAND} temporariamente indisponível. A reconexão é automática — pode continuar a usar o dashboard e os módulos pelo menu lateral.`;
}

export function aiUnavailableShort(): string {
  return `${LOGSTOKA_AI_BRAND} temporariamente indisponível. Aguarde alguns segundos e tente novamente.`;
}

export function buildAiWelcomeMessage(firstName: string, online: boolean | null): string {
  const status =
    online === false
      ? ` Estou a reconectar ao ${LOGSTOKA_AI_BRAND} — já pode perguntar; consulto os dados do sistema assim que a ligação estabilizar.`
      : '';

  return `Olá, ${firstName}! Sou o assistente global LogStoka — powered by ${LOGSTOKA_AI_BRAND}.${status}

Consulto dados reais de estoque, movimentações, inventário, reposição, vendas, documentos e integrações multicanal. Envie fotos ou arquivos (📎) para resumo e localização de produtos no WMS. O que precisa?`;
}

export function buildInicioHeroSubtitle(displayName: string): string {
  return `Olá, ${displayName}. O ${LOGSTOKA_AI_BRAND} é a inteligência operacional do LogStoka — pergunte sobre operações, cadastros, reposição, inventário, documentos ou integrações.`;
}
