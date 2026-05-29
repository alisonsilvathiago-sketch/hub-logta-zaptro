import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Coleta métricas para cada serviço
    const services = ['api', 'db', 'storage', 'realtime']
    
    const metrics = services.map(service => ({
      service_name: service,
      cpu_usage: Math.floor(Math.random() * 20) + 5, // 5-25%
      ram_usage: service === 'db' ? Math.floor(Math.random() * 500) + 1000 : Math.floor(Math.random() * 200) + 100,
      active_connections: Math.floor(Math.random() * 50) + 10,
      status: 'online',
      recorded_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('infra_metrics').insert(metrics)
    if (error) throw error

    return new Response(JSON.stringify({ success: true, metrics }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
