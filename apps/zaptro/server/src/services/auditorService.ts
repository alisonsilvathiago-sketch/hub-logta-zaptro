import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * AuditorService: The Fiscal & Document Watchdog.
 * Automatically validates NF-e, CT-e, and financial discrepancies.
 */
export class AuditorService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupAuditListeners();
  }

  private setupAuditListeners() {
    // Listen for new document uploads
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'DOCUMENT_UPLOADED') {
        await this.auditFiscalDocument(data.metadata.docId, data.metadata);
      }

      if (data.action === 'PAYMENT_RECEIVED') {
        await this.reconcilePayment(data.metadata);
      }
    });
  }

  /**
   * Automated Fiscal Audit
   * Validates NF-e / CT-e integrity and fiscal status.
   */
  async auditFiscalDocument(docId: string, metadata: any) {
    console.log(`[Auditor] Auditing document: ${docId}`);
    
    // Logic to simulate fiscal validation (e.g., checking SEFAZ)
    const isIntegrityValid = metadata.xmlIntegrity === true;
    const isStatusActive = metadata.sefazStatus === 'AUTORIZADA';

    const isValid = isIntegrityValid && isStatusActive;

    await this.supabase.from('fiscal_audits').upsert([{
      doc_id: docId,
      status: isValid ? 'VALIDATED' : 'REJECTED',
      reasons: isValid ? [] : ['XML_INTEGRITY_FAIL', 'SEFAZ_INACTIVE'],
      audited_at: new Date().toISOString()
    }]);

    if (!isValid) {
      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'FiscalGuard',
        outcome: {
          action: 'BLOCK_OPERATIONAL_FLOW',
          targetId: metadata.companyId || 'SYSTEM',
          reason: 'FISCAL_COMPLIANCE_FAILURE',
          priority: 'CRITICAL'
        },
        companyId: metadata.companyId || 'SYSTEM',
        confidence: 1.0
      });
      
      console.warn(`[Auditor] CRITICAL: Fiscal compliance failure for ${metadata.companyId}. Operational flow blocked.`);
    }
  }

  /**
   * Financial Reconciliation
   * Cross-checks expected billing vs actual payment received.
   */
  async reconcilePayment(paymentData: any) {
    const { orderId, amountReceived, expectedAmount, companyId } = paymentData;
    const discrepancy = Math.abs(amountReceived - expectedAmount);

    if (discrepancy > 0.01) {
      console.log(`[Auditor] Discrepancy detected in Order ${orderId}: R$ ${discrepancy}`);
      
      await this.supabase.from('financial_alerts').insert([{
        order_id: orderId,
        type: 'PAYMENT_DISCREPANCY',
        amount: discrepancy,
        details: { amountReceived, expectedAmount }
      }]);

      this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, {
        type: 'FINANCIAL_RECONCILIATION_REQUIRED',
        targetId: orderId,
        details: { discrepancy, expectedAmount, amountReceived },
        companyId: companyId || 'SYSTEM'
      });
    }
  }
}
