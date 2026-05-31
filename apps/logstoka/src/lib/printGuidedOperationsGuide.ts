import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import { openPrintDocument, resolvePrintLogoUrl } from '@/lib/openPrintDocument';

export type PrintGuidedGuideOptions = {
  companyName?: string;
  logoUrl?: string | null;
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

function buildHtml(opts: PrintGuidedGuideOptions): string {
  const company = opts.companyName ?? 'LogStoka WMS';
  const logo = resolveLogoUrl(opts.logoUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Modo Conferência Guiada · ${escapeHtml(company)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.5; }
    .doc { max-width: 190mm; margin: 0 auto; }
    .brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #111; margin-bottom: 16px; }
    .brand img { max-height: 40px; max-width: 120px; object-fit: contain; filter: grayscale(100%); }
    .brand h1 { font-size: 18px; font-weight: 800; }
    .brand p { font-size: 9px; color: #444; text-align: right; }
    h2 { font-size: 13px; font-weight: 800; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    p, li { margin-bottom: 6px; color: #222; }
    ul { padding-left: 18px; margin-bottom: 10px; }
    .box { border: 1px solid #ccc; border-radius: 8px; padding: 12px 14px; margin: 10px 0; background: #fafafa; }
    .flow { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; margin: 8px 0; }
    .flow span { padding: 4px 8px; border: 1px solid #999; border-radius: 999px; background: #fff; }
    .flow em { font-style: normal; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #eee; font-size: 9px; text-transform: uppercase; }
    .foot { margin-top: 18px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="doc">
    <header class="brand">
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${escapeHtml(logo)}" alt="" />
        <h1>Modo Conferência Guiada</h1>
      </div>
      <p>${escapeHtml(company)}<br/>LogStoka · Guia operacional interno</p>
    </header>

    <h2>O que é</h2>
    <p>Diferencial LogStoka: o sistema conduz o estoquista <strong>produto a produto</strong>, sem distrações. Funciona em <strong>Operação</strong> (separação/conferência de pedidos) e em <strong>Inventário</strong> (contagem física).</p>

    <h2>Pop-up (modal)</h2>
    <ul>
      <li>Centralizado — não ocupa a página inteira.</li>
      <li>Padding simétrico (esquerda = direita).</li>
      <li>Cabeçalho e rodapé fixos; <strong>rolagem só na lista</strong> quando houver muitos itens.</li>
      <li>Abas: <strong>Lista</strong> e <strong>Conferência / Contagem guiada</strong>.</li>
    </ul>

    <h2>Fluxo — conferência de pedidos</h2>
    <div class="flow">
      <span>Abrir fila (ex.: Separar hoje)</span><em>→</em>
      <span>Iniciar conferência</span><em>→</em>
      <span>Produto 1</span><em>→</em>
      <span>Conferido ou Divergência</span><em>→</em>
      <span>Próximo…</span>
    </div>
    <div class="box">
      <p><strong>Um produto por vez:</strong> nome, quantidade, localização (corredor · prateleira · nível).</p>
      <p>Instrução em texto + dica do ${LOGSTOKA_AI_BRAND} em background (sem expor “IA” na tela).</p>
      <p><strong>Enter</strong> = Conferido · só avança após interação.</p>
    </div>

    <h2>Fluxo — inventário</h2>
    <p>Em <strong>/app/inventory</strong> → botão <strong>Contagem guiada</strong> no inventário ativo.</p>
    <div class="flow">
      <span>SKU + produto</span><em>→</em>
      <span>Ir ao endereço</span><em>→</em>
      <span>Contar</span><em>→</em>
      <span>Conferido</span>
    </div>

    <h2>Divergência</h2>
    <p>Ao clicar <strong>Divergência</strong>, escolher motivo:</p>
    <ul>
      <li>Produto não encontrado</li>
      <li>Quantidade incorreta</li>
      <li>Produto danificado / trocado / outro</li>
    </ul>
    <p>Ocorrência vai para <strong>Pendências de Conferência</strong> (<code>/app/operacao/pendencias-conferencia</code>).</p>

    <h2>Modo operador (tela cheia)</h2>
    <p>Na aba guiada, botão <strong>Modo operador</strong>: tela limpa — só produto, localização, quantidade e botões Conferido / Divergência. Sem menu lateral.</p>

    <h2>Onde usar no sistema</h2>
    <table>
      <thead><tr><th>Área</th><th>Caminho</th><th>Ação</th></tr></thead>
      <tbody>
        <tr><td>Operação do dia</td><td>/app/operacao</td><td>Card da fila → pop-up → Iniciar conferência</td></tr>
        <tr><td>Inventário</td><td>/app/inventory</td><td>Contagem guiada no inventário ativo</td></tr>
        <tr><td>Pendências</td><td>/app/operacao/pendencias-conferencia</td><td>Correções de divergências</td></tr>
        <tr><td>Controle de fluxo</td><td>/app/operacao/fluxo</td><td>Regras do dia (corte, dias processados)</td></tr>
      </tbody>
    </table>

    <h2>Objetivo</h2>
    <p>Reduzir erro de separação, conferência e inventário. O operador não caça informação — o LogStoka conduz passo a passo até marcar Conferido ou Divergência.</p>

    <p class="foot">Documento operacional LogStoka · uso interno · ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body>
</html>`;
}

export function printGuidedOperationsGuide(opts: PrintGuidedGuideOptions = {}) {
  const html = buildHtml(opts);
  const win = openPrintDocument(html);
  if (!win) throw new Error('popup_blocked');
}
