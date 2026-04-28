export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'USER' | 'ADMIN' | 'MASTER' | 'MASTER_ADMIN';
  company_id?: string;
  avatar_url?: string;
}

export type SubscriptionStatus = 'ATIVO' | 'SUSPENSO' | 'BLOQUEADO' | 'trial' | 'past_due' | 'unpaid' | 'canceled';

export interface Company {
  id: string;
  name: string;
  slug?: string;
  subdomain?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  menu_color?: string;
  bg_color?: string;
  button_radius?: string;
  plan?: 'BRONZE' | 'PRATA' | 'OURO' | 'PROFISSIONAL' | 'MASTER';
  status?: SubscriptionStatus;
  billing_status?: string;
  trial_ends_at?: string;
  settings?: any;
}

export interface TenantContextType {
  company: Company | null;
  isLoading: boolean;
  setCompany?: (c: Company) => void;
  fetchCompanyData?: (id?: string) => Promise<void>;
}
