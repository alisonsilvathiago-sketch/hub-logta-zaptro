import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// O sistema agora detecta automaticamente se é Sandbox ou Produção com base na chave
const ASAAS_API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjUxMTc4NTdjLTEyOWUtNDg4MC1iZDVlLTFlMDE4NDMyMTgxZTo6JGFhY2hfMDY0OTFjMWYtZjNiMi00N2I0LWFhOGQtN2Y1ZjNkYzljNmUz";
const IS_SANDBOX = ASAAS_API_KEY.startsWith('$aact_hmlg');
const ASAAS_URL = IS_SANDBOX ? "https://sandbox.asaas.com/api/v3" : "https://www.asaas.com/api/v3";

serve(async (req) => {
  const { 
    company_id, plan_id, amount, billingType, 
    customerName, customerEmail, customerCnpj, phone,
    creditCard 
  } = await req.json()

  console.log(`[Asaas Checkout] Iniciando transação em ${IS_SANDBOX ? 'SANDBOX' : 'PRODUÇÃO'}. Tipo: ${billingType}`);

  try {
    // 1. Buscar Cliente por Documento no Asaas
    const customerSearchResp = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${customerCnpj}`, {
      headers: { "access_token": ASAAS_API_KEY }
    })
    const searchData = await customerSearchResp.json()
    
    let asaasCustomerId = "";
    if (searchData.data && searchData.data.length > 0) {
      asaasCustomerId = searchData.data[0].id;
    } else {
      // 2. Criar Cliente se não existir
      const createCustomerResp = await fetch(`${ASAAS_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY },
        body: JSON.stringify({ 
          name: customerName, 
          email: customerEmail, 
          cpfCnpj: customerCnpj,
          mobilePhone: phone 
        })
      });
      const newCustomer = await createCustomerResp.json();
      if (newCustomer.error || newCustomer.errors) {
         const errorMsg = newCustomer.errors ? newCustomer.errors[0].description : newCustomer.error;
         throw new Error(errorMsg);
      }
      asaasCustomerId = newCustomer.id;
    }

    // 3. Gerar Cobrança
    const paymentPayload: any = {
      customer: asaasCustomerId,
      billingType: billingType,
      value: amount,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Inscrição Logta Academy - Curso: ${plan_id}`,
      externalReference: plan_id,
    };

    if (billingType === 'CREDIT_CARD' && creditCard) {
      paymentPayload.creditCard = creditCard;
      paymentPayload.creditCardHolderInfo = {
        name: customerName,
        email: customerEmail,
        cpfCnpj: customerCnpj,
        postalCode: "01310-200", // CEP Padrão Paulista para teste se vazio
        addressNumber: "1000",
        phone: phone
      };
      paymentPayload.remoteIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    }

    const response = await fetch(`${ASAAS_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY },
      body: JSON.stringify(paymentPayload)
    });

    const data = await response.json();
    if (data.errors) throw new Error(data.errors[0].description);

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(`[Asaas Error] ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})
