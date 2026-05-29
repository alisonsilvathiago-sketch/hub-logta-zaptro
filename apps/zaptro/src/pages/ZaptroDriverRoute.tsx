import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, Navigation, Package, Phone, Truck, AlertTriangle, Sparkles, ExternalLink, ShieldBan } from 'lucide-react';
import { isDriverBlockedById, isDriverBlockedByPhone } from '../lib/zaptroDriverProfileExtended';
import {
  employmentTypeLabel,
  formatDriverPhoneDisplay,
  resolveFleetDriverForRoute,
  vehicleOwnershipLabel,
  type FleetDriverContext,
} from '../lib/zaptroFleetDriverResolve';
import ZaptroDriverRouteMap from '../components/Zaptro/ZaptroDriverRouteMap';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import {
  buildGoogleMapsNavigationUrl,
  buildWazeNavigationUrl,
  buildRouteLiveNavigationPatch,
  distanceMeters,
  formatRouteDistance,
  formatRouteDuration,
  openExternalNavigation,
} from '../lib/zaptroRouteNavigation';
import {
  DRIVER_AUTOMATION_EVENTS,
  DRIVER_ROUTE_ACTIONS,
  ROUTE_STATUS_LABEL,
  zaptroPublicTrackPath,
  type RouteExecutionSnapshot,
  type RouteExecutionStatus,
} from '../constants/zaptroRouteExecution';
import { patchRouteLive, readRouteLive, type RouteLiveBucket } from '../constants/zaptroRouteLiveStore';
import { resolveRouteCompanyBranding } from '../lib/zaptroRouteCompanyBranding';
import { ZAPTRO_COMPANY_PROFILE_EVENT } from '../hooks/useZaptroCompanyBusinessProfile';
import {
  readZaptroDriverSelfProfile,
  writeZaptroDriverSelfProfile,
  zaptroCompressImageToDataUrl,
  zaptroProfileInitials,
  type ZaptroDriverSelfProfile,
} from '../utils/zaptroDriverSelfProfile';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { fireTransactionalEmailNonBlocking } from '../lib/fireTransactionalEmail';

const LIME = '#D9FF00';

const DRIVER_PAGE_BG = 'linear-gradient(180deg, #0a0a0a 0%, #111 40%, #0a0a0a 100%)';

/** Full viewport — evita faixas brancas do `body`/`#root` à volta da coluna de 520px. */
const pageShell: React.CSSProperties = {
  minHeight: '100dvh',
  width: '100%',
  boxSizing: 'border-box',
  background: DRIVER_PAGE_BG,
  color: '#f8fafc',
};

