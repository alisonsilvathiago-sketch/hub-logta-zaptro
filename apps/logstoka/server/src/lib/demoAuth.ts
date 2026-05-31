export const LOGSTOKA_DEMO_BEARER = 'logstoka-demo';
export const LOGSTOKA_DEMO_COMPANY_ID = 'logstoka-demo-company';
export const LOGSTOKA_DEMO_USER_ID = 'logstoka-demo-user';

export function parseDemoBearer(authorization?: string): { userId: string; companyId: string } | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (token !== LOGSTOKA_DEMO_BEARER) return null;
  return { userId: LOGSTOKA_DEMO_USER_ID, companyId: LOGSTOKA_DEMO_COMPANY_ID };
}

export function isDemoCompany(companyId?: string | null): boolean {
  return companyId === LOGSTOKA_DEMO_COMPANY_ID;
}

export const DEMO_RAG_CONTEXT = JSON.stringify(
  {
    mode: 'demo',
    note: 'Sessão demo LogStoka — dados simulados. Aiato activo.',
    operational_hint: {
      focus: 'separação, conferência, expedição, atrasados',
      flow: 'sexta+sábado→segunda, domingo+segunda→terça',
    },
  },
  null,
  2,
);
