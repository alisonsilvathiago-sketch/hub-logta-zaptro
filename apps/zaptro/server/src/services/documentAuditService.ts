import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * DocumentAuditService: The "Auditor" of the Hub.
 * It automatically validates CT-e, NF-e, and receipts, 
 * detecting inconsistencies and blocking invalid workflows to avoid fines.
 */
export class DocumentAuditService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'DOCUMENT_UPLOADED' || data.action === 'DOCUMENT_GENERATED') {
        await this.auditDocument(data.metadata.docId, data.actorId);
      }
    });
  }

  /**
   * Performs an automated audit of a logistics document.
   */
  async auditDocument(docId: string, companyId: string) {
    try {
      console.log(`[Auditor] Auditing document ${docId} for ${companyId}...`);
      
      const { data: doc } = await this.supabase
        .from('logistics_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (!doc) return;

      const errors: any[] = [];
      
      // 1. Validation Rule: Check for common data inconsistencies (Simulated)
      if (doc.doc_type === 'CTE' && !doc.metadata?.tax_rate) {
        errors.push({ type: 'TAX_MISMATCH', message: 'Alíquota de ICMS não informada no CT-e.' });
      }
      
      if (doc.doc_type === 'NFE' && (doc.metadata?.total < 0)) {
        errors.push({ type: 'VALUE_ERROR', message: 'Valor total da nota fiscal inválido.' });
      }

      const isValid = errors.length === 0;

      // 2. Update Document Status
      await this.supabase.from('logistics_documents').update({
        status: isValid ? 'VALID' : 'INVALID',
        is_blocked: !isValid,
        error_details: errors,
        updated_at: new Date()
      }).eq('id', docId);

      // 3. Log Validations (Logta Memory)
      for (const error of errors) {
        await this.supabase.from('logistics_document_validations').insert([{
          document_id: docId,
          validation_type: error.type,
          status: 'FAILED',
          message: error.message
        }]);
      }

      if (isValid) {
        await this.supabase.from('logistics_document_validations').insert([{
          document_id: docId,
          validation_type: 'GLOBAL_CONSISTENCY',
          status: 'SUCCESS',
          message: 'Documento validado com sucesso.'
        }]);
      } else {
        // 4. Trigger Decision (Cortex)
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'DOCUMENT_ERROR_DETECTED',
          actorId: companyId,
          metadata: { 
            docId, 
            docType: doc.doc_type, 
            docNumber: doc.doc_number,
            errors 
          }
        });
        console.log(`[Auditor] Document ${docId} BLOCKED due to ${errors.length} errors.`);
      }

    } catch (err) {
      console.error('[Auditor] Audit failed:', err);
    }
  }
}
