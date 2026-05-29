import React from 'react';
import { useParams } from 'react-router-dom';
import { FileUp, ScanLine } from 'lucide-react';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoImportById } from '@/lib/logstokaDemoSeed';

const ImportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const row = id && isLogstokaDemoCompany(companyId) ? getDemoImportById(id) : null;

  if (!row) {
    return (
      <LogstokaDetailPageLayout backTo="/app/imports" title="Importação" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Importação não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo="/app/imports"
      backLabel="Voltar para importações"
      title={row.file_name}
      subtitle={`Tipo ${row.file_type.toUpperCase()} · ${row.rows_processed} linhas processadas`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ls-card space-y-3">
          {[
            ['Arquivo', row.file_name],
            ['Tipo', row.file_type],
            ['Status', row.status],
            ['Linhas', String(row.rows_processed)],
            ['Data', new Date(row.created_at).toLocaleString('pt-BR')],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between border-b border-slate-100 pb-2 text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-bold">{value}</span>
            </div>
          ))}
        </div>
        <div className="ls-card flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            {row.file_type === 'xml'
              ? 'NF-e convertida em entrada automática com itens endereçados no CD.'
              : 'Relatório convertido em movimentações de saída por marketplace.'}
          </p>
          <button type="button" className="ls-btn-secondary">
            <FileUp size={16} />
            Reprocessar arquivo
          </button>
          {row.file_type === 'ocr' ? (
            <button type="button" className="ls-btn-secondary">
              <ScanLine size={16} />
              Ver imagem original OCR
            </button>
          ) : null}
        </div>
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default ImportDetailPage;
