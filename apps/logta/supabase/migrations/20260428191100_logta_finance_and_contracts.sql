-- Logta advanced finance and contracts domain

CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  bank_name TEXT,
  external_account_ref TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  financial_account_id UUID REFERENCES public.financial_accounts(id),
  description TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status public.invoice_status NOT NULL DEFAULT 'PENDING',
  external_bank_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  financial_account_id UUID REFERENCES public.financial_accounts(id),
  description TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status public.invoice_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  title TEXT NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'DRAFT',
  start_date DATE,
  end_date DATE,
  monthly_value NUMERIC(14,2),
  terms TEXT,
  signed_file_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receivables_company_due_date ON public.receivables(company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payables_company_due_date ON public.payables(company_id, due_date);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_financial_accounts_company_isolation ON public.financial_accounts;
CREATE POLICY p_financial_accounts_company_isolation ON public.financial_accounts FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_cost_centers_company_isolation ON public.cost_centers;
CREATE POLICY p_cost_centers_company_isolation ON public.cost_centers FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_receivables_company_isolation ON public.receivables;
CREATE POLICY p_receivables_company_isolation ON public.receivables FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_payables_company_isolation ON public.payables;
CREATE POLICY p_payables_company_isolation ON public.payables FOR ALL USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS p_customer_contracts_company_isolation ON public.customer_contracts;
CREATE POLICY p_customer_contracts_company_isolation ON public.customer_contracts FOR ALL USING (company_id = public.current_company_id());

DROP TRIGGER IF EXISTS trg_financial_accounts_updated_at ON public.financial_accounts;
CREATE TRIGGER trg_financial_accounts_updated_at
BEFORE UPDATE ON public.financial_accounts
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_receivables_updated_at ON public.receivables;
CREATE TRIGGER trg_receivables_updated_at
BEFORE UPDATE ON public.receivables
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_payables_updated_at ON public.payables;
CREATE TRIGGER trg_payables_updated_at
BEFORE UPDATE ON public.payables
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_contracts_updated_at ON public.customer_contracts;
CREATE TRIGGER trg_customer_contracts_updated_at
BEFORE UPDATE ON public.customer_contracts
FOR EACH ROW EXECUTE FUNCTION public.logta_set_updated_at();
