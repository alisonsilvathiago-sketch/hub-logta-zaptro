import React, { useState, useEffect } from 'react';
import { 
  Key, Globe, Shield, Copy, Plus, 
  Trash2, RefreshCw, CheckCircle2, 
  Code, Terminal, Lock, Info
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';
import { toast } from 'react-hot-toast';

const UserAPIs: React.FC = () => {
  const { user, profile } = useAuth();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchApiKeys();
    }
  }, [user, profile]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('company_id', profile?.company_id);
      
      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error('Erro ao buscar chaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    setIsGenerating(true);
    try {
      const newKey = `ld_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const { error } = await supabase
        .from('api_keys')
        .insert({
          company_id: profile?.company_id,
          key: newKey,
          label: `Produção - ${new Date().toLocaleDateString()}`,
          created_by: user?.id
        });

      if (error) throw error;
      toast.success('Chave de API gerada com sucesso!');
      fetchApiKeys();
    } catch (err: any) {
      toast.error('Erro ao gerar chave: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta chave? Ela parará de funcionar imediatamente.')) return;
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Chave excluída.');
      fetchApiKeys();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>APIs & Webhooks</h1>
          <p style={styles.subtitle}>Gerencie suas chaves de acesso e integre o LogDock com seu ecossistema logístico.</p>
        </div>
        <button 
          style={styles.generateBtn} 
          onClick={generateKey}
          disabled={isGenerating}
        >
          {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
          Gerar nova chave
        </button>
      </div>

      <div style={styles.content}>
        {/* Keys List */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.iconBox}><Key size={20} color="#0061FF" /></div>
            <div>
              <h2 style={styles.sectionTitle}>Chaves de API Ativas</h2>
              <p style={styles.sectionSubtitle}>Use estas chaves para autenticar suas requisições REST.</p>
            </div>
          </div>

          <div style={styles.keyList}>
            {loading ? (
              <div style={styles.emptyState}>Buscando chaves...</div>
            ) : apiKeys.length === 0 ? (
              <div style={styles.emptyState}>Nenhuma chave de API gerada ainda.</div>
            ) : (
              apiKeys.map(k => (
                <div key={k.id} style={styles.keyCard}>
                  <div style={styles.keyInfo}>
                    <span style={styles.keyLabel}>{k.label}</span>
                    <code style={styles.keyCode}>{k.key.substring(0, 8)}****************</code>
                  </div>
                  <div style={styles.keyActions}>
                    <button style={styles.actionBtn} onClick={() => copyToClipboard(k.key)} title="Copiar"><Copy size={16} /></button>
                    <button style={styles.deleteBtn} onClick={() => deleteKey(k.id)} title="Excluir"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Documentation / Info */}
        <div style={styles.sidebar}>
          <div style={styles.infoCard}>
            <div style={styles.infoTitle}><Code size={18} /> Documentação Rápida</div>
            <p style={styles.infoText}>Base URL: <code>https://api.logdock.com/v1</code></p>
            <div style={styles.codeSnippet}>
              curl -X GET "https://api.logdock.com/v1/files" \<br/>
              -H "Authorization: Bearer YOUR_API_KEY"
            </div>
          </div>

          <div style={styles.securityCard}>
            <div style={styles.infoTitle}><Shield size={18} color="#10B981" /> Segurança</div>
            <p style={styles.infoText}>Nunca compartilhe suas chaves. Recomendamos rotacionar suas chaves a cada 90 dias.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', backgroundColor: '#F8F9FA', minHeight: '100vh', animation: 'fadeIn 0.5s ease-out' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', marginBottom: '8px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '15px', color: '#64748B', fontWeight: '500' },
  generateBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#1E1E1E', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  
  content: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' },
  section: { backgroundColor: '#FFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', gap: '16px', marginBottom: '32px' },
  iconBox: { width: '44px', height: '44px', backgroundColor: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1E1E1E', marginBottom: '4px' },
  sectionSubtitle: { fontSize: '13px', color: '#64748B', fontWeight: '500' },
  
  keyList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  keyCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0' },
  keyInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  keyLabel: { fontSize: '13px', fontWeight: '700', color: '#1E1E1E' },
  keyCode: { fontSize: '12px', color: '#64748B', fontFamily: 'monospace', backgroundColor: '#FFF', padding: '2px 8px', borderRadius: '4px' },
  keyActions: { display: 'flex', gap: '8px' },
  actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' },
  deleteBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer' },
  
  emptyState: { padding: '40px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '14px', border: '2px dashed #E2E8F0', borderRadius: '16px' },
  
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoCard: { backgroundColor: '#1E1E1E', borderRadius: '24px', padding: '24px', color: '#FFF' },
  securityCard: { backgroundColor: '#ECFDF5', borderRadius: '24px', padding: '24px', border: '1px solid #A7F3D0' },
  infoTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '800', marginBottom: '16px' },
  infoText: { fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '16px' },
  codeSnippet: { backgroundColor: '#2A2A2A', padding: '12px', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace', color: '#10B981', lineHeight: '1.5' }
};

export default UserAPIs;
