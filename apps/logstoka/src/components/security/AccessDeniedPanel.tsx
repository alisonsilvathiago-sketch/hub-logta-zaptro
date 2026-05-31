import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = {
  compact?: boolean;
  title?: string;
  message?: string;
};

const AccessDeniedPanel: React.FC<Props> = ({
  compact = false,
  title = 'Acesso não permitido',
  message = 'Seu perfil de colaborador não tem permissão para ver estes dados. Solicite liberação ao administrador da empresa.',
}) => (
  <div
    className={`ls-access-denied${compact ? ' ls-access-denied--compact' : ''}`}
    role="alert"
  >
    <div className="ls-access-denied__icon" aria-hidden>
      <ShieldX size={compact ? 28 : 40} strokeWidth={2} />
    </div>
    <h2 className="ls-access-denied__title">{title}</h2>
    <p className="ls-access-denied__text">{message}</p>
    <Link to={LOGSTOKA_ROUTES.HOME} className="ls-btn-primary text-sm mt-4 inline-flex">
      Voltar ao início
    </Link>
  </div>
);

export default AccessDeniedPanel;
