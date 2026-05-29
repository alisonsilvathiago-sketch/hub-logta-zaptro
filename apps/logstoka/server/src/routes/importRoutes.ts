import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { logstokaQueue } from '../queue/inMemoryQueue.js';
import { processNfeXmlImport, processReportImport } from '../services/orderImportService.js';
import { createMovementWithStock } from '../services/stockService.js';
import { extractRowsWithOllama, ocrImageBase64, parseExcelBuffer, parsePdfBuffer } from '../services/ocrImportService.js';

export function registerImportRoutes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.post('/v1/imports/xml', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const { xml, warehouse_id, async: runAsync } = req.body ?? {};
    if (!xml || typeof xml !== 'string') {
      return res.status(400).json({ error: 'xml is required' });
    }

    const { data: importRow } = await admin
      .from('ls_reports_imports')
      .insert({
        company_id: req.auth.companyId,
        file_name: 'nfe-import.xml',
        file_type: 'xml',
        source: 'api',
        status: 'processing',
        created_by: req.auth.userId,
      })
      .select('id')
      .single();

    if (runAsync === true) {
      const jobId = await logstokaQueue.enqueue('import.process', {
        importId: importRow?.id,
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        fileType: 'xml',
        content: xml,
        warehouseId: warehouse_id,
      });
      return res.status(202).json({ accepted: true, importId: importRow?.id, jobId });
    }

    try {
      const result = await processNfeXmlImport(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        warehouseId: warehouse_id,
        xml,
        importId: importRow?.id,
      });
      return res.status(201).json({
        importId: importRow?.id,
        invoiceNumber: result.parsed.invoiceNumber,
        items: result.items.length,
        movementId: result.movement.id,
      });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Import failed' });
    }
  });

  app.post('/v1/imports/report', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    const { content, warehouse_id, file_name, async: runAsync } = req.body ?? {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const { data: importRow } = await admin
      .from('ls_reports_imports')
      .insert({
        company_id: req.auth.companyId,
        file_name: file_name ?? 'report.csv',
        file_type: 'csv',
        source: 'api',
        status: 'processing',
        created_by: req.auth.userId,
      })
      .select('id')
      .single();

    if (runAsync === true) {
      const jobId = await logstokaQueue.enqueue('import.process', {
        importId: importRow?.id,
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        fileType: 'csv',
        content,
        warehouseId: warehouse_id,
      });
      return res.status(202).json({ accepted: true, importId: importRow?.id, jobId });
    }

    try {
      const result = await processReportImport(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        warehouseId: warehouse_id,
        content,
        fileType: 'csv',
        importId: importRow?.id,
      });
      return res.status(201).json({
        importId: importRow?.id,
        rowsProcessed: result.rowsProcessed,
        movements: result.movements.length,
      });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Import failed' });
    }
  });

  app.post('/v1/imports/excel', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { base64, warehouse_id, file_name } = req.body ?? {};
    if (!base64) return res.status(400).json({ error: 'base64 required' });

    const { data: importRow } = await admin.from('ls_reports_imports').insert({
      company_id: req.auth.companyId,
      file_name: file_name ?? 'report.xlsx',
      file_type: 'xlsx',
      source: 'api',
      status: 'processing',
      created_by: req.auth.userId,
    }).select('id').single();

    try {
      const rows = await parseExcelBuffer(Buffer.from(base64, 'base64'));
      const result = await processReportImport(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        warehouseId: warehouse_id,
        rows,
        fileType: 'xlsx',
        importId: importRow?.id,
      });
      return res.status(201).json({ importId: importRow?.id, rowsProcessed: result.rowsProcessed, movements: result.movements.length });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Excel import failed' });
    }
  });

  app.post('/v1/imports/pdf', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { base64, warehouse_id, file_name } = req.body ?? {};
    if (!base64) return res.status(400).json({ error: 'base64 required' });

    const { data: importRow } = await admin.from('ls_reports_imports').insert({
      company_id: req.auth.companyId,
      file_name: file_name ?? 'report.pdf',
      file_type: 'pdf',
      source: 'api',
      status: 'processing',
      created_by: req.auth.userId,
    }).select('id').single();

    try {
      const rows = await parsePdfBuffer(Buffer.from(base64, 'base64'));
      const result = await processReportImport(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        warehouseId: warehouse_id,
        rows,
        fileType: 'csv',
        importId: importRow?.id,
      });
      return res.status(201).json({ importId: importRow?.id, rowsProcessed: result.rowsProcessed, movements: result.movements.length });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'PDF import failed' });
    }
  });

  app.post('/v1/imports/ocr', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { base64, mime_type, text, warehouse_id, file_name } = req.body ?? {};

    const { data: importRow } = await admin.from('ls_reports_imports').insert({
      company_id: req.auth.companyId,
      file_name: file_name ?? 'ocr-import',
      file_type: 'image',
      source: 'ocr',
      status: 'processing',
      created_by: req.auth.userId,
    }).select('id').single();

    try {
      let rows;
      if (text && typeof text === 'string') {
        rows = await extractRowsWithOllama(cfg, text);
      } else if (base64) {
        rows = await ocrImageBase64(cfg, base64, mime_type ?? 'image/jpeg');
      } else {
        return res.status(400).json({ error: 'base64 or text required' });
      }

      const result = await processReportImport(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        warehouseId: warehouse_id,
        rows,
        fileType: 'csv',
        importId: importRow?.id,
      });

      await admin.from('ls_reports_imports').update({ ocr_payload: { rows: rows.length } }).eq('id', importRow?.id);

      return res.status(201).json({ importId: importRow?.id, rowsProcessed: result.rowsProcessed, movements: result.movements.length });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'OCR import failed' });
    }
  });
}

export function registerStockMovementRoutes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.post('/v1/entries', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    try {
      const { sub_type, warehouse_id, items, invoice_number, supplier_id, notes, invoice_xml } = req.body ?? {};
      const result = await createMovementWithStock(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        movementType: 'entry',
        subType: sub_type ?? 'factory',
        warehouseId: warehouse_id ?? '',
        supplierId: supplier_id,
        invoiceNumber: invoice_number,
        invoiceXml: invoice_xml,
        notes,
        items: Array.isArray(items) ? items : [],
      });
      res.status(201).json({ data: result.movement, items: result.items });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Entry failed' });
    }
  });

  app.post('/v1/outputs', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    try {
      const { sub_type, warehouse_id, store_id, marketplace, items, notes, reference_code } = req.body ?? {};
      const result = await createMovementWithStock(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        movementType: 'exit',
        subType: sub_type ?? 'sale',
        warehouseId: warehouse_id ?? '',
        storeId: store_id,
        marketplace,
        referenceCode: reference_code,
        notes,
        items: Array.isArray(items) ? items : [],
      });
      res.status(201).json({ data: result.movement, items: result.items });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Output failed' });
    }
  });
}
