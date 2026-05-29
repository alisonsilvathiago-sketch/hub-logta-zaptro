import React, { useId } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import './zaptroListImportToolbar.css';

type Props = {
  onExport: () => void;
  onImport: (file: File) => void | Promise<void>;
  onDownloadTemplate: () => void;
  exportLabel?: string;
  importLabel?: string;
  templateLabel?: string;
  exportTitle?: string;
  importTitle?: string;
  templateTitle?: string;
  exportDisabled?: boolean;
  inputId?: string;
  className?: string;
};

export const ZaptroListImportToolbar: React.FC<Props> = ({
  onExport,
  onImport,
  onDownloadTemplate,
  exportLabel = 'Baixar lista',
  importLabel = 'Importar',
  templateLabel = 'Modelo',
  exportTitle = 'Exportar lista visível para Excel/CSV',
  importTitle = 'Importar de CSV ou Excel',
  templateTitle = 'Baixar modelo CSV para preencher e importar',
  exportDisabled = false,
  inputId,
  className = '',
}) => {
  const autoId = useId();
  const fileInputId = inputId ?? `zaptro-import-${autoId.replace(/:/g, '')}`;

  return (
    <div className={`zaptro-list-import-toolbar ${className}`.trim()}>
      <button
        type="button"
        className="hub-premium-pill secondary zaptro-list-import-toolbar__btn"
        onClick={onExport}
        disabled={exportDisabled}
        title={exportTitle}
      >
        <span className="zaptro-list-import-toolbar__btn-icon" aria-hidden>
          <Download size={16} strokeWidth={2} />
        </span>
        {exportLabel}
      </button>
      <button
        type="button"
        className="hub-premium-pill dark zaptro-list-import-toolbar__btn"
        onClick={() => document.getElementById(fileInputId)?.click()}
        title={importTitle}
      >
        <span className="zaptro-list-import-toolbar__btn-icon" aria-hidden>
          <Upload size={16} strokeWidth={2} />
        </span>
        {importLabel}
      </button>
      <button
        type="button"
        className="hub-premium-pill secondary zaptro-list-import-toolbar__btn zaptro-list-import-toolbar__btn--muted"
        onClick={onDownloadTemplate}
        title={templateTitle}
      >
        <span className="zaptro-list-import-toolbar__btn-icon" aria-hidden>
          <FileSpreadsheet size={16} strokeWidth={2} />
        </span>
        {templateLabel}
      </button>
      <input
        id={fileInputId}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImport(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default ZaptroListImportToolbar;
