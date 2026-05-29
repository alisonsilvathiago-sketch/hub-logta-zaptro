export const ZAPTRO_PROMPT_MESTRE_SETTINGS_KEY = 'zaptro_prompt_mestre';

export type PromptMestreScope = 'master' | 'transportadora' | 'zaptro';
export type PromptMestreTone =
  | 'profissional'
  | 'amigavel'
  | 'direto'
  | 'comercial'
  | 'tecnico'
  | 'corporativo';

export type PromptMestrePrefs = {
  scope: PromptMestreScope;
  systemPrompt: string;
  tone: PromptMestreTone;
  quietHours: boolean;
  signOff: string;
  autoReplyWhatsapp: boolean;
};

export type CompanyRow = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  description?: string | null;
  settings?: unknown;
};

const TONE_LINES: Record<PromptMestreTone, string> = {
  profissional: 'Tom de voz: profissional, claro e objetivo.',
  amigavel: 'Tom de voz: amigável, próximo e acolhedor.',
  direto: 'Tom de voz: direto — frases curtas, sem rodeios.',
  comercial: 'Tom de voz: comercial — foco em conversão e próximo passo.',
  tecnico: 'Tom de voz: técnico — precisão e terminologia de logística.',
  corporativo: 'Tom de voz: corporativo — institucional.',
};

/** Alinhado com `ZAPTRO_AI_MASTER_LLAMA32` em src/constants/zaptroPromptMestre.ts */
const MASTER_BODY = `# ZAPTRO AI MASTER - LLAMA 3.2

Você é o ZAPTRO AI MASTER (Llama 3.2), cérebro operacional da plataforma.

Missão: resolver automaticamente solicitações dos clientes, reduzir mão de obra e automatizar a operação da transportadora.

Actue como gerente operacional, atendente, assistente administrativo, financeiro, comercial, suporte e controlador logístico.

Integrações (quando disponíveis no backend): Evolution Go, Supabase, WhatsApp, financeiro, rastreamento, rotas, motoristas, pedidos.

Antes de envolver humano: entender, consultar dados, tentar resolver, executar acções, responder.

Regras: nunca inventar dados de pedidos, pagamentos ou rastreamento; registar histórico; encaminhar humano só quando necessário.

Canal actual: WhatsApp. Responda em português (Brasil). Mensagens curtas (máx. 3 parágrafos). Sem markdown pesado nem listas longas.`;

const ZAPTRO_BODY = `Assistente Virtual Zaptro — atendimento inicial, suporte, consultas, links, triagem comercial. Amigável e resolutivo.`;

const TRANSPORTADORA_BODY = `Assistente da transportadora cadastrada na Zaptro — fretes, coletas, entregas, rastreamento, financeiro, documentação.`;

function defaultBody(scope: PromptMestreScope): string {
  if (scope === 'master') return MASTER_BODY;
  if (scope === 'transportadora') return TRANSPORTADORA_BODY;
  return ZAPTRO_BODY;
}

function isScope(v: unknown): v is PromptMestreScope {
  return v === 'master' || v === 'zaptro' || v === 'transportadora';
}

function isTone(v: unknown): v is PromptMestreTone {
  return (
    v === 'profissional' ||
    v === 'amigavel' ||
    v === 'direto' ||
    v === 'comercial' ||
    v === 'tecnico' ||
    v === 'corporativo'
  );
}

export function parsePromptMestrePrefs(raw: unknown): PromptMestrePrefs {
  const scope: PromptMestreScope = isScope((raw as Record<string, unknown>)?.scope) ? (raw as Record<string, unknown>).scope as PromptMestreScope : 'master';
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      scope: 'master',
      systemPrompt: defaultBody('master'),
      tone: 'profissional',
      quietHours: false,
      signOff: '— Equipa Zaptro',
      autoReplyWhatsapp: true,
    };
  }
  const j = raw as Record<string, unknown>;
  const resolvedScope = isScope(j.scope) ? j.scope : 'master';
  return {
    scope: resolvedScope,
    systemPrompt:
      typeof j.systemPrompt === 'string' && j.systemPrompt.trim()
        ? j.systemPrompt.trim()
        : defaultBody(resolvedScope),
    tone: isTone(j.tone) ? j.tone : 'profissional',
    quietHours: typeof j.quietHours === 'boolean' ? j.quietHours : false,
    signOff: typeof j.signOff === 'string' ? j.signOff : '— Equipa Zaptro',
    autoReplyWhatsapp: j.autoReplyWhatsapp !== false,
  };
}

export function readPromptMestreFromCompany(company: CompanyRow | null | undefined): PromptMestrePrefs {
  const settings = company?.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return parsePromptMestrePrefs(null);
  }
  const raw = (settings as Record<string, unknown>)[ZAPTRO_PROMPT_MESTRE_SETTINGS_KEY];
  return parsePromptMestrePrefs(raw);
}

export function buildWaAutoReplySystemPrompt(
  company: CompanyRow | null | undefined,
  prefs: PromptMestrePrefs,
  clientName?: string | null,
  crmBlock?: string | null,
): string {
  const body = prefs.systemPrompt.trim() || defaultBody(prefs.scope);
  const toneLine = TONE_LINES[prefs.tone] ?? TONE_LINES.profissional;
  const companyLines: string[] = [];
  if (company?.name?.trim()) companyLines.push(`Empresa: ${company.name.trim()}.`);
  if (company?.phone?.trim()) companyLines.push(`Telefone: ${company.phone.trim()}.`);
  if (company?.email?.trim()) companyLines.push(`E-mail: ${company.email.trim()}.`);
  if (company?.opening_hours?.trim()) companyLines.push(`Horário: ${company.opening_hours.trim()}.`);

  const clientLine = clientName?.trim() ? `Cliente WhatsApp: ${clientName.trim()}.` : '';
  const crmLine = crmBlock?.trim() ? `\n${crmBlock.trim()}` : '';

  return [
    `Modelo: llama3.2 (Ollama · ZAPTRO AI MASTER).`,
    '',
    body,
    '',
    '---',
    toneLine,
    companyLines.length ? `\nContexto:\n${companyLines.join('\n')}` : '',
    clientLine,
    crmLine,
    prefs.signOff?.trim() ? `\nEncerramento sugerido: ${prefs.signOff.trim()}` : '',
    '',
    'Se não conseguir resolver com os dados disponíveis, responda ao cliente que vai encaminhar para a equipa e inclua no final da mensagem o marcador [[TRANSFERIR_HUMANO]] (sem explicar o marcador).',
    'Responda APENAS com o texto da mensagem WhatsApp (sem prefixos tipo "Assistente:").',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
