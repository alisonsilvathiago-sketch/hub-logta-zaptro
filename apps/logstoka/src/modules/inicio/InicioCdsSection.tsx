import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaWarehouseScope } from '@/context/LogstokaWarehouseScopeContext';
import { upsertDemoWarehouse } from '@/lib/demoWarehouseStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { canRegisterWarehouses } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { warehouseLocationLabel } from '@/lib/warehouseUtils';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { LsWarehouse } from '@/types';
import WarehouseRegisterModal from '@/modules/warehouses/WarehouseRegisterModal';
import './inicioCdsSection.css';

function physicalCds(warehouses: LsWarehouse[]): LsWarehouse[] {
  return warehouses.filter((warehouse) => warehouse.type === 'physical');
}

const InicioCdsSection: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { visibleWarehouses, reload } = useLogstokaWarehouseScope();
  const demo = isLogstokaDemoCompany(companyId);
  const canRegister = canRegisterWarehouses(profile);
  const [registerOpen, setRegisterOpen] = useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener('logstoka:demo-warehouses-updated', onUpdate);
    window.addEventListener('logstoka:system-pulse', onUpdate);
    return () => {
      window.removeEventListener('logstoka:demo-warehouses-updated', onUpdate);
      window.removeEventListener('logstoka:system-pulse', onUpdate);
    };
  }, [refresh]);

  const cds = useMemo(() => physicalCds(visibleWarehouses), [visibleWarehouses]);

  const scrollTrack = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 280, behavior: 'smooth' });
  };

  const handleRegister = (draft: Parameters<typeof upsertDemoWarehouse>[1]) => {
    if (!companyId || !demo) {
      toast('Cadastro de CD disponível em modo demo — em produção use Configurações');
      return;
    }
    const created = upsertDemoWarehouse(companyId, draft);
    setRegisterOpen(false);
    refresh();
    toast.success(`${created.name} cadastrado`);
  };

  if (cds.length === 0 && !canRegister) return null;

  return (
    <section className="ls-inicio-cds" aria-labelledby="inicio-cds-title">
      <div className="ls-inicio-cds__bar">
        <h2 id="inicio-cds-title" className="ls-inicio-cds__title">
          Centros de Distribuição
        </h2>
        {cds.length > 4 ? (
          <div className="ls-inicio-cds__nav">
            <button type="button" aria-label="CDs anteriores" onClick={() => scrollTrack(-1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Próximos CDs" onClick={() => scrollTrack(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="ls-inicio-cds__carousel-wrap">
        <div ref={trackRef} className="ls-inicio-cds__track" tabIndex={0} aria-label="Lista de CDs">
          {cds.length === 0 ? (
            <p className="ls-inicio-cds__none">Nenhum galpão cadastrado.</p>
          ) : (
            cds.map((warehouse) => (
              <article key={warehouse.id} className="ls-inicio-cds__chip">
                <p className="ls-inicio-cds__chip-name">{warehouse.name}</p>
                <p className="ls-inicio-cds__chip-line">
                  <span>{warehouseLocationLabel(warehouse)}</span>
                  {warehouse.address_line ? <span> · {warehouse.address_line}</span> : null}
                </p>
                <p className="ls-inicio-cds__chip-line">
                  {warehouse.manager_name ?? 'Sem responsável'}
                  {warehouse.manager_phone ? ` · ${warehouse.manager_phone}` : ''}
                </p>
                <Link to={LOGSTOKA_ROUTES.warehouseDetail(warehouse.id)} className="ls-inicio-cds__chip-link">
                  Ver perfil →
                </Link>
              </article>
            ))
          )}
        </div>
      </div>

      {canRegister ? (
        <div className="ls-inicio-cds__footer">
          <button type="button" className="ls-inicio-cds__register-btn" onClick={() => setRegisterOpen(true)}>
            <Plus size={15} strokeWidth={2.4} aria-hidden />
            Cadastrar CD
          </button>
        </div>
      ) : null}

      <WarehouseRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onSave={handleRegister} />
    </section>
  );
};

export default InicioCdsSection;
