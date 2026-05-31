import { openPrintDocument } from '@/lib/openPrintDocument';
import type { TransferReleaseApproval } from '@/lib/logstokaDemoSeed';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type TransferAuthorizationPrintInput = {
  originName: string;
  destinationName: string;
  productName: string;
  productCode: string;
  quantity: number;
  release: TransferReleaseApproval;
};

export function printTransferAuthorizationDoc(input: TransferAuthorizationPrintInput): void {
  const signedAt = new Date(input.release.approved_at).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo de transferência · ${escapeHtml(input.originName)} → ${escapeHtml(input.destinationName)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 32px; font-size: 13px; line-height: 1.55; }
    h1 { font-size: 18px; margin: 0 0 4px; font-family: Arial, sans-serif; }
    .meta { font-size: 11px; color: #666; margin-bottom: 20px; font-family: Arial, sans-serif; }
    p { margin: 0 0 14px; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-family: Arial, sans-serif; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
    th { background: #f7f7f7; width: 28%; font-weight: 700; }
    .sign-block { margin-top: 24px; display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap; }
    .sign-block img { max-width: 280px; border: 1px solid #ccc; border-radius: 8px; background: #fff; }
    .sign-meta { font-family: Arial, sans-serif; font-size: 11px; color: #444; }
    .foot { margin-top: 28px; font-size: 10px; color: #888; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>Termo de autorização de transferência entre CDs</h1>
  <p class="meta">LogStoka WMS · Documento comprobatório</p>
  <p>
    Eu, <strong>${escapeHtml(input.release.released_by_name)}</strong>, responsável pela liberação no
    <strong>${escapeHtml(input.originName)}</strong>, autorizo a saída e transferência dos itens abaixo para o
    <strong>${escapeHtml(input.destinationName)}</strong>.
  </p>
  <table>
    <tr><th>Produto</th><td>${escapeHtml(input.productName)}</td></tr>
    <tr><th>Código LS</th><td>${escapeHtml(input.productCode)}</td></tr>
    <tr><th>Quantidade</th><td>${escapeHtml(String(input.quantity))} un.</td></tr>
    <tr><th>Rota</th><td>${escapeHtml(input.originName)} → ${escapeHtml(input.destinationName)}</td></tr>
    <tr><th>Motorista</th><td>${escapeHtml(input.release.driver_name)}</td></tr>
    <tr><th>CPF</th><td>${escapeHtml(input.release.driver_cpf ?? '—')}</td></tr>
    <tr><th>Empresa</th><td>${escapeHtml(input.release.company_name ?? '—')}</td></tr>
    <tr><th>CNPJ</th><td>${escapeHtml(input.release.company_cnpj ?? '—')}</td></tr>
    <tr><th>Placa</th><td>${escapeHtml(input.release.driver_plate ?? '—')}</td></tr>
    <tr><th>Assinado em</th><td>${escapeHtml(signedAt)}</td></tr>
  </table>
  <p>
    Declaro ter conferido fisicamente os produtos e quantidades. A assinatura abaixo comprova minha anuência
    para auditoria e rastreio entre centros de distribuição.
  </p>
  <div class="sign-block">
    <div>
      <img src="${input.release.signature_data_url}" alt="Assinatura" />
      <p class="sign-meta">${escapeHtml(input.release.released_by_name)} · Responsável pela liberação</p>
    </div>
  </div>
  <p class="foot">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))} · LogStoka</p>
</body>
</html>`;

  openPrintDocument(html);
}
