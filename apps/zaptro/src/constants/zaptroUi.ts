/** Texto secundário / ícones (substitui slate #334155). */
export const ZAPTRO_UI_SECONDARY = '#6B6B6B' as const;

/** Texto secundário / rótulos (substitui slate #64748B em todo o Zaptro). */
export const ZAPTRO_MUTED_TEXT = '#949494' as const;

/** Fundo de inputs, buscas, trilhos e áreas “chip” (modo claro) — neutro quente, sem tom azulado. */
export const ZAPTRO_FIELD_BG = '#f4f4f4' as const;

/** Formulários modernos (label caps + campo branco) — ver `zaptroFormFields.css`. */
export const ZAPTRO_FORM_FIELD = {
  stackGapPx: 26,
  labelGapPx: 10,
  inputHeightPx: 50,
  inputRadiusPx: 14,
  inputPaddingXPx: 18,
  labelSizePx: 10,
  labelColor: '#949494',
  inputBorder: '#ebebec',
  inputBg: '#ffffff',
  inputColor: '#000000',
} as const;

/**
 * Painéis e faixas secundárias (ex.: antigo slate-50 #F8FAFC).
 * Um degrau mais escuro que `ZAPTRO_FIELD_BG` para aninhamento ou blocos “muted”.
 */
export const ZAPTRO_SOFT_NEUTRAL_MUTED = '#ebebeb' as const;

/** Traço ao redor de seções/cartões no modo claro. */
export const ZAPTRO_SECTION_BORDER = '#F0F0F1' as const;

/** Títulos de seção, abas, cabeçalhos de tabela e rótulos de campo em preto sólido. */
export const ZAPTRO_TITLE_COLOR = '#000000' as const;

/** Textos auxiliares do shell (layout / painéis) — rótulos e corpo. */
export const ZAPTRO_AUX_TEXT = {
  label: {
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(168, 168, 168, 1)',
    lineHeight: 1.45,
  },
  body: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(189, 189, 189, 1)',
    lineHeight: 1.45,
  },
} as const;

/** Superfície de cartão + orbes de ícone (modelo painel Início). */
export {
  zaptroCardSurfaceStyle,
  zaptroCardRowStyle,
  zaptroIconOrbStyle,
  ZAPTRO_CARD_RADIUS_PX,
  ZAPTRO_CARD_BG_DARK,
  ZAPTRO_ICON_ORB_BG,
  ZAPTRO_ICON_ORB_FG,
} from './zaptroCardSurface';
