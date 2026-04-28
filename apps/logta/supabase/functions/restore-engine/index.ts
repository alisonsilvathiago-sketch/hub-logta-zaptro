import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { backup_id, company_id, profile_id } = await req.json();

    if (!backup_id || !company_id) throw new Error("ID do backup e empresa são obrigatórios.");

    console.log(`[Restore Engine] Iniciando recuperação: ${backup_id} para ${company_id}`);

    // 1. Localizar Backup
    const { data: backup, error: fetchErr } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backup_id)
      .single();

    if (fetchErr) throw fetchErr;

    // 2. Baixar snapshot do Storage
    const { data: fileData, error: downloadErr } = await supabase
      .storage
      .from('backups')
      .download(backup.storage_path);

    if (downloadErr) throw downloadErr;
    const snapshotJSON = JSON.parse(await fileData.text());

    // 3. Executar Restauração Atômica via RPC
    console.log(`[Restore] Executando RPC de restauração para ${company_id}`);
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('rpc_restore_snapshot', {
      p_company_id: company_id,
      p_snapshot: snapshotJSON
    });

    if (rpcErr) throw rpcErr;
    if (!rpcResult.success) throw new Error(rpcResult.error);

    // 4. Auditoria
    await supabase.from('backup_restore_logs').insert([{
        backup_id,
        company_id,
        profile_id,
        action: 'RESTORE_TOTAL',
        status: 'SUCCESS',
        details: { snapshot_version: backup.id, date: new Date().toISOString() }
    }]);

    return new Response(JSON.stringify({ success: true, message: "Os dados foram restaurados com sucesso!" }), { status: 200 });

  } catch (err: any) {
    console.error("[Restore Engine Error]", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
