/** Escolha no cadastro (RegistrarModule): define se o fluxo incluiu white-label no onboarding. */
export const REGISTRAR_PLAN_CHOICE_KEY = 'logta-registrar-plan-choice';

export type RegistrarPlanChoice = 'trial' | 'paid';

export function getRegistrarPlanChoice(): RegistrarPlanChoice | null {
  try {
    const v = localStorage.getItem(REGISTRAR_PLAN_CHOICE_KEY);
    if (v === 'trial' || v === 'paid') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setRegistrarPlanChoice(choice: RegistrarPlanChoice): void {
  try {
    localStorage.setItem(REGISTRAR_PLAN_CHOICE_KEY, choice);
  } catch {
    /* ignore */
  }
}

/** Nome/logo customizados no topo: plano ativo, white-label no Hub, ou cadastro “Plano pago” com personalização. */
export function canShowCustomHeaderBranding(params: {
  billingStatus?: string | null;
  removeZaptroBrand?: boolean;
}): boolean {
  if (params.removeZaptroBrand) return true;
  if (params.billingStatus === 'active') return true;
  if (getRegistrarPlanChoice() === 'paid') return true;
  return false;
}
