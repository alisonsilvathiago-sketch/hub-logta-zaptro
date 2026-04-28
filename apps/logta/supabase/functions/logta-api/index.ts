import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "http://localhost:8080";

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = authHeader.split(" ")[1];

  try {
    // 1. Validate API Key (This is a simplified hash check, IRL use proper hashing)
    const { data: keyData, error: keyError } = await supabase
      .from('whatsapp_api_keys')
      .select('company_id, is_active')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return new Response("Invalid or inactive API Key", { status: 403 });
    }

    const companyId = keyData.company_id;

    // 2. Handle Requests
    const url = new URL(req.url);
    const path = url.pathname.replace('/logta-api', '');

    // --- SEND MESSAGE ENDPOINT ---
    if (req.method === "POST" && path === "/send-message") {
      const body = await req.json();
      const { number, message, mediaUrl } = body;

      if (!number || !message) return new Response("Missing number or message", { status: 400 });

      // Get company's active instance
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_id, token')
        .eq('company_id', companyId)
        .eq('status', 'connected')
        .single();

      if (!instance) return new Response("No active WhatsApp instance found for this company", { status: 404 });

      // Forward to Evolution API
      const response = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instance.token
        },
        body: JSON.stringify({
          number: number,
          textMessage: { text: message }
        })
      });

      const result = await response.json();
      
      // Log the message as API-sent
      await supabase.from('whatsapp_messages').insert([{
        company_id: companyId,
        sender_type: 'sistema',
        message: message,
        metadata: { source: 'api_integration' }
      }]);

      return new Response(JSON.stringify({ success: true, result }), { status: 200 });
    }

    // --- STATUS CHECK ENDPOINT ---
    if (req.method === "GET" && path === "/status") {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('status, phone, updated_at')
        .eq('company_id', companyId)
        .single();
        
      return new Response(JSON.stringify(instance), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
})
