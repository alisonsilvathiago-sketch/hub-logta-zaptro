import React from 'react';
import { Scan } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import { useLogstokaXRay } from './LogstokaXRayContext';
import { getXRayContextTitle, resolveXRayPageContext } from './xrayPageContext';

type Props = {
  className?: string;
  onResolve?: () => void;
};

const LogstokaXRayTrigger: React.FC<Props> = ({ className = '', onResolve }) => {
  const { pathname } = useLocation();
  const { openXRay } = useLogstokaXRay();
  const context = resolveXRayPageContext(pathname);

  return (
    <LogstokaIconTooltip label={`Raio-X · ${getXRayContextTitle(context)}`}>
      <button
        type="button"
        onClick={() => openXRay(context, onResolve)}
        className={`lsdash-icon-btn active xray-btn ${className}`.trim()}
        aria-label="Raio-X da página"
      >
        <Scan size={18} strokeWidth={2} />
      </button>
    </LogstokaIconTooltip>
  );
};

export default LogstokaXRayTrigger;
