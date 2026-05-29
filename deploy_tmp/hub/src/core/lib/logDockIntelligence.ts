
import { supabase } from './supabase';

/**
 * LogDock Intelligence Service
 * Handles OCR (Simulated) and AI Analysis for logistics documents.
 */

export const analyzeFileIntelligence = async (fileId: string, filePath: string, fileName: string) => {
  try {
    console.log(`[LogDock Intelligence] Iniciando análise para: ${fileName}`);

    // 1. Simulação de OCR (Extracão de Texto)
    // Em produção, isso usaria Tesseract.js ou Google Vision API
    const simulatedOcrText = `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS LOGÍSTICOS
      CONTRATANTE: Empresa Logta Tecnologia LTDA
      CONTRATADO: Transportadora Zaptro S.A.
      VALOR MENSAL: R$ 15.400,00
      DATA DE VIGÊNCIA: 01/05/2026 a 01/05/2027
      CLÁUSULA DE RESCISÃO: Aviso prévio de 30 dias com multa de 10%.
    `;

    // 2. Análise da IA (Master Strategist)
    // Simula chamada para GPT-4 para extrair entidades e riscos
    const aiAnalysis = {
      parties: {
        contractor: "Empresa Logta Tecnologia LTDA",
        contracted: "Transportadora Zaptro S.A."
      },
      financials: {
        monthly_value: 15400,
        total_contract_value: 184800,
        currency: "BRL"
      },
      dates: {
        start: "2026-05-01",
        end: "2027-05-01"
      },
      risks: [
        "Multa de 10% por rescisão antecipada.",
        "Ausência de cláusula de reajuste por IPCA."
      ],
      summary: "Contrato padrão de logística com renovação anual automática.",
      status_update: fileName.toLowerCase().includes('problema') ? 'problema' : 'entregue'
    };

    // 3. Atualiza o banco de dados com a inteligência
    const { error } = await supabase.from('files').update({
      ocr_text: simulatedOcrText,
      ai_analysis: aiAnalysis,
      status: aiAnalysis.status_update
    }).eq('id', fileId);

    if (error) throw error;

    // 4. Log de Auditoria Master
    await supabase.from('file_logs').insert({
      file_id: fileId,
      action: 'AI_ANALYSIS_COMPLETE',
      details: `IA Master processou o documento ${fileName} e extraiu termos contratuais.`
    });

    return { success: true, analysis: aiAnalysis };
  } catch (err) {
    console.error('Drive Intelligence Error:', err);
    return { success: false, error: err };
  }
};

/**
 * Saves a file to the LogDock with automated hierarchical organization.
 * Paths: /company_id/clientes/entity_id/category/filename
 */
export const saveEntityToLogDock = async ({
  company_id,
  type, // 'cliente', 'veiculo', 'zaptro', 'logta', 'geral'
  entity_id,
  file,
  category, // 'documentos', 'contratos', 'orcamentos', 'comprovantes', 'fotos', 'conversas'
  metadata = {}
}: {
  company_id: string;
  type: 'cliente' | 'veiculo' | 'zaptro' | 'logta' | 'geral';
  entity_id?: string;
  file: File;
  category: string;
  metadata?: any;
}) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    let path = '';

    // ESTRUTURA ORGANIZADA POR EMPRESA E TIPO (Regra de Ouro)
    if (type === 'cliente' && entity_id) {
      path = `${company_id}/Empresas/${entity_id}/${category}/${date}-${file.name}`;
    } else if (type === 'veiculo' && entity_id) {
      path = `${company_id}/Veiculos/${entity_id}/${category}/${file.name}`;
    } else if (type === 'zaptro') {
      // Integração WhatsApp: Identifica e salva na pasta do cliente correspondente
      const targetFolder = entity_id ? `Conversas/WhatsApp/${entity_id}` : 'Conversas/WhatsApp/Geral';
      path = `${company_id}/Empresas/${targetFolder}/${date}-${file.name}`;
    } else if (type === 'logta') {
      path = `${company_id}/Equipe/Interno/Arquivos/${file.name}`;
    } else {
      path = `${company_id}/Sistema/Geral/${category}/${file.name}`;
    }

    // 1. Upload para o Storage Central (Bucket: hub-drive)
    const { error: uploadError } = await supabase.storage
      .from('logdock')
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Registro no Banco de Dados (Metadados Estruturados)
    const { data: fileData, error: insertError } = await supabase.from('files').insert({
      company_id,
      name: file.name,
      path,
      type: file.type,
      size: file.size,
      entity_type: type,
      client_id: type === 'cliente' ? entity_id : (type === 'zaptro' ? entity_id : null),
      vehicle_id: type === 'veiculo' ? entity_id : null,
      category,
      is_public: false, // Default is private (Guardian)
      status: 'pendente',
      metadata: { 
        ...metadata, 
        auto_archived: true, 
        source: type,
        full_path: path
      }
    }).select().single();

    if (insertError) throw insertError;

    // 3. Log de Auditoria de Arquivamento Master
    await supabase.from('file_logs').insert({
      file_id: fileData.id,
      action: 'AUTO_ARCHIVE',
      details: `Arquivo ${file.name} arquivado automaticamente em ${path} pela IA Guardiã.`
    });

    return { success: true, file: fileData };
  } catch (err) {
    console.error('Save to LogDock Error:', err);
    return { success: false, error: err };
  }
};
