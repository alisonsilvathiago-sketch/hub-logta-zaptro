import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Unified API Authentication Middleware
 * Validates X-API-Key and X-API-Secret against the unified_api_access table.
 */
export const unifiedApiAuth = (supabaseUrl: string, supabaseKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const publicKey = req.headers['x-api-key'];
    const secretKey = req.headers['x-api-secret'];

    if (!publicKey || !secretKey) {
      return res.status(401).json({ error: 'missing_api_credentials', message: 'X-API-Key and X-API-Secret are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // 1. Fetch the access record
      const { data: access, error } = await supabase
        .from('unified_api_access')
        .select('*')
        .eq('public_key', publicKey)
        .eq('is_active', true)
        .single();

      if (error || !access) {
        return res.status(401).json({ error: 'invalid_api_key' });
      }

      // 2. Validate Secret (using a simple hash comparison for now)
      // In a real prod env, we'd use bcrypt or similar, but for this architecture 
      // we assume the secret_key_hash was stored correctly.
      const secretHash = crypto.createHash('sha256').update(secretKey as string).digest('hex');
      if (access.secret_key_hash !== secretHash) {
        return res.status(401).json({ error: 'invalid_api_secret' });
      }

      // 3. Identify the module being accessed (e.g., /api/zaptro/...)
      const pathParts = req.path.split('/');
      const moduleName = pathParts[2]; // /v1/api/:module/...

      // 4. Check permissions
      if (!access.allowed_modules.includes(moduleName)) {
        return res.status(403).json({ 
          error: 'access_denied', 
          message: `This API Key does not have permission to access the ${moduleName} module.` 
        });
      }

      // 5. Inject context into request
      (req as any).apiContext = {
        companyId: access.company_id,
        accessId: access.id,
        module: moduleName,
        startTime: Date.now()
      };

      // 6. Update last used
      await supabase
        .from('unified_api_access')
        .update({ last_used_at: new Date() })
        .eq('id', access.id);

      next();
    } catch (err) {
      console.error('[UnifiedAPI] Auth error:', err);
      res.status(500).json({ error: 'internal_api_error' });
    }
  };
};
