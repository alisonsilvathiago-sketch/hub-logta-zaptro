import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEvolutionMessage(number: string, text: string) {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')
  const instance = Deno.env.get('EVOLUTION_INSTANCE')

  if (!evolutionUrl || !evolutionKey || !instance) {
    console.warn('Evolution API not configured');
    return;
  }

  try {
    await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey
      },
      body: JSON.stringify({
        number,
        text,
        linkPreview: false
      })
    });
  } catch (err) {
    console.error('Error sending message via Evolution:', err);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const asaasKey = Deno.env.get('ASAAS_API_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    async function logSecurityEvent(action: string, success: boolean, details: any = {}) {
      await supabase.from('security_logs').insert({
        action,
        success,
        details,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      })
    }

    // 1. ENDPOINT: VALIDATE ACCESS (Called by Zaptro/Logta)
    if (path === 'validate-access') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        await logSecurityEvent('validate_access_failed', false, { reason: 'No auth header' })
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      const apiKey = authHeader.replace('Bearer ', '')
      
      const { data: company, error } = await supabase
        .from('companies')
        .select(`
          id, name, status, 
          subscriptions (status, product_name, next_due_date)
        `)
        .eq('hub_api_key', apiKey)
        .single()

      if (error || !company) {
        await logSecurityEvent('validate_access_failed', false, { api_key: apiKey.substring(0, 8) + '...' })
        return new Response(JSON.stringify({ valid: false, error: 'Invalid API Key' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const hasActiveSub = company.subscriptions.some((s: any) => s.status === 'active' || s.status === 'trial')
      const isValid = hasActiveSub && company.status === 'active'
      
      await logSecurityEvent('validate_access_success', isValid, { company_id: company.id, status: company.status })

      return new Response(JSON.stringify({
        valid: isValid,
        company_id: company.id,
        company_name: company.name,
        products: company.subscriptions.map((s: any) => s.product_name)
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. ENDPOINT: ASAAS WEBHOOK
    if (path === 'webhook-asaas') {
      const asaasToken = req.headers.get('asaas-access-token')
      const systemToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

      if (systemToken && asaasToken !== systemToken) {
        await logSecurityEvent('webhook_asaas_invalid_token', false, { provided: asaasToken })
        return new Response('Unauthorized', { status: 401 })
      }

      const body = await req.json()
      const { event, payment } = body

      // CASO A: Pagamento de Assinatura
      if (payment?.subscription) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, status, company_id')
          .eq('asaas_subscription_id', payment.subscription)
          .single()

        if (sub) {
          let status = 'pending'
          if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') status = 'active'
          if (event === 'PAYMENT_OVERDUE') status = 'past_due'
          if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_CANCELED') status = 'canceled'

          await supabase.from('subscriptions').update({ status, updated_at: new Date() }).eq('id', sub.id)

          if (status === 'active') {
            const { data: company } = await supabase.from('companies').select('name, phone').eq('id', sub.company_id).single()
            if (company?.phone) {
              const welcomeText = `🚀 *Olá! Bem-vindo ao Ecossistema Zaptro/Logta!* \n\nConfirmamos o seu pagamento da assinatura. Seu acesso ao painel já está liberado. \n\nSe precisar de ajuda, conte conosco!`
              await sendEvolutionMessage(company.phone, welcomeText)
            }
          }
        }
      } 
      // CASO B: Pagamento de Cobrança Manual (Charges)
      else if (payment?.id) {
        const { data: charge } = await supabase
          .from('charges')
          .select('*')
          .eq('asaas_id', payment.id)
          .single()

        if (charge && (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED')) {
          await supabase.from('charges').update({ status: 'paid', updated_at: new Date() }).eq('id', charge.id)
          
          // Gerar Fatura Automática
          await supabase.from('invoices').insert([{
            charge_id: charge.id,
            amount: charge.amount,
            status: 'paid',
            paid_at: new Date()
          }])

          if (charge.metadata?.client_phone) {
            const msg = `✅ *Pagamento Confirmado!* \n\nOlá, recebemos o seu pagamento de *R$ ${charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*. \n\nObrigado pela confiança!`
            await sendEvolutionMessage(charge.metadata.client_phone, msg)
          }
        }
      }

      return new Response('Success', { status: 200 })
    }

    // 3. ENDPOINT: CHECKOUT (Create company + Subscription + Asaas Payment)
    if (path === 'checkout') {
      const { email, name, phone, company_name, plan, origin, paymentMethod, cpfCnpj, amount } = await req.json()
      
      const slug = company_name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 5)

      const hubKey = `hub_${Math.random().toString(36).substring(2, 15)}`
      const asaasKey = Deno.env.get('ASAAS_API_KEY') ?? ''

      // A. Criar Empresa no Hub
      const { data: company, error: compError } = await supabase.from('companies').insert({
        name: company_name,
        slug: slug,
        hub_api_key: hubKey,
        status: 'active',
        origin: origin || 'direct',
        phone: phone,
        email: email
      }).select().single()

      if (compError) return new Response(JSON.stringify({ success: false, error: compError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      // B. Criar Cliente e Cobrança no Asaas (Se houver método de pagamento)
      let payData: any = {}
      if (paymentMethod && asaasKey) {
         // Criar Cliente Asaas
         const cRes = await fetch(`https://api.asaas.com/v3/customers`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
           body: JSON.stringify({ name, email, mobilePhone: phone, cpfCnpj })
         })
         const customer = await cRes.json()

         if (customer.id) {
           // Criar Cobrança
           const pRes = await fetch(`https://api.asaas.com/v3/payments`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
             body: JSON.stringify({
               customer: customer.id,
               billingType: paymentMethod,
               value: amount ? parseFloat(amount) : (plan === 'pro' ? 197.00 : 97.00),
               dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               description: `Assinatura ${origin?.toUpperCase()} - Plano ${plan}`
             })
           })
           payData = await pRes.json()
         }
      }

      // C. Criar Assinatura no Hub (Espelho)
      await supabase.from('subscriptions').insert({
        company_id: company.id,
        product_name: origin?.toUpperCase() || 'ZAPTRO',
        status: paymentMethod ? 'pending' : 'trial',
        plan_level: plan || 'pro',
        asaas_subscription_id: payData.id || null
      })

      // D. Mensagem WhatsApp
      const welcomeText = `🚀 *Bem-vindo à ${origin?.toUpperCase()}!* \n\nSeu cadastro foi recebido. \nChave API: *${hubKey}*`
      await sendEvolutionMessage(phone, welcomeText)

      // E. Se for PIX, buscar QR Code Real
      let pixCode = ''
      let pixImage = ''
      if (paymentMethod === 'PIX' && payData.id) {
        const pixRes = await fetch(`https://api.asaas.com/v3/payments/${payData.id}/pixQrCode`, {
          headers: { 'access_token': asaasKey }
        })
        const pixResData = await pixRes.json()
        pixCode = pixResData.payload
        pixImage = pixResData.encodedImage
      }

      return new Response(JSON.stringify({ 
        success: true, 
        api_key: hubKey, 
        company_id: company.id,
        pix_qr_code: pixImage ? `data:image/png;base64,${pixImage}` : payData.invoiceUrl,
        pix_payload: pixCode,
        bank_slip_url: payData.bankSlipUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. ENDPOINT: CREATE PAYMENT (Manual Billing)
    if (path === 'create-payment') {
      const { client, email, phone, cpfCnpj, amount, due_date, method, description } = await req.json()
      
      if (!asaasKey) throw new Error('ASAAS_API_KEY not configured')

      // A. Buscar ou Criar Cliente no Asaas
      let asaasCustomerId = ''
      const searchRes = await fetch(`https://api.asaas.com/v3/customers?email=${encodeURIComponent(email)}`, {
        headers: { 'access_token': asaasKey }
      })
      const searchData = await searchRes.json()
      
      if (searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id
      } else {
        const createRes = await fetch(`https://api.asaas.com/v3/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
          body: JSON.stringify({ name: client, email, mobilePhone: phone, cpfCnpj })
        })
        const createData = await createRes.json()
        if (createData.id) asaasCustomerId = createData.id
        else throw new Error(createData.errors?.[0]?.description || 'Failed to create customer in Asaas')
      }

      // B. Criar Cobrança
      const billingType = method === 'pix' ? 'PIX' : method === 'boleto' ? 'BOLETO' : 'CREDIT_CARD'
      const payRes = await fetch(`https://api.asaas.com/v3/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
        body: JSON.stringify({
          customer: asaasCustomerId,
          billingType: billingType,
          value: parseFloat(amount),
          dueDate: due_date,
          description: description || 'Cobrança Avulsa'
        })
      })
      const payData = await payRes.json()

      if (!payData.id) throw new Error(payData.errors?.[0]?.description || 'Failed to create payment')

      // C. Se for PIX, pegar o QR Code e a Imagem
      let pixCode = ''
      let pixImage = ''
      if (billingType === 'PIX') {
        const pixRes = await fetch(`https://api.asaas.com/v3/payments/${payData.id}/pixQrCode`, {
          headers: { 'access_token': asaasKey }
        })
        const pixData = await pixRes.json()
        pixCode = pixData.payload || ''
        pixImage = pixData.encodedImage || ''
      }

      // D. Salvar no Banco de Dados do Hub (Nova Tabela Charges)
      const { error: dbError } = await supabase.from('charges').insert({
        asaas_id: payData.id,
        amount: parseFloat(amount),
        status: 'pending',
        method: method,
        due_date: due_date,
        metadata: {
          client_name: client,
          client_email: email,
          client_phone: phone,
          client_cpf_cnpj: cpfCnpj,
          description: description || 'Cobrança Avulsa',
          pix_code: pixCode,
          pix_image: pixImage,
          bank_slip_url: payData.bankSlipUrl,
          invoice_url: payData.invoiceUrl
        }
      })

      if (dbError) console.error('Error saving to DB:', dbError)

      return new Response(JSON.stringify({ 
        success: true, 
        payment_id: payData.id,
        link: payData.invoiceUrl,
        pix_code: pixCode,
        pix_image: pixImage,
        bank_slip_url: payData.bankSlipUrl,
        barcode: payData.identificationField || ''
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. ENDPOINT: GENERATE SSO (Called by Hub Master UI)
    if (path === 'generate-sso') {
      const { company_id } = await req.json()
      if (!company_id) return new Response('Missing company_id', { status: 400 })

      const token = crypto.randomUUID().replace(/-/g, '')
      const expiresAt = new Date(Date.now() + 5 * 60000).toISOString() // 5 min

      const { error } = await supabase.from('sso_tokens').insert({
        company_id,
        token,
        expires_at: expiresAt
      })

      if (error) throw error

      return new Response(JSON.stringify({ success: true, token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. ENDPOINT: VERIFY SSO TOKEN (Called by Zaptro/Logta)
    if (path === 'verify-sso') {
      const { token } = await req.json()
      if (!token) return new Response('Missing token', { status: 400 })

      const { data, error } = await supabase
        .from('sso_tokens')
        .select('company_id, expires_at, companies(*)')
        .eq('token', token)
        .single()

      if (error || !data) return new Response(JSON.stringify({ valid: false }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      if (new Date(data.expires_at) < new Date()) {
        return new Response(JSON.stringify({ valid: false, error: 'Expired' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Token valid! Consume it (optional but safer)
      await supabase.from('sso_tokens').delete().eq('token', token)

      return new Response(JSON.stringify({ 
        valid: true, 
        company_id: data.company_id,
        company: data.companies
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
