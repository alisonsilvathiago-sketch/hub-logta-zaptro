import { hasLogstokaMockSession } from '@/lib/logstokaAuthSession';
import { LOGSTOKA_DEMO_COMPANY_ID } from '@/lib/logstokaDemoAuth';

export function isLogstokaDemoCompany(companyId?: string | null): boolean {
  return companyId === LOGSTOKA_DEMO_COMPANY_ID || hasLogstokaMockSession();
}
