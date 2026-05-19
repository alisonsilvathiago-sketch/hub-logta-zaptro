import React from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  MapPin,
  Radio,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { resolveCompanyBranding } from '../../../lib/companyBranding';
import { DRIVER_STATUS_STEPS, labelForDriverStatus } from '../motoristaStatus';
import {
  findMotoristaSessionByToken,
  pushMotoristaLocation,
  setMotoristaGpsEnabled,
  updateMotoristaOperationalStatus,
} from '../motoristaOperationalStorage';
import type { DriverOperationalStatus, MotoristaRotaSession } from '../types';

const MOTORISTA_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&h=160&q=80';

const PRIMARY_ACTIONS: DriverOperationalStatus[] = [
  'pedido_recebido',
  'coleta_iniciada',
  'em_transito',
  'saiu_entrega',
  'entrega_realizada',
  'ocorrencia',
];

function enableGpsWithoutPosition(token: string, setSession: (s: MotoristaRotaSession) => void) {
  const enabled = setMotoristaGpsEnabled(token, true);
  if (enabled) {
    setSession(enabled);
    showToast(
      'info',
      'Modo manual ativo. Atualize o status da operação; o rastreio automático ficará disponível quando o GPS for permitido.',
      'Localização',
    );
  }
}

export function MotoristaRotaPublicView() {
  const { token = '' } = useParams();
  const [session, setSession] = React.useState<MotoristaRotaSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activatingGps, setActivatingGps] = React.useState(false);
  const [updating, setUpdating] = React.useState<DriverOperationalStatus | null>(null);
  const [gpsError, setGpsError] = React.useState<string | null>(null);
  const watchRef = React.useRef<number | null>(null);

  const branding = React.useMemo(
    () => (session ? resolveCompanyBranding(session.companyId) : null),
    [session?.companyId],
  );

  React.useEffect(() => {
    setSession(findMotoristaSessionByToken(token));
    setLoading(false);
  }, [token]);

  React.useEffect(() => {
    return () => {
      if (watchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  const startGpsWatch = React.useCallback(() => {
    if (!navigator.geolocation || !token) return;
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const updated = pushMotoristaLocation(token, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: new Date().toISOString(),
        });
        if (updated) setSession(updated);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
  }, [token]);

  const handleEnableGps = async () => {
    if (!token) return;
    setActivatingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('GPS não disponível neste dispositivo.');
      enableGpsWithoutPosition(token, setSession);
      setActivatingGps(false);
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setGpsError('GPS exige HTTPS. Use o link em conexão segura ou continue em modo manual.');
      enableGpsWithoutPosition(token, setSession);
      setActivatingGps(false);
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const enabled = setMotoristaGpsEnabled(token, true);
            if (enabled) {
              setSession(enabled);
              pushMotoristaLocation(token, {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                at: new Date().toISOString(),
              });
              startGpsWatch();
            }
            resolve();
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
      });
      showToast('success', 'Localização ativada. Rastreamento em tempo real ligado.', 'Operação');
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? Number((err as { code: number }).code) : 0;
      const msg =
        code === 1
          ? 'Permissão negada. Toque em “Continuar sem GPS” ou libere a localização nas configurações do navegador.'
          : 'Não foi possível obter a posição. Verifique se o GPS do aparelho está ligado.';
      setGpsError(msg);
      showToast('error', msg, 'Localização');
    } finally {
      setActivatingGps(false);
    }
  };

  const handleContinueWithoutGps = () => {
    if (!token) return;
    enableGpsWithoutPosition(token, setSession);
    setGpsError(null);
  };

  const handleStatus = async (status: DriverOperationalStatus) => {
    if (!token || updating) return;
    setUpdating(status);
    const next = await updateMotoristaOperationalStatus(token, status);
    setUpdating(null);
    if (next) {
      setSession(next);
      showToast('success', labelForDriverStatus(status), 'Status atualizado');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F9FAFB]">
        <p className="text-xs font-bold uppercase text-gray-400">Carregando rota…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F9FAFB] p-8 text-center">
        <Truck size={48} className="text-gray-300" />
        <h1 className="text-xl font-black text-gray-900">Link inválido ou expirado</h1>
        <p className="max-w-sm text-sm text-gray-500">Solicite um novo link operacional à central Logta.</p>
      </div>
    );
  }

  const gpsReady = session.gpsEnabled;

  return (
    <div className="motorista-public-page min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#F9FAFB] text-gray-900">
      <div className="mx-auto w-full max-w-lg px-4 py-5 sm:py-8">
        {branding?.logoUrl ? (
          <div className="mb-5 flex justify-center">
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="h-14 max-w-[200px] object-contain"
            />
          </div>
        ) : null}

        <header className="mb-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <img
              src={MOTORISTA_AVATAR}
              alt={session.motoristaNome}
              className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-normal text-gray-400">Portal do motorista</p>
              <p className="truncate text-sm font-black text-gray-900">{session.motoristaNome}</p>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase text-primary">{session.numeroFrete}</p>
          <h1 className="mt-1 text-[23px] font-bold leading-tight tracking-normal text-gray-900">
            {session.clienteNome}
          </h1>
          <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-gray-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>
              {session.origem} → {session.destino}
            </span>
          </p>
          {session.placa ? (
            <p className="mt-2 text-xs font-bold text-gray-500">Veículo: {session.placa}</p>
          ) : null}
          <div className="mt-4 inline-flex rounded-full bg-orange-100 px-3 py-1.5 text-[10px] font-black uppercase text-orange-800">
            {labelForDriverStatus(session.operationalStatus)}
          </div>
        </header>

        {!gpsReady ? (
          <section className="mb-5 rounded-[28px] border border-primary/20 bg-primary/5 p-5 sm:rounded-[32px]">
            <div className="flex items-start gap-3">
              <img
                src={MOTORISTA_AVATAR}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-primary/20"
              />
              <div>
                <h2 className="text-sm font-black text-gray-900">Ativar localização</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                  Para atualizar a rota e sincronizar com a central, permita GPS neste dispositivo.
                </p>
                {gpsError ? <p className="mt-2 text-xs font-semibold text-red-600">{gpsError}</p> : null}
              </div>
            </div>
            <button
              type="button"
              disabled={activatingGps}
              onClick={() => void handleEnableGps()}
              className="mt-4 w-full rounded-2xl bg-[#18191B] py-4 text-[20px] font-bold uppercase tracking-normal text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {activatingGps ? 'Ativando…' : 'Ativar GPS e continuar'}
            </button>
            <button
              type="button"
              onClick={handleContinueWithoutGps}
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Continuar sem GPS (status manual)
            </button>
          </section>
        ) : (
          <>
            <section className="mb-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-gray-400">Status da operação</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[9px] font-black uppercase text-green-700">
                  <Radio size={10} /> {session.lastLocation ? 'GPS ativo' : 'Modo operacional'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PRIMARY_ACTIONS.map((id) => {
                  const step = DRIVER_STATUS_STEPS.find((s) => s.id === id);
                  if (!step) return null;
                  const active = session.operationalStatus === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!!updating}
                      onClick={() => void handleStatus(id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-primary/30'
                      } disabled:opacity-50`}
                    >
                      {updating === id ? 'Atualizando…' : step.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mb-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-black uppercase text-gray-400">Mais status</p>
              <div className="flex flex-wrap gap-2">
                {DRIVER_STATUS_STEPS.filter((s) => !PRIMARY_ACTIONS.includes(s.id)).map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!!updating}
                    onClick={() => void handleStatus(step.id)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-700 hover:border-primary/30"
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </section>

            {session.lastLocation ? (
              <section className="mb-5 rounded-[28px] border border-gray-100 bg-white p-4 text-xs text-gray-600">
                <p className="font-bold text-gray-900">Última posição enviada</p>
                <p className="mt-1">
                  {session.lastLocation.lat.toFixed(5)}, {session.lastLocation.lng.toFixed(5)}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date(session.lastLocation.at).toLocaleString('pt-BR')}
                </p>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                <ShieldCheck size={12} /> Histórico
              </p>
              <div className="max-h-48 space-y-3 overflow-y-auto">
                {[...session.history].reverse().map((h) => (
                  <div key={h.id} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-[10px] font-bold text-gray-400">
                      {new Date(h.at).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs font-semibold text-gray-800">{h.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-[10px] font-semibold uppercase text-gray-400">
              <CheckCircle2 size={12} className="text-primary" />
              Sincronizado com gestão de fretes e mapa operacional
            </p>
          </>
        )}
      </div>
    </div>
  );
}
