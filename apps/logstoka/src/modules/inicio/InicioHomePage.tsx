import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  PackageSearch,
  Truck,
  Upload,
} from 'lucide-react';
import LogstokaClickableHint from '@/components/ui/LogstokaClickableHint';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  buildDemoOperationalOrders,
  summarizeOperationalQueue,
  type OrderListFilter,
} from '@/lib/operationalFlow';
import {
  getTodayFlowPlan,
  loadOperationalProfile,
} from '@/lib/operationalProfile';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import OperationalWorkSheetModal from '@/modules/operational/OperationalWorkSheetModal';
import './inicioHome.css';

const InicioHomePage: React.FC = () => {
  const { profile } = useAuth();
  const { branding } = useLogstokaBranding();
  const { companyId } = useLogstokaTenant();
  const operationalProfile = loadOperationalProfile(companyId);
  const firstName = profile?.full_name?.split(' ')[0] || 'Operador';
  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'O';
  const [sheetFilter, setSheetFilter] = useState<OrderListFilter | null>(null);

  const todayPlan = useMemo(() => getTodayFlowPlan(operationalProfile), [operationalProfile]);
  const orders = useMemo(
    () => buildDemoOperationalOrders(new Date(), operationalProfile),
    [operationalProfile],
  );
  const summary = useMemo(
    () => summarizeOperationalQueue(orders, todayPlan),
    [orders, todayPlan],
  );

  const nextStep = useMemo(() => {
    if (summary.late > 0) {
      return {
        text: `${summary.late} pedido(s) atrasado(s) — priorize antes do corte`,
        hint: 'Fora do prazo do fluxo de saída',
        filter: 'late' as OrderListFilter,
        label: 'Ver atrasados',
      };
    }
    if (summary.todayFocus > 0) {
      return {
        text: `${summary.todayFocus} pedido(s) para separar e conferir hoje`,
        hint: `Fluxo: ${todayPlan.processSaleDays.join(' + ')} · saída ${todayPlan.dailyCutoff}`,
        filter: 'now' as OrderListFilter,
        label: 'Abrir lista',
      };
    }
    if (summary.notSent > 0) {
      return {
        text: `${summary.notSent} ainda não saíram para transportadora`,
        hint: 'Expedição pendente na operação',
        filter: 'all' as OrderListFilter,
        label: 'Ver não enviados',
      };
    }
    return {
      text: 'Operação em dia — nada urgente no momento',
      hint: `${todayPlan.weekdayLabel} · saída até ${todayPlan.dailyCutoff}`,
      href: LOGSTOKA_ROUTES.OPERATIONAL_WORK,
      label: 'Ver operação',
    };
  }, [summary, todayPlan]);

  const roleLabel =
    profile?.role === 'admin' || profile?.role === 'master_admin'
      ? 'Administrador'
      : profile?.role === 'logistics_manager'
        ? 'Gestor logístico'
        : profile?.role === 'operator'
          ? 'Operador'
          : 'Equipe';

  const companyLabel = branding.companyName?.trim() || 'LogStoka';

  return (
    <div className="ls-inicio-home ls-inicio-home--minimal">
      <section className="ls-inicio-minimal">
        <header className="ls-inicio-minimal__top">
          <div>
            <div className="ls-inicio-minimal__greet">
              <div className="ls-inicio-minimal__avatar" aria-hidden>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="ls-inicio-minimal__greet-text">
                <h1>
                  Olá, {firstName} <span className="ls-inicio-minimal__wave" aria-hidden>👋</span>
                </h1>
                <p className="ls-inicio-minimal__role">
                  {roleLabel} · {companyLabel}
                </p>
              </div>
            </div>
            <p className="ls-inicio-minimal__lead">
              Separe, confira e expedir — o essencial da operação, sem ruído de ERP.
            </p>
          </div>
          <div className="ls-inicio-minimal__flow-badge">
            <CalendarClock size={16} aria-hidden />
            <div>
              <p className="ls-inicio-minimal__flow-badge-label">{todayPlan.weekdayLabel}</p>
              <p className="ls-inicio-minimal__flow-badge-value">
                Saída até <strong>{todayPlan.dailyCutoff}</strong>
              </p>
            </div>
          </div>
        </header>

        <div className="ls-inicio-minimal__stats">
          <button
            type="button"
            className="ls-inicio-minimal__stat ls-inicio-minimal__stat--clickable ls-inicio-minimal__stat--focus"
            onClick={() => setSheetFilter('now')}
            aria-label={`Ver ${summary.todayFocus} pedidos em foco hoje`}
          >
            <LogstokaClickableHint />
            <strong>{summary.todayFocus}</strong>
            <span>Foco hoje</span>
          </button>
          <button
            type="button"
            className={`ls-inicio-minimal__stat ls-inicio-minimal__stat--clickable${summary.late > 0 ? ' ls-inicio-minimal__stat--alert' : ''}`}
            onClick={() => setSheetFilter('late')}
            aria-label={`Ver ${summary.late} pedidos atrasados`}
          >
            <LogstokaClickableHint />
            <strong>{summary.late}</strong>
            <span>Atrasados</span>
          </button>
          <button
            type="button"
            className="ls-inicio-minimal__stat ls-inicio-minimal__stat--clickable"
            onClick={() => setSheetFilter('all')}
            aria-label={`Ver ${summary.notSent} pedidos não enviados`}
          >
            <LogstokaClickableHint />
            <strong>{summary.notSent}</strong>
            <span>Não enviados</span>
          </button>
        </div>

        <div className="ls-inicio-minimal__grid">
          <div className="ls-inicio-minimal__panel">
            <div className="ls-inicio-minimal__next">
              <p className="ls-inicio-minimal__next-kicker">
                {summary.late > 0 ? (
                  <>
                    <AlertTriangle size={12} aria-hidden /> Prioridade
                  </>
                ) : (
                  'Próximo passo'
                )}
              </p>
              <p className="ls-inicio-minimal__next-text">{nextStep.text}</p>
              <p className="ls-inicio-minimal__next-hint">{nextStep.hint}</p>
              {'filter' in nextStep && nextStep.filter ? (
                <button
                  type="button"
                  className="ls-inicio-minimal__next-btn"
                  onClick={() => setSheetFilter(nextStep.filter!)}
                >
                  {nextStep.label}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link to={nextStep.href!} className="ls-inicio-minimal__next-btn">
                  {nextStep.label}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>

            <Link to={LOGSTOKA_ROUTES.OPERATIONAL_WORK} className="ls-inicio-minimal__cta">
              Abrir operação do dia
              <ArrowRight size={18} />
            </Link>

            <p className="ls-inicio-minimal__flow">
              Processar vendas de <strong>{todayPlan.processSaleDays.join(' + ')}</strong>
            </p>
          </div>

          <div className="ls-inicio-minimal__actions">
            <p className="ls-inicio-minimal__actions-title">Ações rápidas</p>
            <div className="ls-inicio-minimal__actions-grid">
              <Link to="/app/picking" className="ls-inicio-minimal__action">
                <ClipboardCheck size={20} />
                <span>Conf. do dia</span>
              </Link>
              <Link to={LOGSTOKA_ROUTES.CONFERENCE_PENDING} className="ls-inicio-minimal__action">
                <PackageSearch size={20} />
                <span>Pendências</span>
              </Link>
              <Link to="/app/movements" className="ls-inicio-minimal__action">
                <Truck size={20} />
                <span>Expedir</span>
              </Link>
              <Link to="/app/imports" className="ls-inicio-minimal__action">
                <Upload size={20} />
                <span>Importar</span>
              </Link>
            </div>
          </div>
        </div>

        <nav className="ls-inicio-minimal__quick" aria-label="Atalhos">
          <Link to={LOGSTOKA_ROUTES.ACTIVITY_CENTER}>
            <Clock3 size={15} />
            Central de Atividades
          </Link>
          <Link to={LOGSTOKA_ROUTES.OPERATIONAL_FLOW}>Controle de fluxo</Link>
          <Link to={LOGSTOKA_ROUTES.CONFERENCE_PENDING}>Pendências</Link>
        </nav>

        {operationalProfile.mode === 'full' ? (
          <Link to={LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL} className="ls-inicio-minimal__secondary">
            Conectar marketplaces →
          </Link>
        ) : (
          <Link to={LOGSTOKA_ROUTES.SETTINGS_COMPANY} className="ls-inicio-minimal__secondary">
            Configurar meu fluxo →
          </Link>
        )}
      </section>

      <OperationalWorkSheetModal
        open={sheetFilter !== null}
        filter={sheetFilter}
        orders={orders}
        todayPlan={todayPlan}
        onClose={() => setSheetFilter(null)}
      />
    </div>
  );
};

export default InicioHomePage;
