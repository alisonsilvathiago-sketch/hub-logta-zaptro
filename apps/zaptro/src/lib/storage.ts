import { supabase } from './supabase';

export interface FileUploadParams {
  file: File;
  companyId: string;
  category: string;
  userId: string;
  entityId?: string;
  entityType?: 'cliente' | 'veiculo' | 'zaptro' | 'staff';
}

/**
 * Uploads a file to the Hub Drive with automated hierarchical organization.
 * Integrated with Zaptro & Logta.
 */
export const uploadFile = async ({ 
  file, 
  companyId, 
  category = 'documentos', 
  userId,
  entityId,
  entityType = 'zaptro'
}: FileUploadParams) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    let filePath = '';

    // 1. Definição do Path Automático (Padrão Hub Drive)
    if (entityType === 'cliente') {
      filePath = `${companyId}/clientes/${entityId}/${category}/${date}-${file.name}`;
    } else if (entityType === 'veiculo') {
      filePath = `${companyId}/veiculos/${entityId}/${category}/${file.name}`;
    } else if (entityType === 'staff') {
      filePath = `${companyId}/staff/${entityId}/${category}/${file.name}`;
    } else {
      filePath = `${companyId}/zaptro/${category}/${date}-${file.name}`;
    }

    // 2. Upload para o Supabase Storage (Bucket Centralizado)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('hub-drive')
      .upload(filePath, file, { upsert: true });

    if (storageError) throw storageError;

    // 3. Registro no Banco de Dados (Metadados Estruturados para o Drive)
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          category: category,
          entity_type: entityType,
          client_id: entityType === 'cliente' ? entityId : null,
          vehicle_id: entityType === 'veiculo' ? entityId : null,
          metadata: { 
            source: 'zaptro_app', 
            auto_archived: true,
            original_category: category 
          }
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Log de Auditoria no Hub
    await supabase.from('file_logs').insert({
      file_id: dbData.id,
      action: 'AUTO_ARCHIVE',
      user_id: userId,
      company_id: companyId,
      details: `Arquivo ${file.name} arquivado automaticamente via Zaptro App.`
    });

    return { data: dbData, path: filePath };
  } catch (error: any) {
    console.error('Erro no upload Hub Drive:', error.message);
    throw error;
  }
};

export const listCompanyFiles = async (companyId: string, category?: string) => {
  let query = supabase
    .from('files')
    .select('*')
    .eq('company_id', companyId);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
