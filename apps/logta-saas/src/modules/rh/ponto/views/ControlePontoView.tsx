import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collaboratorIdFromDocument } from '../colaboradorRhStorage';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Link2,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTenant } from '../../../../contexts/TenantContext';
import { showToast } from '../../../../components/Toast';
import { LogtaWaveTabStrip } from '../../../../components/LogtaWaveTabStrip';
import { usePontoConfig } from '../hooks/usePontoConfig';
import {
  buildPublicPontoUrl,
  buildSectorQrPath,
  regeneratePublicToken,
  slugifyUnit,
} from '../pontoStorage';
import type { PontoRegistrationMode, PontoValidations } from '../types';

type ControlePontoViewProps = {
  hubPath: string;
  hubLabel: string;
  colaboradoresCount?: number;
};

const internalTabs = [
  { id: 'config', label: 'Configuração', shortLabel: 'Config', icon: Shield },
  { id: 'monitor', label: 'Monitoramento', shortLabel: 'Live', icon: Activity },
  { id: 'alertas', label: 'Alertas IA', shortLabel: 'IA', icon: Sparkles },
];

const priorityClass: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  low: 'bg-gray-50 text-gray-600 border-gray-100',
};

function qrImageUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(data)}`;
}

export function ControlePontoView({
  hubPath,
  hubLabel,
  colaboradoresCount = 0,
}: ControlePontoViewProps) {
  const { config: tenantConfig } = useTenant();
  const companyId = tenantConfig?.id;
  const { config, records, alerts, insights, stats, persistConfig, refreshRecords } =
    usePontoConfig(companyId);

  const [activeTab, setActiveTab] = useState('config');

  const publicUrl = useMemo(() => (config ? buildPublicPontoUrl(config) : ''), [config]);

  const applyMode = useCallback(
    (mode: PontoRegistrationMode) => {
      if (!config) return;
      persistConfig({
        registrationMode: mode,
        qrEnabled: mode === 'qr' || mode === 'both',
        linkEnabled: mode === 'link' || mode === 'both',
      });
      showToast('success', 'Método de registro atualizado.', 'Controle de Ponto');
    },
    [config, persistConfig],
  );

  const copyLink = useCallback(() => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl);
    showToast('success', 'Link público copiado.', 'Controle de Ponto');
  }, [publicUrl]);

  const toggleValidation = (key: keyof PontoValidations) => {
    if (!config) return;
    persistConfig({
      validations: { ...config.validations, [key]: !config.validations[key] },
    });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-400">
        Carregando configuração de ponto…
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-500">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <div className="logta-panel-card--operational p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Clock size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="logta-page-title text-xl sm:text-2xl">Controle de Ponto</h2>
              <p className="mt-1.5 max-w-2xl text-sm font-medium text-gray-600">
                Central de configuração inteligente — QR Code, link público, geolocalização e
                validações operacionais.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[9px] font-bold uppercase text-green-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  IA ativa
                </span>
                <span className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[9px] font-bold uppercase text-gray-600">
                  {colaboradoresCount} colaboradores
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:justify-end">
            <LogtaWaveTabStrip
              variant="button"
              className="logta-icon-tabs--header"
              tabs={internalTabs}
              activeId={activeTab}
              onTabChange={setActiveTab}
            />
            <button
              type="button"
              onClick={() => refreshRecords()}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-white px-4 py-2.5 text-xs font-bold text-primary shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <RefreshCw size={16} /> Sincronizar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Registros hoje', value: String(stats.registrosHoje) },
          { label: 'Online agora', value: String(stats.onlineAgora) },
          { label: 'Atrasos', value: String(stats.atrasos) },
          { label: 'Alertas ativos', value: String(stats.alertasAtivos) },
        ].map((kpi) => (
          <div key={kpi.label} className="logta-stat-card !p-4">
            <p className="logta-stat-card__label logta-stat-card__label--spaced !mb-1">{kpi.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary !text-xl">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
          {/* Coluna esquerda */}
          <div className="space-y-5 min-w-0">
            <div className="logta-panel-card p-5 sm:p-6">
              <h3 className="logta-card-heading mb-2 text-gray-900">Configuração de Ponto Inteligente</h3>
              <p className="mb-4 text-sm font-medium text-gray-500">
                Regras operacionais, horários e limites da unidade.
              </p>
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Nome da unidade</span>
                  <input
                    value={config.unitName}
                    onChange={(e) => {
                      const unitName = e.target.value;
                      persistConfig({ unitName, publicSlug: slugifyUnit(unitName) });
                    }}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Início operação</span>
                    <input
                      type="time"
                      value={config.operationalHoursStart}
                      onChange={(e) => persistConfig({ operationalHoursStart: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Fim operação</span>
                    <input
                      type="time"
                      value={config.operationalHoursEnd}
                      onChange={(e) => persistConfig({ operationalHoursEnd: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Limite de distância (metros)</span>
                  <input
                    type="number"
                    min={10}
                    value={config.maxDistanceMeters}
                    onChange={(e) => persistConfig({ maxDistanceMeters: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Tempo máx. atraso (min)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.maxLateMinutes}
                    onChange={(e) => persistConfig({ maxLateMinutes: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Pausa obrigatória (min)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.mandatoryBreakMinutes}
                    onChange={(e) => persistConfig({ mandatoryBreakMinutes: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Regras de jornada</span>
                  <textarea
                    rows={3}
                    value={config.journeyRules}
                    onChange={(e) => persistConfig({ journeyRules: e.target.value })}
                    className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                  />
                </label>
              </div>
            </div>

            <div className="logta-panel-card p-5 sm:p-6">
              <h3 className="logta-card-heading mb-4 text-gray-900">Método de registro</h3>
              <div className="grid grid-cols-1 gap-3">
                {(
                  [
                    { id: 'qr' as const, label: 'QR Code', icon: QrCode, desc: 'Batida via leitura de QR' },
                    { id: 'link' as const, label: 'Link público', icon: Link2, desc: 'Acesso por URL segura' },
                    { id: 'both' as const, label: 'QR + Link', icon: CheckCircle2, desc: 'Ambos ativos' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyMode(opt.id)}
                    className={`logta-panel-card flex flex-col items-start gap-2 p-4 text-left transition-all ${
                      config.registrationMode === opt.id
                        ? 'border-primary/40 ring-2 ring-primary/20'
                        : 'hover:border-primary/20'
                    }`}
                  >
                    <opt.icon size={20} className="text-primary" />
                    <span className="logta-card-heading text-gray-900">{opt.label}</span>
                    <span className="text-xs font-medium text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="logta-panel-card p-5 sm:p-6">
              <h3 className="logta-card-heading mb-4 text-gray-900">Validações inteligentes</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ['location', 'Localização GPS'],
                    ['schedule', 'Horário operacional'],
                    ['device', 'Dispositivo'],
                    ['distance', 'Distância permitida'],
                    ['journey', 'Jornada'],
                    ['suspicious', 'Tentativa suspeita'],
                    ['multiAccess', 'Múltiplos acessos'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={config.validations[key]}
                      onChange={() => toggleValidation(key)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna direita — link, QR e mapa */}
          <div className="space-y-5 min-w-0">
          {(config.linkEnabled || config.qrEnabled) ? (
            <div className="space-y-5">
              {config.linkEnabled ? (
                <div className="logta-panel-card p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Link2 size={18} className="text-primary" />
                    <h3 className="logta-card-heading">Link público de ponto</h3>
                  </div>
                  <p className="mb-4 text-xs font-medium text-gray-500">
                    Link único, seguro e compartilhável para registro operacional dos colaboradores.
                  </p>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <code className="break-all text-xs font-bold text-gray-800">{publicUrl}</code>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={copyLink} className="hub-premium-pill primary">
                      <Copy size={16} /> Copiar link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = regeneratePublicToken(config);
                        persistConfig(next);
                        showToast('info', 'Novo token de segurança gerado.', 'Controle de Ponto');
                      }}
                      className="hub-premium-pill secondary"
                    >
                      <RefreshCw size={16} /> Regenerar
                    </button>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="hub-premium-pill secondary">
                      Abrir link
                    </a>
                  </div>
                </div>
              ) : null}

              {config.qrEnabled ? (
                <div className="logta-panel-card p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <QrCode size={18} className="text-primary" />
                    <h3 className="logta-card-heading">QR Code operacional</h3>
                  </div>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <img
                      src={qrImageUrl(publicUrl)}
                      alt="QR Code ponto"
                      className="h-48 w-48 rounded-2xl border border-gray-100 bg-white p-2"
                    />
                    <div className="flex-1 space-y-3">
                      <p className="text-xs font-medium text-gray-500">
                        QR dinâmico por unidade. Setores com QR dedicado abaixo.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={qrImageUrl(publicUrl)}
                          download={`qr-ponto-${config.publicSlug}.png`}
                          className="hub-premium-pill secondary"
                        >
                          <Download size={16} /> Baixar QR
                        </a>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="hub-premium-pill secondary"
                        >
                          <Printer size={16} /> Imprimir
                        </button>
                      </div>
                      <div className="space-y-2">
                        {config.sectorQrCodes.map((sector) => {
                          const path =
                            typeof window !== 'undefined'
                              ? `${window.location.origin}${buildSectorQrPath(config, sector.token)}`
                              : buildSectorQrPath(config, sector.token);
                          return (
                            <div
                              key={sector.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                            >
                              <span className="text-xs font-bold text-gray-700">{sector.label}</span>
                              <img
                                src={qrImageUrl(path)}
                                alt={sector.label}
                                className="h-12 w-12 rounded-lg border border-gray-100"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="logta-panel-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              <h3 className="logta-card-heading">Geolocalização</h3>
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={config.geoEnabled}
                onChange={(e) => persistConfig({ geoEnabled: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Captura GPS e validação por raio
            </label>
            <div className="grid grid-cols-1 gap-4">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-400">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={config.geoLat}
                  onChange={(e) => persistConfig({ geoLat: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-400">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={config.geoLng}
                  onChange={(e) => persistConfig({ geoLng: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-400">Raio (m)</span>
                <input
                  type="number"
                  value={config.geoRadiusMeters}
                  onChange={(e) => persistConfig({ geoRadiusMeters: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary/50"
                />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <MapPin className="mx-auto mb-2 text-primary" size={28} />
              <p className="text-xs font-bold text-gray-600">Mapa operacional</p>
              <p className="mt-1 text-[11px] font-medium text-gray-400">
                Centro: {config.geoLat.toFixed(4)}, {config.geoLng.toFixed(4)} — raio {config.geoRadiusMeters}m
              </p>
            </div>
          </div>


          </div>
        </div>
      ) : null}

      {activeTab === 'monitor' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="logta-panel-card overflow-hidden lg:col-span-2">
            <div className="border-b border-gray-100 p-6">
              <h3 className="logta-card-heading">Registros em tempo real</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">Últimas batidas sincronizadas na unidade.</p>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-4">
              {records.length === 0 ? (
                <p className="py-12 text-center text-sm font-medium text-gray-400">
                  Nenhum registro ainda. Compartilhe o link ou QR com a equipe.
                </p>
              ) : (
                <div className="space-y-2">
                  {records.slice(0, 30).map((r) => {
                    const colabId =
                      r.collaboratorId || collaboratorIdFromDocument(r.collaboratorDocument);
                    return (
                      <Link
                        key={r.id}
                        to={`/rh/jornada-ponto/colaborador/${encodeURIComponent(colabId)}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 transition-all hover:border-primary/30 hover:bg-white"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{r.collaboratorName}</p>
                          <p className="text-[10px] font-bold uppercase text-gray-400">
                            {r.type.replace('_', ' ')} · {new Date(r.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.validated ? (
                            <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">
                              OK
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-700">
                              Revisar
                            </span>
                          )}
                          {r.distanceMeters != null ? (
                            <span className="text-[10px] font-bold text-gray-500">{Math.round(r.distanceMeters)}m</span>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-4">KPI operacional RH</h3>
              <ul className="space-y-3 text-xs font-medium text-gray-600">
                <li className="flex justify-between">
                  <span>Funcionários online</span>
                  <span className="font-black text-primary">{stats.onlineAgora}</span>
                </li>
                <li className="flex justify-between">
                  <span>Faltas / ausências</span>
                  <span className="font-black text-amber-600">{alerts.filter((a) => a.category === 'ausencia').length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Banco de horas (est.)</span>
                  <span className="font-black text-gray-900">{stats.bancoHorasEst}</span>
                </li>
                <li className="flex justify-between">
                  <span>Fora da área</span>
                  <span className="font-black text-red-600">{stats.foraArea}</span>
                </li>
              </ul>
            </div>
            <div className="logta-panel-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <h3 className="logta-card-heading">Jornada ativa</h3>
              </div>
              <p className="text-sm text-gray-500">
                {stats.onlineAgora} colaborador(es) com entrada sem saída registrada.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'alertas' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <h3 className="logta-panel-section-title">Alertas automáticos</h3>
            {alerts.length === 0 ? (
              <div className="logta-panel-card p-8 text-center text-sm font-medium text-gray-400">
                Nenhum alerta ativo — operação dentro do esperado.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="logta-panel-card p-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${priorityClass[alert.priority]}`}
                    >
                      {alert.priority}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-gray-400">{alert.category}</span>
                  </div>
                  <h4 className="logta-card-heading mb-1">{alert.title}</h4>
                  <p className="text-xs font-medium text-gray-500">{alert.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="logta-panel-card--operational p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="logta-card-heading text-gray-900">IA operacional RH</h3>
            </div>
            <div className="space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-xl border border-primary/20 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-primary">{ins.title}</p>
                  <p className="mt-1 text-sm font-medium text-gray-600">{ins.detail}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => showToast('success', 'Regras de IA de ponto recalibradas.', 'Logta IA')}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-bold text-white hover:opacity-90"
            >
              Recalibrar IA de ponto
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
