import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MODULES_MAP: Record<string, string[]> = {
  "CORE": ["companies", "profiles", "system_configs"],
  "FINANCE": ["transactions", "billings", "suppliers", "categories"],
  "CRM": ["leads", "client_contacts", "product_links"],
  "LOGISTICS": ["shipments", "routes", "fleets", "drivers"],
  "ACADEMY": ["courses", "course_modules", "lessons", "enrollments", "lesson_progress", "lesson_comments"],
  "HR": ["collaborators", "time_clock_entries", "hr_notifications"]
};

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { company_id, type = 'MANUAL', created_by, selected_modules = Object.keys(MODULES_MAP) } = await req.json();

    if (!company_id) throw new Error("company_id é obrigatório para backup contextual.");

    console.log(`[Backup Engine] Iniciando Snapshot: ${company_id} | Tipo: ${type}`);

    // 1. Criar registro inicial de Backup
    const { data: backupRecord, error: initError } = await supabase
      .from('backups')
      .insert([{
        company_id,
        type,
        status: 'PENDING',
        modules: selected_modules,
        created_by,
        storage_path: `temp/${company_id}-${Date.now()}.json`
      }])
      .select()
      .single();

    if (initError) throw initError;

    // 2. Extrair Dados
    const snapshot: Record<string, any[]> = {};
    
    for (const mod of selected_modules) {
      const tables = MODULES_MAP[mod];
      if (!tables) continue;

      for (const table of tables) {
        console.log(`[Backup] Extraindo tabela: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('company_id', company_id);
        
        if (error) {
          console.error(`[Backup Error] Falha ao extrair ${table}:`, error.message);
          continue;
        }
        snapshot[table] = data || [];
      }
    }

    // 3. Salvar no Storage
    const fileName = `${company_id}/${type.toLowerCase()}-${Date.now()}.json`;
    const storagePath = `backups/${fileName}`;
    
    const { error: storageError } = await supabase.storage
      .from('backups')
      .upload(fileName, JSON.stringify(snapshot), {
        contentType: 'application/json',
        upsert: true
      });

    if (storageError) throw storageError;

    // 4. Finalizar Registro
    const { error: updateError } = await supabase
      .from('backups')
      .update({
        status: 'SUCCESS',
        storage_path: fileName,
        file_size: JSON.stringify(snapshot).length
      })
      .eq('id', backupRecord.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, backup_id: backupRecord.id }), { status: 200 });

  } catch (err: any) {
    console.error("[Backup Engine Error]", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
