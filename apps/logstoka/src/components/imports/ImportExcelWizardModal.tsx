import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp, ScanLine, Sheet, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ImportVerifyOverlay from '@/components/imports/ImportVerifyOverlay';
import Modal from '@/components/ui/Modal';
import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import { IMPORT_SPREADSHEET_COLUMNS } from '@/lib/importSpreadsheetSchema';
import {
  downloadOfficialImportTemplate,
  openGoogleSheetsForEdit,
} from '@/lib/importSpreadsheetParser';
import {
  detectImportFile,
  isSupportedImportFile,
  parseImportFileSmart,
  type ImportFileDetection,
} from '@/lib/importFileIntelligence';
import { validateImportSpreadsheet, type ImportValidationResult } from '@/lib/importSpreadsheetValidator';
import './importExcelWizard.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onVerifiedApply: (file: File, result: ImportValidationResult) => void;
};

const ACCEPT_IMPORT =
  '.xlsx,.xls,.csv,.txt,.tsv,.tab,.pdf,.json,.log,.dat,.md,.rtf,image/*';

function preventDragDefaults(event: React.DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

const ImportExcelWizardModal: React.FC<Props> = ({ open, onClose, onVerifiedApply }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<ImportFileDetection | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDetection(null);
      setVerifyOpen(false);
      setDropActive(false);
    }
  }, [open]);

  const pickFile = async (next: File) => {
    if (!isSupportedImportFile(next)) {
      toast.error('Formato não reconhecido. Use Excel, CSV, TXT, PDF ou imagem.');
      return;
    }
    const sample = await next.slice(0, 4096).text().catch(() => '');
    const detected = detectImportFile(next, sample);
    setFile(next);
    setDetection(detected);
  };

  const runValidate = useCallback(async (): Promise<ImportValidationResult> => {
    if (!file) {
      return {
        valid: false,
        score: 0,
        rows_total: 0,
        rows_ok: 0,
        column_issues: [],
        line_issues: [],
        lines: [],
        summary: 'Nenhum arquivo selecionado',
        column_map: {},
        headers: [],
        raw_rows: [],
      };
    }

    const parsed = await parseImportFileSmart(file);
    const validation = validateImportSpreadsheet(parsed);

    if (parsed.aiAssisted && parsed.aiSummary) {
      return {
        ...validation,
        summary: `${LOGSTOKA_AI_BRAND}: ${parsed.aiSummary}${validation.valid ? '' : ` · ${validation.summary}`}`,
      };
    }

    if (parsed.detection.kind === 'pdf' && validation.rows_total === 0) {
      return {
        ...validation,
        summary:
          parsed.aiSummary ??
          'PDF detectado — o Aiato precisa da API online para extrair linhas. Tente CSV/Excel ou conecte o servidor.',
      };
    }

    return {
      ...validation,
      summary: validation.summary.replace(/^Planilha/, 'Documento'),
    };
  }, [file]);

  const handleApply = (result: ImportValidationResult) => {
    if (!file) return;
    onVerifiedApply(file, result);
    setVerifyOpen(false);
    onClose();
    toast.success(`${result.rows_ok} linha(s) aplicadas no estoque`);
  };

  return (
    <>
      <Modal
        open={open && !verifyOpen}
        size="wide"
        paddingVariant="balanced"
        panelClassName="ls-import-wizard-panel"
        title="Importar vendas / relatório"
        subtitle={`Excel, CSV, TXT, PDF e mais · ${LOGSTOKA_AI_BRAND} identifica o formato automaticamente`}
        icon={<FileUp size={20} strokeWidth={2.25} />}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="ls-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="ls-btn-primary"
              disabled={!file}
              onClick={() => setVerifyOpen(true)}
            >
              <ScanLine size={16} />
              Verificar documento
            </button>
          </>
        }
      >
        <div className="ls-import-wizard">
          <div className="ls-import-wizard__hero">
            <p>
              Baixe o modelo com colunas corretas ou envie o arquivo que você já tem — Excel, CSV, TXT, PDF ou
              exportação de marketplace. O {LOGSTOKA_AI_BRAND} detecta o tipo e mapeia colunas antes de gerar saídas.
            </p>
            <div className="ls-import-wizard__columns">
              {IMPORT_SPREADSHEET_COLUMNS.map((col) => (
                <span
                  key={col.key}
                  className={`ls-import-wizard__col-chip${col.required ? ' ls-import-wizard__col-chip--req' : ''}`}
                  title={col.hint}
                >
                  {col.header}
                </span>
              ))}
            </div>
            <div className="ls-import-wizard__actions mt-4">
              <button
                type="button"
                className="ls-btn-secondary text-sm"
                onClick={() => {
                  downloadOfficialImportTemplate();
                  toast.success('Modelo logstoka-modelo-importacao.xlsx baixado');
                }}
              >
                <Download size={15} />
                Baixar modelo Excel
              </button>
              <button
                type="button"
                className="ls-btn-secondary text-sm"
                onClick={() => {
                  openGoogleSheetsForEdit(
                    IMPORT_SPREADSHEET_COLUMNS.map((c) => c.header),
                    [],
                  );
                  toast('Planilha copiada — cole no Google Sheets com Ctrl+V', { icon: '📋' });
                }}
              >
                <Sheet size={15} />
                Editar no Google Sheets
              </button>
            </div>
          </div>

          <div
            className={`ls-import-wizard__drop${dropActive ? ' ls-import-wizard__drop--active' : ''}`}
            onDragEnter={(e) => {
              preventDragDefaults(e);
              setDropActive(true);
            }}
            onDragOver={preventDragDefaults}
            onDragLeave={(e) => {
              preventDragDefaults(e);
              setDropActive(false);
            }}
            onDrop={(e) => {
              preventDragDefaults(e);
              setDropActive(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) void pickFile(dropped);
            }}
          >
            <FileUp size={32} className="mx-auto text-orange-500" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-bold text-[#383838]">Arraste seu arquivo de vendas</p>
            <p className="mt-1 text-xs font-semibold text-[#737373]">
              .xlsx · .csv · .txt · .pdf · .tsv · imagem
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_IMPORT}
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = '';
              }}
            />
            <button type="button" className="ls-btn-primary mt-4 text-sm" onClick={() => inputRef.current?.click()}>
              Selecionar arquivo
            </button>
            {file ? (
              <div className="ls-import-wizard__file-meta">
                <p className="ls-import-wizard__file-name">{file.name}</p>
                {detection ? (
                  <p className="ls-import-wizard__file-detect">
                    <Sparkles size={13} aria-hidden />
                    {LOGSTOKA_AI_BRAND} identificou: <strong>{detection.label}</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <ImportVerifyOverlay
        open={verifyOpen}
        fileName={file?.name ?? 'documento'}
        onClose={() => setVerifyOpen(false)}
        validate={runValidate}
        onApply={handleApply}
      />
    </>
  );
};

export default ImportExcelWizardModal;
