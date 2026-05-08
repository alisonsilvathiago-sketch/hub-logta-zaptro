import React, { useEffect, useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';

/**
 * Lista e edição de credenciais em master_settings (antes só em Configurações › Interações).
 * Mantido acessível em Integrações › Cofre de chaves.
 */
const MasterCredentialsVault: React.FC = () => {
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [dbApis, setDbApis] = useState<any[]>([]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_settings')
        .select('*')
        .in('key', ['SENDGRID_CONFIG', 'ASAAS_CONFIG', 'GOOGLE_SERVICE_ACCOUNT_KEY']);

      if (error) throw error;

      const formattedApis = (data || []).map((item) => {
        let name = '';
        let provider = '';
        let key = '';

        if (item.key === 'SENDGRID_CONFIG') {
          name = 'SendGrid API Key';
          provider = 'Transactional Mail & SMTP';
          key = item.value?.api_key || '';
        } else if (item.key === 'ASAAS_CONFIG') {
          name = 'Asaas Core Token';
          provider = 'Payments & Billing Engine';
          key = item.value?.api_key || '';
        } else if (item.key === 'GOOGLE_SERVICE_ACCOUNT_KEY') {
          name = 'Google Cloud Identity';
          provider = 'Infrastructure & Workspace';
          key = item.value?.private_key_id || 'Configurado';
        }

        return { id: item.key, name, provider, key, raw: item.value };
      });

      setDbApis(formattedApis);
    } catch {
      toastError('Erro de Configuração: Falha ao carregar chaves do ecossistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const saveApiValue = async (key: string, newValue: string) => {
    const tid = toastLoading(`Atualizando ${key} no cofre master...`);
    try {
      const current = dbApis.find((a) => a.id === key)?.raw || {};
      const updatedValue = { ...current, api_key: newValue };

      const { error } = await supabase.from('master_settings').upsert({ key, value: updatedValue }, { onConflict: 'key' });

      if (error) throw error;

      toastSuccess(`Credencial "${key}" sincronizada com sucesso!`);
      fetchConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toastError(`Falha Crítica: Não foi possível salvar a credencial. Erro: ${msg}`);
    } finally {
      toastDismiss(tid);
    }
  };

  const toggleKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const btn: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    letterSpacing: '0.4px',
  };

  const listItem: React.CSSProperties = {
    padding: '20px 24px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s',
    backgroundColor: '#f8fafc',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const itemLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px' };
  const iconBox: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#f1f5f9',
    color: '#475569',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Credenciais em <code style={{ fontSize: '12px' }}>master_settings</code>. Perfis master apenas.
      </p>
      {dbApis.map((api) => (
        <div key={api.id} style={listItem}>
          <div style={itemLeft}>
            <div style={iconBox}>
              <Key size={20} />
            </div>
            <div>
              <h4
                style={{
                  margin: '0 0 2px 0',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: 'var(--secondary)',
                  letterSpacing: '0.2px',
                }}
              >
                {api.name}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                {api.provider}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type={revealedKeys[api.id] ? 'text' : 'password'}
              value={api.key}
              onChange={(e) => {
                const newApis = [...dbApis];
                const idx = newApis.findIndex((a) => a.id === api.id);
                newApis[idx].key = e.target.value;
                setDbApis(newApis);
              }}
              style={{
                fontSize: '13px',
                color: 'var(--secondary)',
                backgroundColor: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                minWidth: 'min(280px, 100%)',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              type="button"
              style={{
                ...btn,
                backgroundColor: 'white',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
                width: '40px',
                padding: '0',
                display: 'flex',
                justifyContent: 'center',
              }}
              onClick={() => toggleKey(api.id)}
            >
              {revealedKeys[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              style={{ ...btn, backgroundColor: 'var(--accent)', color: 'white' }}
              onClick={() => saveApiValue(api.id, api.key)}
            >
              SINCRONIZAR
            </button>
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          Sincronizando chaves master...
        </div>
      )}
    </div>
  );
};

export default MasterCredentialsVault;
