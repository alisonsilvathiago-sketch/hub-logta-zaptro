import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CloudUpload, FileText, Download, Trash2, Plus, RefreshCw, X } from 'lucide-react';

interface FileUploaderProps {
  companyId: string;
  clientId: string;
  module: 'crm' | 'chat' | 'financeiro' | 'documentos' | 'outros';
  referenceId: string;
  onAction?: () => void;
}

const COLORS = {
  primary: '#1E293B',
  accent: '#6366F1',
  muted: '#64748B',
  danger: '#EF4444'
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function UnifiedFileUploader({ companyId, clientId, module, referenceId, onAction }: FileUploaderProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (clientId && module && referenceId) {
      fetchFiles();
    }
  }, [clientId, module, referenceId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('files')
        .select('*')
        .eq('client_id', clientId)
        .eq('category', module)
        .order('created_at', { ascending: false });
      setFiles(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Arquivo muito grande (máx 20MB)');
      return;
    }

    setUploading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const filePath = `${companyId}/clientes/${clientId}/${module}/${date}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('hub-drive')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          company_id: companyId,
          client_id: clientId,
          category: module,
          entity_type: 'cliente',
          name: file.name,
          path: filePath,
          type: file.type,
          size: file.size,
          metadata: { 
            source: 'unified_uploader', 
            reference_id: referenceId,
            auto_archived: true 
          }
        });

      if (dbError) throw dbError;

      fetchFiles();
      if (onAction) onAction();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('hub-drive')
        .createSignedUrl(file.path, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar arquivo.');
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm('Deseja excluir este arquivo?')) return;

    try {
      await supabase.storage.from('hub-drive').remove([file.path]);
      await supabase.from('files').delete().eq('id', file.id);
      fetchFiles();
      if (onAction) onAction();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir arquivo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '900', color: COLORS.primary }}>Arquivos & Documentos</h3>
          <p style={{ fontSize: '12px', color: COLORS.muted }}>Sincronizado automaticamente com o Hub Drive</p>
        </div>
        <label style={{ 
          background: COLORS.accent, color: '#fff', padding: '10px 20px', borderRadius: '12px', 
          fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
        }}>
          {uploading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
          ADICIONAR
          <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}><RefreshCw className="animate-spin" size={24} color={COLORS.accent} /></div>
      ) : files.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {files.map(file => (
            <div key={file.id} style={{ 
              background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s', position: 'relative'
            }} className="hover-scale">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.accent }}>
                  <FileText size={20} />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleDownload(file)} style={{ background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer', padding: '6px' }} title="Download">
                    <Download size={16} />
                  </button>
                  <button onClick={() => handleDelete(file)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', padding: '6px' }} title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: COLORS.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '10px', color: COLORS.muted, fontWeight: '700' }}>{formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '20px', border: '2px dashed #E2E8F0' 
        }}>
          <CloudUpload size={32} color="#CBD5E1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8' }}>Pasta vazia.</div>
        </div>
      )}
    </div>
  );
}
