import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';

export function downloadCsvTemplate(
  filename: string,
  headers: string[],
  exampleRow?: string[],
  successMessage?: string,
): void {
  const row = exampleRow ?? headers.map(() => '');
  const csvContent = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  notifyZaptro(
    'success',
    'Modelo baixado',
    successMessage ?? 'Preencha o arquivo e use «Importar» na barra da lista.',
  );
}
