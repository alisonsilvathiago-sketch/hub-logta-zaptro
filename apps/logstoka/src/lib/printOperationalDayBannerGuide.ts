import type { DayFlowPlan } from '@/lib/operationalProfile';
import { openPrintDocument, resolvePrintLogoUrl } from '@/lib/openPrintDocument';

export type PrintDayBannerGuideOptions = {
  companyName?: string;
  logoUrl?: string | null;
  plan: DayFlowPlan;
};

function resolveLogoUrl(logoUrl: string | null | undefined): string {
  return resolvePrintLogoUrl(logoUrl);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(opts: PrintDayBannerGuideOptions): string {
  const company = opts.companyName ?? 'LogStoka WMS';
  const logo = resolveLogoUrl(opts.logoUrl);
  const plan = opts.plan;
  const saleDays = plan.processSaleDays.join(' + ') || '—';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Faixa do dia operacional · ${escapeHtml(company)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.5; }
    .doc { max-width: 190mm; margin: 0 auto; }
    .brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #111; margin-bottom: 16px; }
    .brand img { max-height: 40px; max-width: 120px; object-fit: contain; filter: grayscale(100%); }
    .brand h1 { font-size: 17px; font-weight: 800; }
    .brand p { font-size: 9px; color: #444; text-align: right; }
    h2 { font-size: 12px; font-weight: 800; margin: 14px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    p, li { margin-bottom: 6px; color: #222; }
    ul { padding-left: 18px; margin-bottom: 10px; }
    .today { border: 2px solid #111; border-radius: 10px; padding: 14px 16px; margin: 12px 0; background: #f7f7f7; }
    .today strong { font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .grid div { border: 1px solid #ccc; border-radius: 8px; padding: 10px; background: #fff; }
    .grid span { display: block; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #666; margin-bottom: 4px; }
    .grid em { font-style: normal; font-size: 12px; font-weight: 800; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #eee; font-size: 9px; text-transform: uppercase; }
    .foot { margin-top: 18px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="doc">
    <header class="brand">
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${escapeHtml(logo)}" alt="" />
        <h1>Faixa fixa do dia</h1>
      </div>
      <p>${escapeHtml(company)}<br/>Operação LogStoka · guia interno</p>
    </header>

    <h2>O que é a faixa laranja no topo</h2>
    <p>Barra <strong>fixa ao rolar</strong> a página de operação. Resume as regras do dia para o estoquista não perder o foco: qual dia é, quais vendas processar e até que horas sair / resolver pendências.</p>

    <div class="today">
      <strong>Hoje: ${escapeHtml(plan.weekdayLabel)}</strong>
      <p style="margin-top:8px;">Processar vendas de: <strong>${escapeHtml(saleDays)}</strong></p>
      <div class="grid">
        <div><span>Saída até</span><em>${escapeHtml(plan.dailyCutoff)}</em></div>
        <div><span>Pendências até</span><em>${escapeHtml(plan.backlogCutoff)}</em></div>
        <div><span>Observação</span><em>${escapeHtml(plan.note || '—')}</em></div>
      </div>
    </div>

    <h2>O que o operador deve fazer</h2>
    <ol style="padding-left:18px;">
      <li>Ler a faixa ao entrar em <strong>/app/operacao</strong>.</li>
      <li>Clicar no card <strong>Separar / conferir hoje</strong> (ou Acumulados / Atrasados).</li>
      <li>No pop-up: abrir <strong>Conferência guiada</strong> → um produto por vez.</li>
      <li>Ir ao endereço indicado, contar, voltar e marcar <strong>Conferido</strong> (Enter) ou <strong>Divergência</strong>.</li>
      <li>Repetir até terminar a lista. Divergências vão para pendências.</li>
    </ol>

    <h2>Pop-up de separação (resumo)</h2>
    <ul>
      <li>Modal centralizado — não ocupa a tela inteira.</li>
      <li>Padding equilibrado (esquerda = direita).</li>
      <li>Lista com <strong>scroll interno</strong>; cabeçalho e rodapé do modal ficam fixos.</li>
      <li><strong>Modo operador</strong>: tela cheia só com produto, local, quantidade e botões.</li>
      <li>Llama 3.2 auxilia com dicas curtas (sem expor “IA” na interface).</li>
    </ul>

    <h2>Inventário</h2>
    <p>Em <strong>/app/inventory</strong>, botão <strong>Contagem guiada</strong> — mesmo fluxo passo a passo para contagem física.</p>

    <h2>Quem configura as regras</h2>
    <p>Gestor ajusta dias, cortes e horários em <strong>/app/operacao/fluxo</strong> (Controle de fluxo). A faixa reflete automaticamente o plano do dia.</p>

    <h2>Mapa rápido</h2>
    <table>
      <thead><tr><th>Elemento</th><th>Função</th></tr></thead>
      <tbody>
        <tr><td>Faixa fixa (banner)</td><td>Regra do dia sempre visível ao rolar</td></tr>
        <tr><td>Cards (Separar hoje…)</td><td>Abrem pop-up com lista filtrada</td></tr>
        <tr><td>Lista + scroll</td><td>Visão geral dos pedidos/SKUs</td></tr>
        <tr><td>Conferência guiada</td><td>Um item por vez até interagir</td></tr>
        <tr><td>Pendências</td><td>Correção de divergências</td></tr>
      </tbody>
    </table>

    <p class="foot">LogStoka · faixa operacional do dia · ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body>
</html>`;
}

export function printOperationalDayBannerGuide(opts: PrintDayBannerGuideOptions) {
  const html = buildHtml(opts);
  const win = openPrintDocument(html);
  if (!win) throw new Error('popup_blocked');
}
