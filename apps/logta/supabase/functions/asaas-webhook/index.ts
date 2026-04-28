import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log(`Evento Asaas Recebido: ${event}`, payment.id);

    // Focamos em confirmação de pagamento
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const courseId = payment.externalReference;
      const customerEmail = payment.customerEmail;
      const customerName = payment.customerName || "Estudante Academy";
      
      // 1. Verificar se usuário já existe
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();

      let studentId = "";

      if (existingProfiles) {
        studentId = existingProfiles.id;
      } else {
        // 2. Criar Novo Usuário (Auth Admin)
        const tempPassword = "Play" + Math.random().toString(36).substring(7) + "!";
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: customerName }
        });

        if (createError) throw createError;
        studentId = newUser.user.id;

        // Criar Perfil se o trigger do banco não o fizer automaticamente
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: studentId,
            full_name: customerName,
            email: customerEmail,
            role: 'MOTORISTA', // Usado como 'Aluno/Estudante' padrão no sistema corporativo
            asaas_customer_id: payment.customer
          }]);
        
        // TODO: Disparar e-mail com a senha temporária (tempPassword)
        console.log(`Novo aluno criado: ${customerEmail} - Senha: ${tempPassword}`);
      }

      // 3. Ativar/Criar Matrícula (Enrollment)
      const { error: enrollError } = await supabase
        .from('enrollments')
        .upsert([{
          profile_id: studentId,
          course_id: courseId,
          status: 'ativo',
          asaas_payment_id: payment.id,
          payment_status: 'paid'
        }], { onConflict: 'profile_id,course_id' });

      if (enrollError) throw enrollError;

      return new Response(JSON.stringify({ success: true, studentId }), { status: 200 });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: any) {
    console.error("Erro no Webhook Asaas:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
