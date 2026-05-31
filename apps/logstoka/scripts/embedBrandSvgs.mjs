/**
 * Gera SVGs auto-contidos (base64) a partir dos PNG em public/integrations/brands/.
 * Necessário porque SVG com <image href="arquivo.png"> fica em branco quando usado via <img>.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandsDir = path.join(root, 'public/integrations/brands');

const labels = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
  tiktok: 'TikTok Shop',
  magalu: 'Magalu',
  ifood: 'iFood',
  nuvemshop: 'Nuvemshop',
  tray: 'Tray',
  bagy: 'Bagy',
  'loja-integrada': 'Loja Integrada',
};

for (const [id, label] of Object.entries(labels)) {
  const pngPath = path.join(brandsDir, `${id}.png`);
  const svgPath = path.join(brandsDir, `${id}.svg`);
  if (!fs.existsSync(pngPath)) {
    console.warn(`skip ${id}: PNG não encontrado`);
    continue;
  }
  const base64 = fs.readFileSync(pngPath).toString('base64');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" role="img" aria-label="${label}">
  <image href="data:image/png;base64,${base64}" width="150" height="150" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`ok ${id}.svg (${Math.round(svg.length / 1024)}kb)`);
}
