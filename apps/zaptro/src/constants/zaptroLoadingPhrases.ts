/** Tempo em cada frase antes de começar o fade out (ms). */
export const ZAPTRO_LOADING_STEP_HOLD_MS = 1100;
/** Duração do crossfade entre frases (ms). */
export const ZAPTRO_LOADING_FADE_MS = 450;
/** Após a última frase, espera antes de finalizar. */
export const ZAPTRO_LOADING_AFTER_LAST_MS = 300;

/** Frases do carregamento "inteligente" por contexto. */
export type ZaptroLoadingPhraseContext =
  | 'dashboard'
  | 'mensagens'
  | 'rotas'
  | 'cargas'
  | 'orcamentos'
  | 'motoristas'
  | 'crm'
  | 'mapa'
  | 'logout'
  | 'login'
  | 'sistema';

/**
 * Frases por contexto.
 * Use {{name}} para o primeiro nome do usuário.
 * Use [[lime]] para marcar o trecho que deve ficar verde-lima.
 */
export const ZAPTRO_LOADING_PHRASES: Record<ZaptroLoadingPhraseContext, readonly string[]> = {
  dashboard: ['Preparando visão estratégica', 'Sincronizando indicadores', 'Carregando painel'],
  mensagens: ['Conectando gateway', 'Sincronizando conversas', 'Preparando chat'],
  rotas: ['Otimizando percursos', 'Sincronizando GPS', 'Preparando mapas'],
  cargas: ['Organizando manifestos', 'Sincronizando documentos', 'Preparando ordens'],
  orcamentos: ['Calculando propostas', 'Sincronizando tabelas', 'Preparando orçamentos'],
  motoristas: ['Carregando equipe', 'Sincronizando motoristas', 'Preparando operação'],
  crm: ['Organizando pipeline', 'Atualizando oportunidades', 'Preparando negociações'],
  mapa: ['Carregando mapa', 'Sincronizando camadas', 'Preparando navegação'],
  login: [
    'Olá, [[lime]]{{name}}.',
    'Preparando seu [[lime]]ambiente...',
    'Tudo [[lime]]pronto.',
  ],
  logout: [
    'Até logo, [[lime]]{{name}}.',
    '[[lime]]Aguarde.',
    'Encerrando [[lime]]sessão...',
  ],
  sistema: ['Iniciando sistema', 'Conectando módulos', 'Finalizando carregamento'],
};
