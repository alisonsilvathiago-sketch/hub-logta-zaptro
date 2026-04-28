-- Migration: Hybrid Billing Functions (Wallet Recharge)
-- Description: RPC functions for atomic wallet updates.

CREATE OR REPLACE FUNCTION public.increment_wallet_credits(comp_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.company_wallet
    SET 
        credits_balance = credits_balance + amount,
        last_recharge_at = now(),
        updated_at = now()
    WHERE company_id = comp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir acesso ao anon/authenticated para execução via RPC (cumprindo RLS)
GRANT EXECUTE ON FUNCTION public.increment_wallet_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallet_credits(UUID, INTEGER) TO service_role;