const pageInner: React.CSSProperties = {
  maxWidth: 520,
  margin: '0 auto',
  padding: '20px 18px 32px',
  boxSizing: 'border-box',
};

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function demoSnapshot(token: string): RouteExecutionSnapshot {
  return {
    token,
    companyName: 'Zaptro · Transportadora demo',
    deliveryLabel: `Rota ${token.length > 6 ? token.slice(0, 8) : token}`,
    customerName: 'Cliente final (visível só para operação)',
    deliveryAddress: 'Av. Paulista, 1578 — Bela Vista, São Paulo · SP',
    driverDisplayName: 'Você (motorista)',
    status: 'assigned',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Link privado do motorista — **não** é atendimento nem CRM.
 * Mobile-first; token na URL substitui login pesado até existir backend.
 */
const ZaptroDriverRoute: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const waFromUrl = searchParams.get('wa') || searchParams.get('phone') || searchParams.get('whatsapp') || '';
  const decoded = useMemo(() => decodeURIComponent(token) || 'demo', [token]);
  const base = useMemo(() => demoSnapshot(decoded), [decoded]);
  const [status, setStatus] = useState<RouteExecutionStatus>(base.status);
  /** Espelha se existe `watchPosition` ativo — não ler `watchRef` no render (ESLint react-hooks/refs). */
  const [gpsWatchActive, setGpsWatchActive] = useState(false);
  const [liveBucket, setLiveBucket] = useState<RouteLiveBucket | null>(() => readRouteLive(decoded));
  const [profile, setProfile] = useState<ZaptroDriverSelfProfile>(() => readZaptroDriverSelfProfile());
  const [coPhotoFail, setCoPhotoFail] = useState(false);
  const [drPhotoFail, setDrPhotoFail] = useState(false);
  const [brandTick, setBrandTick] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const watchRef = useRef<number | null>(null);
  const lastPersistRef = useRef(0);
  const routeNotifyEmailSentRef = useRef(false);
  const lastTrailPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const [routePlanLoading, setRoutePlanLoading] = useState(false);
  const deliveryTrackingStoppedRef = useRef(false);
  const fleetSyncRef = useRef<string | null>(null);

  const pushDriverProfileToLive = useCallback(
    (p: ZaptroDriverSelfProfile, fleet?: FleetDriverContext | null) => {
      const live = readRouteLive(decoded);
      patchRouteLive(decoded, {
        fleetDriverId: fleet?.id ?? live?.fleetDriverId ?? null,
        driverDisplayName:
          (fleet?.name || asText(p.displayName).trim() || asText(live?.driverDisplayName) || base.driverDisplayName) || null,
        driverPhone: (fleet?.phone || asText(p.phone).trim() || asText(live?.driverPhone)) || null,
        driverVehicle: (fleet?.vehicle || asText(p.vehicle).trim() || asText(live?.driverVehicle)) || null,
        driverAvatarUrl: fleet?.photoUrl ?? p.avatarUrl ?? live?.driverAvatarUrl ?? null,
        driverEmploymentType: fleet?.employmentType ?? live?.driverEmploymentType ?? null,
        driverVehicleOwnership: fleet?.vehicleOwnership ?? live?.driverVehicleOwnership ?? null,
        driverStatsDeliveries: p.deliveries,
        driverStatsRoutes: p.routes,
      });
      setLiveBucket(readRouteLive(decoded));
    },
    [decoded, base.driverDisplayName],
  );

  const fleetDriver = useMemo(
    () =>
      resolveFleetDriverForRoute(
        {
          fleetDriverId: liveBucket?.fleetDriverId,
          driverPhone: liveBucket?.driverPhone,
          driverDisplayName: liveBucket?.driverDisplayName,
          driverVehicle: liveBucket?.driverVehicle,
          driverAvatarUrl: liveBucket?.driverAvatarUrl,
        },
        waFromUrl,
      ),
    [
      liveBucket?.fleetDriverId,
      liveBucket?.driverPhone,
      liveBucket?.driverDisplayName,
      liveBucket?.driverVehicle,
      liveBucket?.driverAvatarUrl,
      waFromUrl,
    ],
  );

  useEffect(() => {
    fleetSyncRef.current = null;
    const live = readRouteLive(decoded);
    setLiveBucket(live);
    if (live?.status) setStatus(live.status);
  }, [decoded]);

  useEffect(() => {
    const h = () => {
      const live = readRouteLive(decoded);
      setLiveBucket(live);
      if (live?.status) setStatus(live.status);
    };
    window.addEventListener('zaptro-route-live', h);
    return () => window.removeEventListener('zaptro-route-live', h);
  }, [decoded]);

  /** Vincula motorista da frota pelo WhatsApp (URL `?wa=`) ou pelo ID/telefone gravado na rota. */
  useEffect(() => {
    const local = readZaptroDriverSelfProfile();
    if (fleetDriver) {
      const syncKey = `${decoded}:${fleetDriver.id}:${fleetDriver.phone}`;
      if (fleetSyncRef.current === syncKey) return;
      fleetSyncRef.current = syncKey;

      const merged: ZaptroDriverSelfProfile = {
        displayName: fleetDriver.name,
        phone: fleetDriver.phone,
        vehicle: fleetDriver.vehicle,
        avatarUrl: fleetDriver.photoUrl ?? local.avatarUrl,
        deliveries: local.deliveries,
        routes: local.routes,
      };
      setProfile(merged);
      try {
        writeZaptroDriverSelfProfile(merged);
      } catch {
        /* ignore quota */
      }
      pushDriverProfileToLive(merged, fleetDriver);
      return;
    }

    fleetSyncRef.current = null;
    const live = readRouteLive(decoded);
    const fromLive: ZaptroDriverSelfProfile = {
      displayName: asText(live?.driverDisplayName).trim() || local.displayName,
      phone: asText(live?.driverPhone).trim() || local.phone,
      vehicle: asText(live?.driverVehicle).trim() || local.vehicle,
      avatarUrl: live?.driverAvatarUrl ?? local.avatarUrl,
      deliveries: local.deliveries,
      routes: local.routes,
    };
    if (fromLive.displayName || fromLive.phone || fromLive.vehicle) {
      setProfile(fromLive);
      return;
    }
    setProfile(local);
  }, [decoded, fleetDriver?.id, fleetDriver?.phone, pushDriverProfileToLive]);

  const saveDriverProfile = () => {
    try {
      writeZaptroDriverSelfProfile(profile);
    } catch {
      notifyZaptro('error', 'Perfil', 'Não foi possível guardar (imagem demasiado grande?). Reduza a foto ou remova a foto.');
      return;
    }
    pushDriverProfileToLive(profile, fleetDriver);
    notifyZaptro('success', 'Perfil', 'Dados do motorista guardados neste aparelho e espelhados na lista de rotas.');
  };

  useEffect(() => {
    const onBrand = () => setBrandTick((n) => n + 1);
    window.addEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onBrand);
    return () => window.removeEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onBrand);
  }, []);

  useEffect(() => {
    setCoPhotoFail(false);
    setDrPhotoFail(false);
  }, [liveBucket?.publicHeaderLogoUrl, driverAvatar, brandTick]);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
        setGpsWatchActive(false);
      }
    };
  }, []);

  const [gpsPermissionState, setGpsPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
      const sync = () => {
        setGpsPermissionState(perm.state === 'granted' ? 'granted' : perm.state === 'denied' ? 'denied' : 'pending');
      };
      sync();
      perm.onchange = sync;
    });
  }, []);

  /** Alinha `html` / `body` / `#root` ao fundo escuro desta rota (evita branco por trás do shell). */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    const prevBodyBgColor = body.style.backgroundColor;
    const prevRootBg = root?.style.background ?? '';
    const prevRootMinH = root?.style.minHeight ?? '';
    html.style.background = DRIVER_PAGE_BG;
    body.style.background = DRIVER_PAGE_BG;
    body.style.backgroundColor = '';
    if (root) {
      root.style.background = DRIVER_PAGE_BG;
      root.style.minHeight = '100dvh';
    }
    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
      body.style.backgroundColor = prevBodyBgColor;
      if (root) {
        root.style.background = prevRootBg;
        root.style.minHeight = prevRootMinH;
      }
    };
  }, []);

  const pushAutomation = (event: string, human: string) => {
    notifyZaptro('success', 'Automação (prévia)', `${human} Evento: ${event} — em produção dispara WhatsApp ao cliente.`);
  };

  const persistStatus = (next: RouteExecutionStatus, extra?: Partial<RouteLiveBucket>) => {
    patchRouteLive(decoded, { status: next, ...extra });
  };

  const setStep = (next: RouteExecutionStatus, event: string, msg: string) => {
    setStatus(next);
    persistStatus(next);
    pushAutomation(event, msg);

    const live = readRouteLive(decoded);
    const to = live?.opsNotifyEmail?.trim() ?? '';
    if (to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) && (next === 'started' || next === 'delivered')) {
      const trackUrl = `${window.location.origin}${zaptroPublicTrackPath(decoded)}`;
      const kind = next === 'started' ? 'delivery_started' : 'delivery_completed';
      fireTransactionalEmailNonBlocking(supabaseZaptro, {
        kind,
        to,
        variables: {
          userName: live?.publicCompanyName || 'Operação',
          message: msg,
          routeLabel: live?.publicCompanyName ? `${live.publicCompanyName} · ${decoded}` : decoded,
          ctaUrl: trackUrl,
          ctaLabel: 'Acompanhar entrega',
        },
      });
    }

    if (next === 'en_route' || next === 'started') {
      startTracking();
    }
  };

  const pararRastreamento = useCallback((reason: 'delivered' | 'cleanup' = 'cleanup') => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setGpsWatchActive(false);
      lastTrailPointRef.current = null;
      if (reason === 'delivered' && !deliveryTrackingStoppedRef.current) {
        deliveryTrackingStoppedRef.current = true;
        routeNotifyEmailSentRef.current = false;
        notifyZaptro('success', 'Entrega concluída', 'Rastreamento terminado automaticamente.');
      }
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      notifyZaptro('warning', 'Localização', 'Geolocalização não disponível neste dispositivo.');
      return;
    }
    if (watchRef.current != null) return;
    if (status === 'delivered') return;

    if (!routeNotifyEmailSentRef.current) {
      routeNotifyEmailSentRef.current = true;
      const live = readRouteLive(decoded);
      const to = live?.opsNotifyEmail?.trim() ?? '';
      if (to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        const trackUrl = `${window.location.origin}${zaptroPublicTrackPath(decoded)}`;
        fireTransactionalEmailNonBlocking(supabaseZaptro, {
          kind: 'route_notification',
          to,
          variables: {
            userName: live?.publicCompanyName || 'Operação',
            message: 'A partilha de localização em tempo real foi activada para esta rota.',
            routeLabel: live?.publicCompanyName ? `${live.publicCompanyName} · ${decoded}` : decoded,
            ctaUrl: trackUrl,
            ctaLabel: 'Ver mapa público',
          },
        });
      }
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const prev = lastTrailPointRef.current;
        if (prev) {
          const moved = distanceMeters(prev, { lat, lng });
          if (moved < 6 && now - lastPersistRef.current < 2000) return;
        } else if (now - lastPersistRef.current < 800) {
          return;
        }
        lastPersistRef.current = now;
        lastTrailPointRef.current = { lat, lng };

        patchRouteLive(decoded, {
          lastLat: lat,
          lastLng: lng,
          lastLocAt: new Date().toISOString(),
        });
        setLiveBucket(readRouteLive(decoded));
      },
      (err) => {
        if (watchRef.current != null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
        setGpsWatchActive(false);
        if (err.code === 1) {
          setGpsPermissionState('denied');
          notifyZaptro('error', 'Localização', 'Permissão negada. Active a localização para continuar a rota.');
          return;
        }
        notifyZaptro('warning', 'Localização', 'Sinal GPS instável — a tentar reconectar…');
        window.setTimeout(() => {
          if (readRouteLive(decoded)?.status !== 'delivered') startTracking();
        }, 3000);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25_000 },
    );

    setGpsWatchActive(true);
  }, [decoded, status]);

  useEffect(() => {
    if (status === 'delivered') {
      pararRastreamento('delivered');
      return;
    }
    deliveryTrackingStoppedRef.current = false;
    if (gpsPermissionState === 'granted' && watchRef.current == null) {
      startTracking();
    }
  }, [gpsPermissionState, startTracking, status, pararRastreamento]);

  const requestCustomerContact = () => {
    patchRouteLive(decoded, { contactRequestedAt: new Date().toISOString() });
    pushAutomation(
      DRIVER_AUTOMATION_EVENTS.CONTACT_REQUESTED,
      'Pedido registado: a operação vê o alerta no rastreio público e pode ligar ao cliente por ti.'
    );
  };

  /** Acidente / ocorrência — alerta só para a operação; o cliente mantém o último estado no link público. */
  const reportOpsIncident = () => {
    const note = window.prompt(
      'Descreva brevemente a ocorrência (acidente, avaria, atraso grave). A operação será alertada.',
      '',
    );
    if (note === null) return;
    patchRouteLive(decoded, {
      opsIncidentAt: new Date().toISOString(),
      opsIncidentNote: note.trim() || 'Ocorrência reportada pelo motorista',
    });
    setLiveBucket(readRouteLive(decoded));
    pushAutomation(
      DRIVER_AUTOMATION_EVENTS.OPS_INCIDENT,
      'Ocorrência registada — a equipa vê em Rotas e deve contactar o motorista. O cliente não vê este alerta.',
    );
    const live = readRouteLive(decoded);
    const to = live?.opsNotifyEmail?.trim() ?? '';
    if (to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      fireTransactionalEmailNonBlocking(supabaseZaptro, {
        kind: 'delivery_status',
        to,
        variables: {
          userName: live?.publicCompanyName || 'Operação',
          status: 'Ocorrência na rota',
          message: `Motorista reportou: ${note.trim() || 'ocorrência sem descrição'}. Contacte o motorista.`,
          ctaUrl: `${window.location.origin}/app/rotas`,
          ctaLabel: 'Abrir Central Logística',
        },
      });
    }
    notifyZaptro('warning', 'Ocorrência enviada', 'A operação foi alertada. Continue quando for seguro ou aguarde instruções.');
  };

  const btn = (active: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '16px 18px',
    borderRadius: 16,
    border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
    backgroundColor: active ? LIME : 'rgba(255,255,255,0.06)',
    color: active ? '#000' : '#f8fafc',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    textAlign: 'center',
  });

  const incidentDisabled = status === 'delivered' || Boolean(liveBucket?.opsIncidentAt);

  const companyBrand = useMemo(
    () => resolveRouteCompanyBranding(liveBucket),
    [liveBucket, brandTick],
  );
  const companyUrl = companyBrand.logoUrl;
  const companyDisplayName = companyBrand.name;
  const displayName = (
    fleetDriver?.name ||
    liveBucket?.driverDisplayName ||
    profile.displayName.trim() ||
    base.driverDisplayName
  ).trim();
  const driverPhone = asText(fleetDriver?.phone || liveBucket?.driverPhone || profile.phone);
  const driverVehicle = asText(fleetDriver?.vehicle || liveBucket?.driverVehicle || profile.vehicle);
  const driverAvatar = fleetDriver?.photoUrl || liveBucket?.driverAvatarUrl || profile.avatarUrl;
  const employmentType = fleetDriver?.employmentType ?? liveBucket?.driverEmploymentType ?? null;
  const vehicleOwnership = fleetDriver?.vehicleOwnership ?? liveBucket?.driverVehicleOwnership ?? null;
  const driverInitials = zaptroProfileInitials(displayName);
  const lastLat = liveBucket?.lastLat;
  const lastLng = liveBucket?.lastLng;
  const destAddress = liveBucket?.destLabel?.trim() || base.deliveryAddress;
  const originAddress = liveBucket?.originLabel?.trim() || '';
  const gpsReady = gpsPermissionState === 'granted' && gpsWatchActive;

  const driverAccessBlocked = useMemo(() => {
    const phone = (driverPhone || '').trim();
    if (phone && isDriverBlockedByPhone(phone)) return true;
    const fid = liveBucket?.fleetDriverId;
    if (fid && isDriverBlockedById(fid)) return true;
    return false;
  }, [driverPhone, liveBucket?.fleetDriverId]);

  const routeLine = useMemo((): [number, number][] => {
    const pts = liveBucket?.navigationPolyline;
    if (!pts?.length) return [];
    return pts.map((p) => [p.lat, p.lng] as [number, number]);
  }, [liveBucket?.navigationPolyline]);

  const driverPos = lastLat != null && lastLng != null ? ([lastLat, lastLng] as [number, number]) : null;
  const originPos =
    liveBucket?.originLat != null && liveBucket?.originLng != null
      ? ([liveBucket.originLat, liveBucket.originLng] as [number, number])
      : null;
  const destPos =
    liveBucket?.destLat != null && liveBucket?.destLng != null
      ? ([liveBucket.destLat, liveBucket.destLng] as [number, number])
      : null;

  const googleNavUrl = useMemo(
    () =>
      buildGoogleMapsNavigationUrl({
        origin: originPos
          ? { lat: originPos[0], lng: originPos[1] }
          : driverPos
            ? { lat: driverPos[0], lng: driverPos[1] }
            : null,
        originAddress: originAddress || null,
        destination: destPos ? { lat: destPos[0], lng: destPos[1] } : destAddress,
      }),
    [originPos, driverPos, originAddress, destPos, destAddress],
  );

  const wazeNavUrl = useMemo(
    () =>
      buildWazeNavigationUrl({
        destination: destPos ? { lat: destPos[0], lng: destPos[1] } : destAddress,
      }),
    [destPos, destAddress],
  );

  useEffect(() => {
    if (status === 'delivered') return;
    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      setRoutePlanLoading(true);
      const live = readRouteLive(decoded);
      if (!live) {
        if (!cancelled) setRoutePlanLoading(false);
        return;
      }

      const patch = await buildRouteLiveNavigationPatch(live, {
        destinationFallback: base.deliveryAddress,
        signal: ac.signal,
        preferDriverPosition: true,
      });
      if (patch && Object.keys(patch).length > 0) {
        patchRouteLive(decoded, patch);
        if (!cancelled) setLiveBucket(readRouteLive(decoded));
      }
      if (!cancelled) setRoutePlanLoading(false);
    })().catch(() => {
      if (!cancelled) setRoutePlanLoading(false);
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    decoded,
    status,
    liveBucket?.originLabel,
    liveBucket?.destLabel,
    liveBucket?.lastLat,
    liveBucket?.lastLng,
    liveBucket?.navigationPolyline?.length,
    liveBucket?.navigationRouteFromLat,
    liveBucket?.navigationRouteFromLng,
    base.deliveryAddress,
  ]);

  const mapHref =
    lastLat != null && lastLng != null ? `https://www.google.com/maps?q=${lastLat},${lastLng}` : null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
  };

  const avatarShell = (side: 'company' | 'driver'): React.CSSProperties => ({
    width: 56,
    height: 56,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: side === 'company' ? 'rgba(37,99,235,0.2)' : 'rgba(148,163,184,0.18)',
  });

  if (driverAccessBlocked) {
    return (
      <div style={pageShell}>
        <div
          style={{
            ...pageInner,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '100dvh',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: 'rgba(239,68,68,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(239,68,68,0.45)',
            }}
          >
            <ShieldBan size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
            Acesso bloqueado
          </h2>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(248,250,252,0.7)', lineHeight: 1.5, margin: 0 }}>
            Este motorista foi bloqueado pela operação e não pode aceder a rotas, links nem partilhar localização.
            Contacte a transportadora se acredita que é um erro.
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'delivered' && gpsPermissionState !== 'granted') {
    return (
      <div style={pageShell}>
        <div style={{ ...pageInner, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100dvh', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: 'rgba(217,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${LIME}` }}>
            <MapPin size={32} color={LIME} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>Localização obrigatória</h2>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(248,250,252,0.7)', lineHeight: 1.5, margin: 0 }}>
            {gpsPermissionState === 'denied'
              ? 'Sem GPS activo não é possível executar a rota. Abra as definições do browser ou do telemóvel e permita a localização para este site.'
              : 'Para iniciar a rota e o cliente acompanhar em tempo real, é obrigatório activar a localização do telemóvel. Sem isso, os botões de entrega ficam bloqueados.'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,0.45)', lineHeight: 1.45, margin: 0 }}>
            Recomendamos também permitir notificações do browser para alertas da operação.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                setGpsPermissionState('denied');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                () => setGpsPermissionState('granted'),
                () => setGpsPermissionState('denied'),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
              );
            }}
            style={{ ...btn(true), marginTop: 10 }}
          >
            Activar localização do telemóvel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShell}>
      <div style={pageInner}>
      <header style={head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {companyUrl && !coPhotoFail ? (
            <img
              src={companyUrl}
              alt={companyDisplayName}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
              onError={() => setCoPhotoFail(true)}
            />
          ) : (
            <div style={logo}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#000' }}>
                {companyDisplayName[0]?.toUpperCase() || 'E'}
              </span>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.55)' }}>
              MOTORISTA · EXECUÇÃO DE ROTA
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
              {companyDisplayName}
            </h1>
          </div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: 'rgba(248,250,252,0.75)', lineHeight: 1.45, fontWeight: 600 }}>
          Este ecrã é só para <strong style={{ color: '#fff' }}>atualizar estado e posição</strong>. Dúvidas comerciais ficam na operação.
        </p>
      </header>

      <main style={main}>
        <section style={card}>
          <p style={eyebrow}>QUEM ESTÁ NESTA ROTA</p>
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.45)' }}>EMPRESA</span>
              <div style={avatarShell('company')}>
                {companyUrl && !coPhotoFail ? (
                  <img
                    src={companyUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setCoPhotoFail(true)}
                  />
                ) : (
                  <Building2 size={26} color="#D9FF00" strokeWidth={2.2} />
                )}
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.45)' }}>MOTORISTA</span>
              <div style={avatarShell('driver')}>
                {driverAvatar && !drPhotoFail ? (
                  <img
                    src={driverAvatar}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setDrPhotoFail(true)}
                  />
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{driverInitials === '·' ? 'Mt' : driverInitials}</span>
                )}
              </div>
            </div>
          </div>
          <h2 style={{ margin: '14px 0 6px', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{displayName}</h2>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(248,250,252,0.78)', lineHeight: 1.45 }}>
            <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {formatDriverPhoneDisplay(driverPhone)} · {driverVehicle.trim() || 'Veículo não indicado'}
          </p>
          {employmentType || vehicleOwnership ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {employmentType ? (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    backgroundColor: employmentType === 'clt' ? 'rgba(217,255,0,0.15)' : 'rgba(251,191,36,0.12)',
                    border: `1px solid ${employmentType === 'clt' ? 'rgba(217,255,0,0.4)' : 'rgba(251,191,36,0.35)'}`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: employmentType === 'clt' ? LIME : '#fbbf24',
                  }}
                >
                  {employmentTypeLabel(employmentType)}
                </span>
              ) : null}
              {vehicleOwnership ? (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(248,250,252,0.85)',
                  }}
                >
                  <Truck size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {vehicleOwnershipLabel(vehicleOwnership)}
                </span>
              ) : null}
            </div>
          ) : null}
          {fleetDriver ? (
            <p style={{ margin: '8px 0 0', fontSize: 11, fontWeight: 600, color: 'rgba(248,250,252,0.45)' }}>
              Identificado pelo WhatsApp cadastrado na frota
            </p>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14 }}>
            <MapPin size={18} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'rgba(248,250,252,0.45)' }}>MORADA DA ENTREGA</p>
              <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'rgba(248,250,252,0.9)', lineHeight: 1.45 }}>
                {liveBucket?.destLabel?.trim() || base.deliveryAddress}
              </p>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.55)', lineHeight: 1.45 }}>
            {mapHref ? (
              <>
                Onde estás (último GPS):{' '}
                <a href={mapHref} target="_blank" rel="noreferrer" style={{ color: LIME, fontWeight: 700 }}>
                  abrir no mapa
                </a>
              </>
            ) : (
              'Sem coordenadas GPS neste momento — o rastreamento activa-se automaticamente.'
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <span
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                backgroundColor: 'rgba(217,255,0,0.12)',
                border: '1px solid rgba(217,255,0,0.35)',
                fontSize: 12,
                fontWeight: 700,
                color: LIME,
              }}
            >
              {profile.deliveries} entregas
            </span>
            <span
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12,
                fontWeight: 700,
                color: '#e2e8f0',
              }}
            >
              {profile.routes} rotas
            </span>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, fontWeight: 600, color: 'rgba(248,250,252,0.4)', lineHeight: 1.4 }}>
            Números locais até haver histórico na conta — altera em “Editar os meus dados”.
          </p>
          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, color: LIME, listStyle: 'none' } as React.CSSProperties}>
              Editar os meus dados neste aparelho
            </summary>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.5)' }}>
                Nome
                <input
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={profile.displayName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Ex.: João Silva"
                />
              </label>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.5)' }}>
                Telemóvel
                <input
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+351 …"
                />
              </label>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.5)' }}>
                Veículo
                <input
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={profile.vehicle}
                  onChange={(e) => setProfile((prev) => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="Ex.: Van branca · AA-00-BB"
                />
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.5)', flex: '1 1 120px' }}>
                  Entregas (contador local)
                  <input
                    type="number"
                    min={0}
                    style={{ ...inputStyle, marginTop: 6 }}
                    value={profile.deliveries}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, deliveries: Math.max(0, Number(e.target.value) || 0) }))
                    }
                  />
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.5)', flex: '1 1 120px' }}>
                  Rotas (contador local)
                  <input
                    type="number"
                    min={0}
                    style={{ ...inputStyle, marginTop: 6 }}
                    value={profile.routes}
                    onChange={(e) => setProfile((prev) => ({ ...prev, routes: Math.max(0, Number(e.target.value) || 0) }))
                    }
                  />
                </label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  style={{ ...btn(false), width: 'auto', padding: '12px 16px', fontSize: 13 }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  Escolher foto de perfil
                </button>
                {profile.avatarUrl ? (
                  <button
                    type="button"
                    style={{ ...btn(false), width: 'auto', padding: '12px 16px', fontSize: 13, opacity: 0.85 }}
                    onClick={() => setProfile((prev) => ({ ...prev, avatarUrl: null }))}
                  >
                    Remover foto
                  </button>
                ) : null}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const url = await zaptroCompressImageToDataUrl(f);
                  if (url) setProfile((prev) => ({ ...prev, avatarUrl: url }));
                  else notifyZaptro('warning', 'Foto', 'Não foi possível ler a imagem.');
                }}
              />
              <button type="button" style={{ ...btn(true), marginTop: 4 }} onClick={saveDriverProfile}>
                Guardar e actualizar /rotas
              </button>
            </div>
          </details>
        </section>

        <section style={card}>
          <p style={eyebrow}>ROTA NO MAPA</p>
          {originAddress ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, marginBottom: 8 }}>
              <Navigation size={16} color="rgba(248,250,252,0.55)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.45)' }}>ORIGEM</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: 'rgba(248,250,252,0.85)', lineHeight: 1.45 }}>{originAddress}</p>
              </div>
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <MapPin size={18} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.45)' }}>DESTINO</p>
              <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'rgba(248,250,252,0.9)', lineHeight: 1.45 }}>{destAddress}</p>
            </div>
          </div>
          <ZaptroDriverRouteMap
            driverPos={driverPos}
            originPos={originPos}
            destPos={destPos}
            routeLine={routeLine}
            height={240}
          />
          {routePlanLoading ? (
            <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.55)' }}>
              A calcular rota no mapa…
            </p>
          ) : liveBucket?.routeDistanceM != null && liveBucket?.routeDurationS != null ? (
            <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, color: LIME }}>
              {formatRouteDistance(liveBucket.routeDistanceM)} · {formatRouteDuration(liveBucket.routeDurationS)} estimados
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              type="button"
              style={{ ...btn(false), flex: 1, padding: '14px 12px', fontSize: 13 }}
              onClick={() => openExternalNavigation(googleNavUrl)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ExternalLink size={16} /> Google Maps
              </span>
            </button>
            <button
              type="button"
              style={{ ...btn(false), flex: 1, padding: '14px 12px', fontSize: 13 }}
              onClick={() => openExternalNavigation(wazeNavUrl)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ExternalLink size={16} /> Waze
              </span>
            </button>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, fontWeight: 600, color: 'rgba(248,250,252,0.45)', lineHeight: 1.45 }}>
            Abre a navegação turn-by-turn no app instalado no telemóvel, com destino e percurso já definidos.
          </p>
        </section>

        <section style={card}>
          <p style={eyebrow}>{base.companyName}</p>
          <h2 style={{ margin: '6px 0 8px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em' }}>{base.deliveryLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
            <MapPin size={18} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(248,250,252,0.88)', lineHeight: 1.45 }}>{destAddress}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Package size={16} color="rgba(248,250,252,0.55)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.55)' }}>Cliente (referência interna)</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{base.customerName}</span>
          </div>
          <div style={statusPill}>
            <Navigation size={16} color="#000" />
            <span style={{ fontWeight: 700, color: '#000' }}>{ROUTE_STATUS_LABEL[status]}</span>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.45)' }}>
            ATUALIZAR ENTREGA
          </p>
          {!gpsReady ? (
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#fecaca', lineHeight: 1.45 }}>
              GPS obrigatório: aguarde a localização activa ou reactive o GPS para avançar na rota.
            </p>
          ) : null}
          {DRIVER_ROUTE_ACTIONS.map((action) => {
            const isActive = status === action.status;
            const isNext =
              (status === 'assigned' || status === 'draft') && action.status === 'en_route'
                ? true
                : status === 'en_route' && action.status === 'started'
                  ? true
                  : status === 'started' && action.status === 'arrived'
                    ? true
                    : status === 'arrived' && action.status === 'delivered'
                      ? true
                      : false;
            const enabled = isNext && status !== 'delivered' && status !== 'issue' && gpsReady;
            return (
              <button
                key={action.status}
                type="button"
                disabled={!enabled}
                style={{ ...btn(isActive), opacity: enabled ? 1 : 0.4 }}
                onClick={() => {
                  if (!gpsReady) {
                    notifyZaptro('warning', 'Localização obrigatória', 'Active o GPS do telemóvel para actualizar o estado da rota.');
                    return;
                  }
                  setStep(action.status, action.event, action.clientMsg);
                }}
              >
                {action.label}
              </button>
            );
          })}
          <button
            type="button"
            disabled={incidentDisabled}
            style={{
              ...btn(false),
              borderColor: 'rgba(248,113,113,0.55)',
              color: '#fecaca',
              opacity: incidentDisabled ? 0.4 : 1,
              marginTop: 6,
            }}
            onClick={reportOpsIncident}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Ocorrência / acidente (só operação)
            </span>
          </button>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(248,250,252,0.45)', lineHeight: 1.45 }}>
            O link do cliente actualiza automaticamente a cada botão. Ocorrências não aparecem no rastreio do cliente.
          </p>
        </section>

        <section style={card}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 999,
              marginBottom: 12,
              backgroundColor: status === 'delivered' ? 'rgba(255,255,255,0.08)' : LIME,
              border: status === 'delivered' ? '1px solid rgba(255,255,255,0.12)' : 'none',
              width: 'fit-content',
            }}
          >
            <MapPin size={18} color={status === 'delivered' ? 'rgba(248,250,252,0.55)' : '#000'} />
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: status === 'delivered' ? 'rgba(248,250,252,0.65)' : '#000',
              }}
            >
              {status === 'delivered'
                ? 'Rastreamento concluído'
                : gpsWatchActive
                  ? 'Rastreamento activo'
                  : 'A activar GPS…'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.55)', lineHeight: 1.45 }}>
            {status === 'delivered'
              ? 'A entrega foi concluída — a partilha de localização terminou automaticamente.'
              : gpsWatchActive
                ? 'A localização é transmitida automaticamente durante toda a rota. Só para quando concluir a entrega no destino.'
                : 'O rastreamento inicia sozinho assim que o GPS estiver activo. Não é possível desactivar manualmente.'}
          </p>
        </section>

        <section style={card}>
          <button type="button" style={{ ...btn(false), marginBottom: 10 }} onClick={requestCustomerContact}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Phone size={18} /> Solicitar contacto com cliente
            </span>
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Sparkles size={16} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.65)', lineHeight: 1.45 }}>
              O pedido fica visível no <strong style={{ color: '#e2e8f0' }}>rastreio público</strong> para a operação ver. Não liga o teu número ao cliente automaticamente.
            </p>
          </div>
        </section>

        <footer style={{ marginTop: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.35)' }}>
          Token: {decoded} · Estado guardado localmente para o cliente acompanhar
        </footer>
      </main>
      </div>
    </div>
  );
};

const head: React.CSSProperties = { marginBottom: 22 };

const logo: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: LIME,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const main: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 };

const card: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
  backgroundColor: 'rgba(255,255,255,0.04)',
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: 'rgba(248,250,252,0.45)',
};

const statusPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 999,
  backgroundColor: LIME,
  width: 'fit-content',
};

export default ZaptroDriverRoute;
