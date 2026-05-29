import React from 'react';
import { Search, FileText, FileSpreadsheet } from 'lucide-react';
import { toastSuccess } from '@core/lib/toast';

const toolbarBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  flex: '1 1 180px',
  minWidth: '160px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  fontSize: '13px',
  fontWeight: 600,
  outline: 'none',
  backgroundColor: '#F8FAFC',
};

export type DetailHistorySectionProps = {
  heading: string;
  hint: string;
  searchPlaceholder?: string;
  searchDraft: string;
  onSearchDraftChange: (v: string) => void;
  onApplySearch: () => void;
  listMaxHeight?: number;
  exportStem: string;
  children: React.ReactNode;
};

export function DetailHistorySection({
  heading,
  hint,
  searchPlaceholder = 'Pesquisar na lista…',
  searchDraft,
  onSearchDraftChange,
  onApplySearch,
  listMaxHeight = 280,
  exportStem,
  children,
}: DetailHistorySectionProps) {
  const onPdf = () => toastSuccess(`Gerando PDF: ${exportStem}.pdf`);
  const onExcel = () => toastSuccess(`Exportando planilha: ${exportStem}.xlsx`);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '16px 0 15px 27px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{heading}</h3>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748B', paddingRight: '20px' }}>{hint}</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '12px',
          paddingRight: '16px',
        }}
      >
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchDraft}
          onChange={e => onSearchDraftChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onApplySearch();
          }}
          style={inputStyle}
        />
        <button type="button" onClick={onApplySearch} style={toolbarBtn}>
          <Search size={14} /> Pesquisar
        </button>
        <button type="button" onClick={onPdf} style={toolbarBtn}>
          <FileText size={14} /> PDF
        </button>
        <button type="button" onClick={onExcel} style={toolbarBtn}>
          <FileSpreadsheet size={14} /> Excel
        </button>
      </div>
      <div
        style={{
          maxHeight: listMaxHeight,
          overflowY: 'auto',
          paddingRight: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const detailHistoryRowTitle: React.CSSProperties = {
  fontWeight: 600,
  color: '#0F172A',
};
