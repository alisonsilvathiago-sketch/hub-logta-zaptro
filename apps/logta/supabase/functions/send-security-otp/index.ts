import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { user_id, email, type = '2FA_LOGIN' } = await req.json();

    if (!user_id || !email) throw new Error("user_id e email são obrigatórios.");

    // 1. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    console.log(`[OTP Engine] Gerando código para ${email}: ${code}`);

    // 2. Salvar no Banco
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert([{
        user_id,
        code,
        type,
        expires_at: expiresAt.toISOString()
      }]);

    if (dbError) throw dbError;

    // 3. Enviar E-mail (Simulado via Logic/Placeholder)
    // NOTE: Aqui integraria com Resend, SendGrid ou SMTP cadastrado no Logta
    console.log(`[EMAIL DISPATCH] Para: ${email} | Assunto: Seu código de segurança Logta | Código: ${code}`);

    // Auditoria
    await supabase.from('security_audit_logs').insert([{
        profile_id: user_id,
        event: '2FA_REQUIRED',
        metadata: { type, email_sent: true }
    }]);

    return new Response(JSON.stringify({ success: true, message: "Código enviado com sucesso!" }), { status: 200 });

  } catch (err: any) {
    console.error("[OTP Engine Error]", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
