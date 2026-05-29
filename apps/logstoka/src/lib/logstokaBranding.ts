export const DEFAULT_BRAND_PRIMARY = '#EA580C';

export type LogstokaBrandingConfig = {
  primaryColor: string;
  logoUrl: string | null;
  companyName: string | null;
};

export const DEFAULT_BRANDING: LogstokaBrandingConfig = {
  primaryColor: DEFAULT_BRAND_PRIMARY,
  logoUrl: null,
  companyName: null,
};

function storageKey(companyId: string | null): string {
  return `logstoka-white-label:${companyId ?? 'default'}`;
}

export function loadBranding(companyId: string | null): LogstokaBrandingConfig {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return { ...DEFAULT_BRANDING };
    const parsed = JSON.parse(raw) as Partial<LogstokaBrandingConfig>;
    return {
      primaryColor: parsed.primaryColor ?? DEFAULT_BRAND_PRIMARY,
      logoUrl: parsed.logoUrl ?? null,
      companyName: parsed.companyName ?? null,
    };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function saveBranding(companyId: string | null, config: LogstokaBrandingConfig): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(config));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const n = parseInt(normalized, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Escurece cor para hover / botões */
export function darkenHex(hex: string, amount = 0.12): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return `#${[f(rgb.r), f(rgb.g), f(rgb.b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function brandCssVariables(primaryColor: string): Record<string, string> {
  const rgb = hexToRgb(primaryColor);
  const dark = darkenHex(primaryColor, 0.15);
  const soft = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)` : 'rgba(234, 88, 12, 0.12)';
  const hover = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : 'rgba(234, 88, 12, 0.06)';
  const ring = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)` : 'rgba(234, 88, 12, 0.35)';
  const shadow = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)` : 'rgba(234, 88, 12, 0.35)';

  return {
    '--ls-brand': primaryColor,
    '--ls-brand-dark': dark,
    '--ls-brand-soft': soft,
    '--ls-brand-hover': hover,
    '--ls-brand-ring': ring,
    '--ls-brand-shadow': shadow,
  };
}

export function isDefaultBranding(config: LogstokaBrandingConfig): boolean {
  return config.primaryColor.toUpperCase() === DEFAULT_BRAND_PRIMARY && !config.logoUrl;
}
