import React from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSync } from '@core/context/SyncContext';

const SyncIndicator: React.FC = () => {
  const { status, triggerRefresh } = useSync();

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return { 
          color: '#6366F1', 
          icon: <RefreshCw size={18} className="sync-spin" />, 
          text: 'Sincronizando com Zapto e Logta...' 
        };
      case 'success':
        return { 
          color: '#10B981', 
          icon: <Check size={18} />, 
          text: 'Dados sincronizados com sucesso!' 
        };
      case 'error':
        return { 
          color: '#EF4444', 
          icon: <AlertCircle size={18} />, 
          text: 'Erro ao sincronizar dados.' 
        };
      default:
        return { 
          color: '#94A3B8', 
          icon: <RefreshCw size={18} />, 
          text: 'Clique para sincronizar agora' 
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      <div 
        style={{
          ...styles.floatingWrapper,
          borderColor: status === 'idle' ? '#E2E8F0' : config.color,
          boxShadow: status === 'idle' ? '0 4px 12px rgba(0,0,0,0.05)' : `0 4px 12px ${config.color}33`
        }}
        onClick={triggerRefresh}
        title={config.text}
      >
        <div style={{ ...styles.iconBox, color: config.color }}>
          {config.icon}
        </div>
        
        {status !== 'idle' && (
          <span style={{ ...styles.statusText, color: config.color }}>
            {status === 'syncing' ? 'Sincronizando...' : status === 'success' ? 'Sucesso' : 'Erro'}
          </span>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sync-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sync-spin {
          animation: sync-spin 1.2s linear infinite;
        }
      `}} />
    </>
  );
};

const styles: Record<string, any> = {
  floatingWrapper: {
    height: '40px',
    backgroundColor: 'white',
    borderRadius: '24px',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    width: 'fit-content'
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  statusText: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap'
  }
};

export default SyncIndicator;
