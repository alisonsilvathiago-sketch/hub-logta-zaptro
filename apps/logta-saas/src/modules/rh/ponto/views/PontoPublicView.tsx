import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2, LogIn, LogOut, MapPin, Pause, Play } from 'lucide-react';
import { findPontoConfigByPublicRoute, appendPontoRecord } from '../pontoStorage';
import { mergeProfileFromPontoRecord } from '../colaboradorRhStorage';
import { validatePontoRecord } from '../pontoIntelligence';
import type { PontoConfig, PontoRecord, PontoRecordType } from '../types';

function deviceLabel() {
  if (typeof navigator === 'undefined') return 'web';
  return `${navigator.platform} · ${navigator.userAgent.slice(0, 48)}`;
}

export function PontoPublicView() {
  const { companySlug = '', unitToken = '' } = useParams();
  const [searchParams] = useSearchParams();
  const sectorToken = searchParams.get('setor') ?? undefined;

  const [config, setConfig] = useState<PontoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastOk, setLastOk] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'warn' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const cfg = findPontoConfigByPublicRoute(companySlug, unitToken);
    setConfig(cfg);
    setLoading(false);
  }, [companySlug, unitToken]);

  useEffect(() => {
    if (!config?.geoEnabled) return;
    if (!navigator.geolocation) {
      setGeoError('GPS indisponível neste dispositivo.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      () => setGeoError('Não foi possível obter localização. Ative o GPS.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [config?.geoEnabled]);

  const sectorLabel = useMemo(() => {
    if (!config || !sectorToken) return null;
    return config.sectorQrCodes.find((s) => s.token === sectorToken)?.label ?? null;
  }, [config, sectorToken]);

  const register = async (type: PontoRecordType) => {
    if (!config) return;
    if (!config.isActive) {
      setFeedback({
        tone: 'err',
        text: 'O ponto desta unidade ainda não foi ativado pelo RH. Tente novamente mais tarde.',
      });
      return;
    }
    const doc = document.replace(/\D/g, '');
    if (doc.length < 3 || name.trim().length < 2) {
      setFeedback({ tone: 'err', text: 'Informe nome e CPF/matrícula para registrar.' });
      return;
    }
    if (config.geoEnabled && !geo) {
      setFeedback({ tone: 'err', text: geoError ?? 'Aguardando localização GPS…' });
      return;
    }

    setSubmitting(true);
    try {
      const existing = JSON.parse(
        localStorage.getItem(`logta-ponto-records:${config.companyId}`) ?? '[]',
      ) as PontoRecord[];

      const validation = validatePontoRecord(config, existing, {
        collaboratorDocument: doc,
        type,
        lat: geo?.lat,
        lng: geo?.lng,
        deviceInfo: deviceLabel(),
      });

      const record: PontoRecord = {
        id: `pr-${Date.now()}`,
        companyId: config.companyId,
        configId: config.id,
        sectorId: sectorToken,
        collaboratorId: `colab-${doc}`,
        collaboratorName: name.trim(),
        collaboratorDocument: doc,
        type,
        timestamp: new Date().toISOString(),
        lat: geo?.lat,
        lng: geo?.lng,
        deviceInfo: deviceLabel(),
        distanceMeters: validation.distanceMeters,
        validated: validation.validated,
        flags: validation.flags,
      };

      appendPontoRecord(config.companyId, record);
      mergeProfileFromPontoRecord(config.companyId, record);
      setLastOk(type);
      setFeedback({
        tone: validation.validated ? 'ok' : 'warn',
        text: validation.validated
          ? `${type.replace('_', ' ')} registrado com sucesso.`
          : `Registro salvo com alertas: ${validation.flags.join(', ')}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-6">
        <div className="logta-panel-card max-w-md p-8 text-center">
          <p className="logta-card-heading mb-2">Link inválido ou expirado</p>
          <p className="text-sm font-medium text-gray-500">
            Solicite um novo link de ponto ao administrador da sua empresa.
          </p>
        </div>
      </div>
    );
  }

  if (!config.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-6">
        <div className="logta-panel-card max-w-md p-8 text-center">
          <p className="logta-card-heading mb-2">Ponto ainda não ativado</p>
          <p className="text-sm font-medium text-gray-500">
            O RH da transportadora precisa ativar a configuração de ponto inteligente antes que a equipe
            possa registrar entrada e saída por este link.
          </p>
        </div>
      </div>
    );
  }

  const actions: { type: PontoRecordType; label: string; icon: React.ElementType; tone: string }[] = [
    { type: 'entrada', label: 'Entrada', icon: LogIn, tone: 'bg-primary text-white' },
    { type: 'saida', label: 'Saída', icon: LogOut, tone: 'bg-gray-900 text-white' },
    { type: 'pausa_inicio', label: 'Início pausa', icon: Pause, tone: 'bg-amber-500 text-white' },
    { type: 'pausa_fim', label: 'Fim pausa', icon: Play, tone: 'bg-emerald-600 text-white' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-10 font-sans text-gray-900">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock size={28} />
          </div>
          <h1 className="logta-page-title text-2xl">{config.unitName}</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Registro de ponto Logta</p>
          {sectorLabel ? (
            <p className="mt-1 text-[10px] font-black uppercase text-primary">Setor: {sectorLabel}</p>
          ) : null}
        </div>

        <div className="logta-panel-card space-y-5 p-6 sm:p-8">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400">Nome completo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400">CPF ou matrícula</span>
            <input
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary/50"
            />
          </label>

          {config.geoEnabled ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <MapPin size={14} className="text-primary" />
                Geolocalização
              </div>
              {geo ? (
                <p className="mt-1">
                  GPS capturado: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                </p>
              ) : (
                <p className="mt-1 text-amber-700">{geoError ?? 'Obtendo posição…'}</p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {actions.map((a) => (
              <button
                key={a.type}
                type="button"
                disabled={submitting}
                onClick={() => void register(a.type)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-xs font-black uppercase tracking-normal transition-opacity hover:opacity-90 disabled:opacity-50 ${a.tone}`}
              >
                <a.icon size={20} />
                {a.label}
              </button>
            ))}
          </div>

          {feedback ? (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-bold ${
                feedback.tone === 'ok'
                  ? 'border-green-100 bg-green-50 text-green-700'
                  : feedback.tone === 'warn'
                    ? 'border-amber-100 bg-amber-50 text-amber-800'
                    : 'border-red-100 bg-red-50 text-red-700'
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          {lastOk ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 py-3 text-xs font-bold text-green-700">
              <CheckCircle2 size={16} />
              Último registro: {lastOk.replace('_', ' ')}
            </div>
          ) : null}

          <p className="text-center text-[10px] font-medium text-gray-400">
            Horário operacional {config.operationalHoursStart} – {config.operationalHoursEnd}
          </p>
        </div>
      </div>
    </div>
  );
}
