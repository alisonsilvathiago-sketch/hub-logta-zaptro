import React from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Printer,
  RefreshCw,
  ScanLine,
  Share2,
} from 'lucide-react';
import LogstokaTableIconToolbar, { type LogstokaToolbarAction } from '@/components/ui/LogstokaTableIconToolbar';

type Props = {
  loading?: boolean;
  onRefresh: () => void;
  onNewEntry: () => void;
  onImportXml: () => void;
  onImportCsv: () => void;
  onImportExcel: () => void;
  onImportPdf: () => void;
  onPrint: () => void;
  onShare: () => void;
  scanLabel?: string;
};

const EntryToolbar: React.FC<Props> = ({
  loading,
  onRefresh,
  onNewEntry,
  onImportXml,
  onImportCsv,
  onImportExcel,
  onImportPdf,
  onPrint,
  onShare,
  scanLabel = 'Scanner inteligente — nova entrada',
}) => {
  const actions: LogstokaToolbarAction[] = [
    {
      key: 'refresh',
      label: 'Atualizar lista',
      icon: <RefreshCw size={18} strokeWidth={2} className={loading ? 'animate-spin' : undefined} />,
      onClick: onRefresh,
      disabled: loading,
    },
    {
      key: 'scan',
      label: scanLabel,
      icon: <ScanLine size={18} strokeWidth={2} />,
      onClick: onNewEntry,
      accent: true,
    },
    {
      key: 'import-sep',
      label: 'Importar XML NF-e',
      icon: <FileUp size={18} strokeWidth={2} />,
      onClick: onImportXml,
      separatorBefore: true,
    },
    {
      key: 'excel',
      label: 'Importar Excel',
      icon: <FileSpreadsheet size={18} strokeWidth={2} />,
      onClick: onImportExcel,
    },
    {
      key: 'csv',
      label: 'Importar CSV',
      icon: <Download size={18} strokeWidth={2} />,
      onClick: onImportCsv,
    },
    {
      key: 'pdf',
      label: 'Importar PDF',
      icon: <FileText size={18} strokeWidth={2} />,
      onClick: onImportPdf,
    },
    {
      key: 'print-sep',
      label: 'Imprimir lista',
      icon: <Printer size={18} strokeWidth={2} />,
      onClick: onPrint,
      separatorBefore: true,
    },
    {
      key: 'share',
      label: 'Compartilhar lista',
      icon: <Share2 size={18} strokeWidth={2} />,
      onClick: onShare,
    },
  ];

  return <LogstokaTableIconToolbar actions={actions} ariaLabel="Ações da tabela" className="ls-entry-toolbar" />;
};

export default EntryToolbar;
