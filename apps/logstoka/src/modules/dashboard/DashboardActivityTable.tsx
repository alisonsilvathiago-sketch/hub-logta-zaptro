import React from 'react';
import { Link } from 'react-router-dom';
import SystemActivityFeed from '@/components/activity/SystemActivityFeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = {
  companyId: string | null;
};

const DashboardActivityTable: React.FC<Props> = ({ companyId }) => (
  <SystemActivityFeed
    companyId={companyId}
    variant="table"
    panel
    showFilters
    showPagination
    pageSize={12}
    title="O que está acontecendo"
    subtitle={
      <>
        Resumo recente —{' '}
        <Link to={LOGSTOKA_ROUTES.ACTIVITY_CENTER} className="font-bold text-orange-600 hover:underline">
          abrir Central de Atividades
        </Link>
      </>
    }
  />
);

export default DashboardActivityTable;
