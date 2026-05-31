import React from 'react';
import { Building2, Layers3, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { demoCompanyLabel, LOGSTOKA_ORG_HIERARCHY, profileOrgScopeLabel } from '@/lib/logstokaOrgModel';
import { displayRoleLabel } from '@/lib/permissions';
import './logstokaOrgHierarchyBanner.css';

type Props = {
  compact?: boolean;
};

const LogstokaOrgHierarchyBanner: React.FC<Props> = ({ compact = false }) => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { isGlobalView, visibleWarehouses } = useLogstokaWarehouseScope();

  return (
    <section className={`ls-org-banner${compact ? ' ls-org-banner--compact' : ''}`} aria-label="Estrutura da empresa">
      <div className="ls-org-banner__head">
        <div>
          <p className="ls-org-banner__eyebrow">Como funciona</p>
          <h2 className="ls-org-banner__title">{demoCompanyLabel(companyId)} · Multi-CD</h2>
          <p className="ls-org-banner__subtitle">
            Uma empresa (sede) · vários galpões (CDs) · estoque separado por CD · produto único no catálogo.
          </p>
        </div>
        <div className="ls-org-banner__you">
          <ShieldCheck size={16} aria-hidden />
          <div>
            <p className="ls-org-banner__you-role">{displayRoleLabel(profile)}</p>
            <p className="ls-org-banner__you-scope">{profileOrgScopeLabel(profile)}</p>
            {!isGlobalView && visibleWarehouses[0] ? (
              <p className="ls-org-banner__you-cd">CD: {visibleWarehouses[0].name}</p>
            ) : null}
          </div>
        </div>
      </div>

      {!compact ? (
        <ol className="ls-org-banner__layers">
          {LOGSTOKA_ORG_HIERARCHY.map((layer, index) => (
            <li key={layer.layer} className="ls-org-banner__layer">
              <span className="ls-org-banner__layer-step">{index + 1}</span>
              <div>
                <p className="ls-org-banner__layer-title">{layer.title}</p>
                <p className="ls-org-banner__layer-desc">{layer.description}</p>
                <p className="ls-org-banner__layer-example">Ex.: {layer.example}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ls-org-banner__chips">
          <span>
            <Building2 size={14} aria-hidden /> Sede = empresa contratante
          </span>
          <span>
            <Layers3 size={14} aria-hidden /> CD = galpão / depósito
          </span>
          <span>
            <Package size={14} aria-hidden /> Estoque = por CD, produto único
          </span>
        </div>
      )}
    </section>
  );
};

export default LogstokaOrgHierarchyBanner;
