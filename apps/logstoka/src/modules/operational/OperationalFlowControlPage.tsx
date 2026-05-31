import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Sliders } from 'lucide-react';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import LogstokaDataModeBadge from '@/components/layout/LogstokaDataModeBadge';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { recordFlowProfileSaved } from '@/lib/activityRecording';
import {
  getTodayFlowPlan,
  loadOperationalProfile,
  operationalModeLabel,
  saveOperationalProfile,
  type OperationalProfileConfig,
  type OperationalTenantMode,
} from '@/lib/operationalProfile';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import OperationalFlowTimeline, { OperationalFlowEditor } from './OperationalFlowTimeline';
import OperationalTodayBanner from './OperationalTodayBanner';
import './operationalFlowTimeline.css';
import './operationalTodayBanner.css';
import './operationalWork.css';

const OperationalFlowControlPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<OperationalProfileConfig>(() =>
    loadOperationalProfile(companyId),
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (companyId) setProfile(loadOperationalProfile(companyId));
  }, [companyId]);

  const todayPlan = useMemo(() => getTodayFlowPlan(profile), [profile]);

  const save = () => {
    if (!companyId) return;
    saveOperationalProfile(companyId, { ...profile, useCustomFlow: true });
    recordFlowProfileSaved(
      { companyId, actorName: authProfile?.full_name?.trim() || 'Operador' },
      profile.flowSyncMode ?? 'manual',
    );
    toast.success('Controle de fluxo salvo — alertas e filas já seguem suas regras');
  };

  return (
    <div className="ls-operational-work space-y-5">
      <OperationalTodayBanner plan={todayPlan} />

      <LogstokaPageHeader
        title="Controle de fluxo"
        icon={<Sliders size={18} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LogstokaDataModeBadge />
            <Link to={LOGSTOKA_ROUTES.OPERATIONAL_WORK} className="ls-btn-secondary text-sm">
              Voltar à operação
            </Link>
            <button type="button" className="ls-btn-primary inline-flex items-center gap-2 text-sm" onClick={save}>
              <Save size={15} />
              Salvar controle
            </button>
          </div>
        }
      />

      <section className="ls-op-card">
        <h3 className="text-base font-black text-gray-900">Perfil da operação</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Objetivo</span>
            <select
              className="ls-input"
              value={profile.mode}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, mode: e.target.value as OperationalTenantMode }))
              }
            >
              <option value="stock">{operationalModeLabel('stock')}</option>
              <option value="full">{operationalModeLabel('full')}</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Encerramento sexta</span>
            <input
              className="ls-input"
              type="time"
              value={profile.fridayCutoff}
              onChange={(e) => setProfile((prev) => ({ ...prev, fridayCutoff: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Origem do fluxo</span>
            <select
              className="ls-input"
              value={profile.flowSyncMode ?? 'manual'}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  flowSyncMode: e.target.value as OperationalProfileConfig['flowSyncMode'],
                }))
              }
            >
              <option value="manual">Manual — editor abaixo</option>
              <option value="api">API — ERP e canais (automático)</option>
              <option value="hybrid">Híbrido — manual + API</option>
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={profile.weekendBatchOnMonday}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, weekendBatchOnMonday: e.target.checked }))
            }
          />
          <span className="text-sm text-gray-700">
            <strong className="text-gray-900">Sexta e sábado → segunda</strong>
            <span className="mt-0.5 block text-xs text-gray-500">
              Vendas do fim de semana entram no lote de expedição de segunda-feira.
            </span>
          </span>
        </label>
      </section>

      <OperationalFlowTimeline
        profile={profile}
        selectedDay={selectedDay}
        onSelectDay={(day) => setSelectedDay((prev) => (prev === day ? null : day))}
      />

      <OperationalFlowEditor profile={profile} onChange={setProfile} onSave={save} />

      <p className="text-xs text-gray-500">
        Pedidos vindos do Bling, ERP ou importação entram nas filas conforme estes horários. O sistema
        alerta atrasos e pendências automaticamente — sem precisar configurar manualmente a cada dia.
      </p>
    </div>
  );
};

export default OperationalFlowControlPage;
