export const LOGSTOKA_DEMO_LOGIN_EMAIL = 'logstoka@teste.com';
export const LOGSTOKA_DEMO_LOGIN_PASSWORD = '123456';
export const LOGSTOKA_DEMO_COMPANY_ID = 'logstoka-demo-company';
export const LOGSTOKA_DEMO_USER_ID = 'logstoka-demo-user';

export function isLogstokaDemoEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === LOGSTOKA_DEMO_LOGIN_EMAIL;
}

export function isLogstokaDemoLogin(email: string, password: string): boolean {
  return isLogstokaDemoEmail(email) && password === LOGSTOKA_DEMO_LOGIN_PASSWORD;
}

export function buildLogstokaDemoProfile(userId?: string) {
  return {
    id: userId || LOGSTOKA_DEMO_USER_ID,
    email: LOGSTOKA_DEMO_LOGIN_EMAIL,
    full_name: 'Administrador LogStoka',
    role: 'admin',
    company_id: LOGSTOKA_DEMO_COMPANY_ID,
    avatar_url: null as string | null,
    permissions: {} as Record<string, unknown>,
    tem_logstoka: true,
    metadata: { modules: { logstoka: true } },
  };
}

export function buildLogstokaDemoUser(userId?: string) {
  return {
    id: userId || LOGSTOKA_DEMO_USER_ID,
    email: LOGSTOKA_DEMO_LOGIN_EMAIL,
  };
}
