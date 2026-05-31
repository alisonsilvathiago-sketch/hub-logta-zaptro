export type LabelPresetId =
  | 'small'
  | 'compact-60'
  | 'compact-80'
  | 'stock'
  | 'medium'
  | 'wide'
  | 'logistics'
  | 'correios-104x145'
  | 'custom';

export type LabelPresetCategory = 'product' | 'logistics';

export type LabelPreset = {
  id: LabelPresetId;
  name: string;
  widthMm: number;
  heightMm: number;
  category: LabelPresetCategory;
  description: string;
  /** Marcas de impressora térmica mais compatíveis */
  printerHints: string[];
  isDefault?: boolean;
};

export const LOGSTOKA_LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'small',
    name: 'Pequena · 50×30 mm',
    widthMm: 50,
    heightMm: 30,
    category: 'product',
    description: 'Peças pequenas, ganchos e acessórios.',
    printerHints: ['Zebra', 'Elgin', 'Gprinter'],
  },
  {
    id: 'compact-60',
    name: 'Compacta · 60×40 mm',
    widthMm: 60,
    heightMm: 40,
    category: 'product',
    description: 'Etiquetas médias para caixas pequenas.',
    printerHints: ['Zebra', 'Elgin', 'Gprinter'],
  },
  {
    id: 'compact-80',
    name: 'Intermediária · 80×50 mm',
    widthMm: 80,
    heightMm: 50,
    category: 'product',
    description: 'Entre compacta e padrão de estoque.',
    printerHints: ['Zebra', 'Elgin', 'Argox', 'Gprinter'],
  },
  {
    id: 'stock',
    name: 'Estoque · 100×50 mm',
    widthMm: 100,
    heightMm: 50,
    category: 'product',
    description: 'Padrão LogStoka — prateleira, separação, inventário e bipagem.',
    printerHints: ['Zebra', 'Elgin', 'Argox', 'Gprinter', 'TSC', 'Brother'],
    isDefault: true,
  },
  {
    id: 'medium',
    name: 'Média · 100×75 mm',
    widthMm: 100,
    heightMm: 75,
    category: 'product',
    description: 'Mais espaço para nome longo e códigos.',
    printerHints: ['Zebra', 'Elgin', 'Argox', 'Gprinter'],
  },
  {
    id: 'wide',
    name: 'Ampla · 100×100 mm',
    widthMm: 100,
    heightMm: 100,
    category: 'product',
    description: 'Caixas médias e kits com mais informação.',
    printerHints: ['Zebra', 'TSC', 'Brother'],
  },
  {
    id: 'logistics',
    name: 'Logística · 100×150 mm',
    widthMm: 100,
    heightMm: 150,
    category: 'logistics',
    description: 'Formato vertical — expedição e transportadoras (não é etiqueta de prateleira).',
    printerHints: ['Zebra', 'Elgin', 'Argox'],
  },
  {
    id: 'correios-104x145',
    name: 'Correios SIGEP · 104×145 mm',
    widthMm: 104,
    heightMm: 145,
    category: 'logistics',
    description: 'Compatível com rolos SIGEP Web / SEDEX (módulo expedição).',
    printerHints: ['Zebra', 'Elgin', 'Argox'],
  },
];

export const THERMAL_PRINTER_OPTIONS = [
  { id: 'zebra-zd220', brand: 'Zebra', model: 'ZD220', presetId: 'stock' as LabelPresetId },
  { id: 'zebra-zd420', brand: 'Zebra', model: 'ZD420', presetId: 'stock' as LabelPresetId },
  { id: 'elgin-l42', brand: 'Elgin', model: 'L42 PRO', presetId: 'stock' as LabelPresetId },
  { id: 'argox-os214', brand: 'Argox', model: 'OS-214 Plus', presetId: 'stock' as LabelPresetId },
  { id: 'gprinter-gp1324', brand: 'Gprinter', model: 'GP-1324D', presetId: 'stock' as LabelPresetId },
  { id: 'tsc-te244', brand: 'TSC', model: 'TE244', presetId: 'stock' as LabelPresetId },
  { id: 'brother-ql800', brand: 'Brother', model: 'QL-800', presetId: 'medium' as LabelPresetId },
  { id: 'other', brand: 'Outra', model: 'Impressora térmica', presetId: 'stock' as LabelPresetId },
] as const;

export function getLabelPreset(id: LabelPresetId): LabelPreset {
  return LOGSTOKA_LABEL_PRESETS.find((p) => p.id === id) ?? LOGSTOKA_LABEL_PRESETS.find((p) => p.isDefault)!;
}

export function getDefaultProductPreset(): LabelPreset {
  return LOGSTOKA_LABEL_PRESETS.find((p) => p.isDefault)!;
}

export function getProductLabelPresets(): LabelPreset[] {
  return LOGSTOKA_LABEL_PRESETS.filter((p) => p.category === 'product');
}

export function getLogisticsLabelPresets(): LabelPreset[] {
  return LOGSTOKA_LABEL_PRESETS.filter((p) => p.category === 'logistics');
}

export function recommendPresetForPrinter(printerKey: string): LabelPresetId {
  const hit = THERMAL_PRINTER_OPTIONS.find((p) => p.id === printerKey);
  return hit?.presetId ?? 'stock';
}

export function formatPresetSize(preset: Pick<LabelPreset, 'widthMm' | 'heightMm'>): string {
  return `${preset.widthMm} × ${preset.heightMm} mm`;
}

export function resolveLabelDimensions(
  presetId: LabelPresetId,
  custom?: { widthMm?: number; heightMm?: number },
): { widthMm: number; heightMm: number; preset: LabelPreset } {
  const preset = getLabelPreset(presetId);
  if (presetId !== 'custom') {
    return { widthMm: preset.widthMm, heightMm: preset.heightMm, preset };
  }
  return {
    widthMm: Math.min(150, Math.max(30, custom?.widthMm ?? preset.widthMm)),
    heightMm: Math.min(200, Math.max(20, custom?.heightMm ?? preset.heightMm)),
    preset,
  };
}
