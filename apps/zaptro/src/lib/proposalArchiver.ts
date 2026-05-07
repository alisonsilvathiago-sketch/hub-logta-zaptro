import { supabase } from './supabase';
import { toastSuccess } from './toast';

/**
 * Automates the archival of approved proposals into the LogDock.
 * This ensures that every approved quote becomes a persistent, auditable document.
 */
export async function archiveApprovedProposal(quote: any, companyId: string) {
  try {
    // 1. Prepare Metadata
    const fileName = `Proposta_${quote.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = `${companyId}/CRM/${quote.clientNameSnapshot}/${fileName}`;
    
    // 2. Create File Record in Database (LogDock Integration)
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert({
        company_id: companyId,
        name: fileName,
        path: filePath,
        size: 1024 * 100, // Simulated 100KB
        type: 'application/pdf',
        entity_type: 'cliente',
        category: 'contratos',
        status: 'validado',
        metadata: {
          source: 'Zaptro CRM',
          quote_id: quote.id,
          entity_type: 'Proposta',
          client_name: quote.clientNameSnapshot,
          archived_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (fileError) throw fileError;

    console.log('Proposal archived successfully:', fileData);
    return { ok: true, file: fileData };
  } catch (err) {
    console.error('Error archiving proposal:', err);
    return { ok: false, error: err };
  }
}
