/**
 * asaasService.ts
 * Integração com a API Asaas (sandbox e produção)
 * Docs: https://docs.asaas.com/
 */

const ASAAS_BASE_URL = import.meta.env.VITE_ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY  = import.meta.env.VITE_ASAAS_API_KEY ?? '';

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: BillingType;
  value: number;
  dueDate: string;        // 'YYYY-MM-DD'
  description?: string;
  externalReference?: string;  // company_id do Hub
  invoiceUrl?: string;
  bankSlipUrl?: string;
  status: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: BillingType;
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description?: string;
  status: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;  // base64 da imagem QR
  payload: string;       // copia-e-cola
  expirationDate: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function asaasFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Asaas API error ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

/** Cria um cliente no Asaas */
export async function createAsaasCustomer(data: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  externalReference?: string;  // company_id Hub
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Busca clientes por CPF/CNPJ */
export async function findAsaasCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const res = await asaasFetch<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${cpfCnpj}`);
  return res.data?.[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COBRANÇAS AVULSAS
// ─────────────────────────────────────────────────────────────────────────────

/** Gera uma cobrança avulsa (PIX, Boleto, Cartão) */
export async function createAsaasPayment(data: {
  customer: string;         // asaas customer id
  billingType: BillingType;
  value: number;
  dueDate: string;          // 'YYYY-MM-DD'
  description?: string;
  externalReference?: string;
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Busca QR Code PIX de uma cobrança */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

/** Consulta status de um pagamento */
export async function getAsaasPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSINATURAS RECORRENTES
// ─────────────────────────────────────────────────────────────────────────────

/** Cria uma assinatura recorrente mensal */
export async function createAsaasSubscription(data: {
  customer: string;
  billingType: BillingType;
  value: number;
  nextDueDate: string;      // 'YYYY-MM-DD' (primeiro vencimento)
  cycle?: 'MONTHLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ cycle: 'MONTHLY', ...data }),
  });
}

/** Cancela uma assinatura */
export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
}

/** Busca assinatura por ID */
export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}

/** Lista pagamentos de uma assinatura */
export async function listSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  const res = await asaasFetch<{ data: AsaasPayment[] }>(
    `/subscriptions/${subscriptionId}/payments`,
  );
  return res.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE STATUS
// ─────────────────────────────────────────────────────────────────────────────

export function asaasStatusToHub(asaasStatus: string): 'active' | 'past_due' | 'inactive' | 'trial' {
  switch (asaasStatus) {
    case 'ACTIVE':   return 'active';
    case 'OVERDUE':  return 'past_due';
    case 'INACTIVE':
    case 'EXPIRED':  return 'inactive';
    default:         return 'trial';
  }
}
