/**
 * Tipos e utilitários Asaas.
 * A API Asaas com access_token deve rodar só no backend (Edge Function `hub-core`, etc.).
 * Não use VITE_ASAAS_API_KEY — qualquer valor exposto no bundle do browser deve ser rotacionado.
 */

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

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
  dueDate: string;
  description?: string;
  externalReference?: string;
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
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export function asaasStatusToHub(asaasStatus: string): 'active' | 'past_due' | 'inactive' | 'trial' {
  switch (asaasStatus) {
    case 'ACTIVE':
      return 'active';
    case 'OVERDUE':
      return 'past_due';
    case 'INACTIVE':
    case 'EXPIRED':
      return 'inactive';
    default:
      return 'trial';
  }
}
