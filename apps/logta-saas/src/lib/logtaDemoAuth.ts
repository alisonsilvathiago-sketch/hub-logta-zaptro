import { LOGTA_DEMO_COMPANY_ID } from './seed/constants';

export const LOGTA_DEMO_LOGIN_EMAIL = 'logta@teste.com';
export const LOGTA_DEMO_LOGIN_PASSWORD = '123456';

export function isLogtaDemoEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === LOGTA_DEMO_LOGIN_EMAIL;
}

export function isLogtaDemoLogin(email: string, password: string): boolean {
  return isLogtaDemoEmail(email) && password === LOGTA_DEMO_LOGIN_PASSWORD;
}

export function buildLogtaDemoProfile(userId?: string) {
  return {
    id: userId || 'logta-demo-user',
    full_name: 'Administrador Logta',
    role: 'admin',
    company_id: LOGTA_DEMO_COMPANY_ID,
    avatar_url: null as string | null,
    permissions: {} as Record<string, unknown>,
  };
}
