import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number | 'all';
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number | 'all') => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  
  if (totalItems === 0) return null;

  const startItem = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = itemsPerPage === 'all' ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

  const options = [10, 20, 40, 50, 100, 200, 'all'];

  return (
    <div style={styles.paginationContainer}>
      <div style={styles.paginationInfo}>
        Mostrando <span style={styles.bold}>{startItem}-{endItem}</span> de <span style={styles.bold}>{totalItems}</span> registros
      </div>
      
      <div style={styles.paginationControls}>
        <div style={styles.limitSelector}>
          <select 
            value={itemsPerPage} 
            onChange={(e) => onItemsPerPageChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={styles.select}
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt === 'all' ? 'Mostrar todos' : `${opt} por página`}</option>
            ))}
          </select>
        </div>

        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div style={styles.pageButtons}>
            <button 
              onClick={() => onPageChange(1)} 
              disabled={currentPage === 1}
              style={{...styles.pageBtn, ...(currentPage === 1 ? styles.disabledIcon : {})}}
              title="Início"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              onClick={() => onPageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{...styles.pageBtn, ...(currentPage === 1 ? styles.disabledIcon : {})}}
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div style={styles.pageNum}>
              Página <span style={styles.bold}>{currentPage}</span> de <span style={styles.bold}>{totalPages}</span>
            </div>

            <button 
              onClick={() => onPageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              style={{...styles.pageBtn, ...(currentPage === totalPages ? styles.disabledIcon : {})}}
              title="Próximo"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => onPageChange(totalPages)} 
              disabled={currentPage === totalPages}
              style={{...styles.pageBtn, ...(currentPage === totalPages ? styles.disabledIcon : {})}}
              title="Última"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: 'white',
    borderTop: '1px solid #F1F5F9',
    marginTop: 'auto',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#64748B',
    letterSpacing: '0.2px',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  limitSelector: {
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: '#F8FAFC',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  pageButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: 'white',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  disabledIcon: {
    opacity: 0.3,
    cursor: 'not-allowed',
    backgroundColor: '#F8FAFC',
  },
  pageNum: {
    fontSize: '12px',
    color: '#64748B',
    padding: '0 8px',
    fontWeight: '500',
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  }
};

export default Pagination;
