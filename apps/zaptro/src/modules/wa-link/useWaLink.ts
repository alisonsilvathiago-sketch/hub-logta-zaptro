import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import {
  activateWhatsappInbox,
  connectWhatsapp,
  disconnect as disconnectEvolution,
  getConnectionState,
} from '../../services/evolution.service';
import {
  createEvolutionInstance,
  fetchEvolutionQrCode,
  getEvolutionConnectionState,
  getEvolutionLiveStatus,
  logoutEvolutionInstance,
} from '../../services/evolution';
import { importWhatsappProfileToCompany } from '../../lib/zaptroImportWhatsappProfile';
import { syncWhatsappMirrorContactsAfterConnect } from '../../lib/loadWhatsappMirrorContacts';
import { resolveCompanyIdForWhatsapp, resolveZaptroActorId, resolveZaptroCompanyId } from '../../utils/zaptroSession';
import {
  activateWaLinkInboxDirect,
  resolveWaLinkInboxCompanyId,
  waLinkDefaultCompanyId,
} from '../../lib/waLinkInboxActivate';
import {
  clearWaLinkSession,
  markWaLinkSessionConnected,
  readWaLinkSession,
  resolveWaLinkConnectInstance,
  waLinkEdgeUnavailableError,
  waLinkHasDirectEvolutionKey,
  waLinkShouldUseEdge,
  waLinkSharedInstance,
} from './waLinkConfig';

export type WaLinkPhase =
  | 'boot'
  | 'disconnected'
  | 'loading_qr'
  | 'scan_qr'
  | 'confirm_phone'
  | 'connected'
  | 'error';

function isPairingState(state: string): boolean {
  const s = state.trim().toLowerCase();
  return ['connecting', 'pairing', 'loading', 'syncing'].includes(s);
}

export function useWaLink() {
  const { user, profile, refreshProfile } = useAuth();

  const [authReady, setAuthReady] = useState(false);
  const [hasJwt, setHasJwt] = useState(false);
  const [phase, setPhase] = useState<WaLinkPhase>('boot');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [evoState, setEvoState] = useState('—');
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(() => resolveZaptroCompanyId(profile, null));

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inboxActivatedRef = useRef(false);
  const bootStartedRef = useRef(false);
  const profileImportBusyRef = useRef(false);

  const actorId = useMemo(() => resolveZaptroActorId(user, profile), [user, profile]);

  const instanceName = useMemo(
    () => resolveWaLinkConnectInstance(actorId, companyId),
    [actorId, companyId],
  );

  const preferEdge = waLinkShouldUseEdge(hasJwt);
  const [edgeDegraded, setEdgeDegraded] = useState(false);
  const useEdgeApi = preferEdge && !edgeDegraded;
  const useLocalProxy = !useEdgeApi && waLinkHasDirectEvolutionKey();

  const fetchLiveDirect = useCallback(async () => {
    const live = await getEvolutionLiveStatus(instanceName);
    return {
      instance: instanceName,
      state: live.state,
      connected: live.connected,
      phone: live.phone,
      raw: null,
    };
  }, [instanceName]);

  useEffect(() => {
    void supabaseZaptro.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      setHasJwt(Boolean(data.session?.access_token && id && id !== 'hub-dev-local-user'));
      setAuthReady(true);
    });
    const { data: sub } = supabaseZaptro.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id;
      setHasJwt(Boolean(session?.access_token && id && id !== 'hub-dev-local-user'));
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopProfileSync = useCallback(() => {
    if (profileSyncRef.current) {
      clearInterval(profileSyncRef.current);
      profileSyncRef.current = null;
    }
  }, []);

  const runProfileImport = useCallback(
    async (cid: string) => {
      if (profileImportBusyRef.current) return;
      profileImportBusyRef.current = true;
      try {
        const result = await importWhatsappProfileToCompany({
          companyId: cid,
          userId: user?.id,
          silent: true,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('zaptro:wa-connected', {
              detail: { companyId: cid, profile: result.profile, imported: result.imported },
            }),
          );
        }
      } catch (e) {
        console.warn('[wa-link] importWhatsappProfile:', e);
      } finally {
        profileImportBusyRef.current = false;
      }
    },
    [user?.id],
  );

  const ensureCompany = useCallback(async (): Promise<string | null> => {
    if (!hasJwt) return null;
    let cid = resolveZaptroCompanyId(profile, null) || companyId;
    if (cid) return cid;
    cid = await resolveCompanyIdForWhatsapp(user, profile, null, refreshProfile);
    if (cid) setCompanyId(cid);
    return cid;
  }, [profile, companyId, user, refreshProfile, hasJwt]);

  const activateInboxOnce = useCallback(
    async (cid: string | null, inst: string) => {
      if (inboxActivatedRef.current) return;
      const effectiveCompany = cid?.trim() || waLinkDefaultCompanyId();
      try {
        if (useEdgeApi && effectiveCompany) {
          await activateWhatsappInbox(effectiveCompany, inst);
        } else {
          await activateWaLinkInboxDirect(inst, effectiveCompany);
        }
        inboxActivatedRef.current = true;
      } catch (e) {
        console.warn('[wa-link] activateInbox:', e);
      }
    },
    [useEdgeApi],
  );

  const fetchLive = useCallback(async () => {
    if (useEdgeApi) {
      try {
        return await getConnectionState(instanceName);
      } catch (e) {
        if (!waLinkEdgeUnavailableError(e) || !waLinkHasDirectEvolutionKey()) throw e;
        console.warn('[wa-link] Edge sem secrets — proxy directo (/evolution-api):', e);
        setEdgeDegraded(true);
        return fetchLiveDirect();
      }
    }
    return fetchLiveDirect();
  }, [instanceName, useEdgeApi, fetchLiveDirect]);

  const settleDisconnected = useCallback((state: string) => {
    const nextPhase =
      phase === 'loading_qr' || phase === 'scan_qr' || phase === 'confirm_phone'
        ? phase
        : 'disconnected';
    if (nextPhase === 'disconnected') {
      clearWaLinkSession();
      setPhone(null);
      setQrDataUrl(null);
      inboxActivatedRef.current = false;
    }
    setEvoState(state || 'close');
    setPhase(nextPhase);
  }, [phase]);

  const applyLiveState = useCallback(
    async (live: { connected: boolean; phone: string | null; state: string }, opts?: { fromPoll?: boolean }) => {
      setEvoState(live.state || 'unknown');

      if (live.connected) {
        stopPoll();
        setQrDataUrl(null);
        setPhase('connected');
        setError(null);
        setPhone(live.phone);
        const ensured = await ensureCompany();
        const cid = resolveWaLinkInboxCompanyId(profile, ensured || readWaLinkSession().companyId, user?.id);
        markWaLinkSessionConnected(instanceName, live.phone, cid);
        if (cid) {
          await activateInboxOnce(cid, instanceName);
          void runProfileImport(cid);
          void syncWhatsappMirrorContactsAfterConnect({ companyId: cid, userId: user?.id });
        }
        return;
      }

      if (isPairingState(live.state)) {
        setPhase((p) =>
          p === 'scan_qr' || p === 'loading_qr' || p === 'boot' ? 'confirm_phone' : p,
        );
        return;
      }

      if (!live.connected) {
        clearWaLinkSession();
        setPhone(null);
        settleDisconnected(live.state);
      }
    },
    [activateInboxOnce, ensureCompany, instanceName, profile, runProfileImport, settleDisconnected, stopPoll, user?.id],
  );

  useEffect(() => {
    if (phase !== 'connected' || !companyId) {
      stopProfileSync();
      return;
    }
    stopProfileSync();
    profileSyncRef.current = setInterval(() => {
      void runProfileImport(companyId);
    }, 20000);
    return () => stopProfileSync();
  }, [phase, companyId, runProfileImport, stopProfileSync]);

  const refreshStatus = useCallback(async () => {
    setError(null);
    try {
      const live = await fetchLive();
      await applyLiveState(live, { fromPoll: true });
      return live;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      settleDisconnected('erro');
      return null;
    }
  }, [applyLiveState, fetchLive, settleDisconnected]);

  const startPoll = useCallback(() => {
    stopPoll();
    pollRef.current = setInterval(() => {
      void refreshStatus();
    }, 2500);
  }, [refreshStatus, stopPoll]);

  const requestQrDirect = useCallback(async (): Promise<{ qrDataUrl: string | null; alreadyOpen: boolean }> => {
    const state = await getEvolutionConnectionState(instanceName);
    if (state === 'open') return { qrDataUrl: null, alreadyOpen: true };

    let qr = await fetchEvolutionQrCode(instanceName);
    if (!qr) {
      const { qrFromCreate } = await createEvolutionInstance(instanceName);
      qr = qrFromCreate || (await fetchEvolutionQrCode(instanceName));
    }
    return { qrDataUrl: qr, alreadyOpen: false };
  }, [instanceName]);

  const requestQr = useCallback(async (): Promise<{ qrDataUrl: string | null; alreadyOpen: boolean }> => {
    if (useEdgeApi) {
      try {
        const linked = await connectWhatsapp(instanceName);
        if (!linked.qrDataUrl && linked.status === 'open') {
          return { qrDataUrl: null, alreadyOpen: true };
        }
        return { qrDataUrl: linked.qrDataUrl, alreadyOpen: false };
      } catch (edgeErr) {
        if (!waLinkEdgeUnavailableError(edgeErr) || !waLinkHasDirectEvolutionKey()) throw edgeErr;
        console.warn('[wa-link] Edge connect falhou, proxy directo:', edgeErr);
        setEdgeDegraded(true);
        return requestQrDirect();
      }
    }

    return requestQrDirect();
  }, [instanceName, useEdgeApi, requestQrDirect]);

  const startLink = useCallback(async () => {
    setError(null);
    stopPoll();

    if (!waLinkHasDirectEvolutionKey() && !useEdgeApi) {
      const goMode =
        import.meta.env.VITE_EVOLUTION_API_MODE !== 'legacy' &&
        import.meta.env.VITE_EVOLUTION_API_MODE !== 'evolution-api';
      setError(
        goMode
          ? 'Configure VITE_EVOLUTION_INSTANCE_API_KEY (token da instância) ou VITE_EVOLUTION_API_KEY (global) no .env.local.'
          : 'Configure VITE_EVOLUTION_API_KEY no .env.local (ou faça login para usar a Edge).',
      );
      setPhase('error');
      return;
    }

    setPhase('loading_qr');
    setEvoState('a gerar qr…');

    try {
      const live = await fetchLive();
      setEvoState(live.state);

      if (live.connected) {
        await applyLiveState(live);
        return;
      }

      const { qrDataUrl: qr, alreadyOpen } = await requestQr();
      if (alreadyOpen) {
        await applyLiveState(await fetchLive());
        return;
      }
      if (!qr) {
        throw new Error(
          `Evolution não devolveu QR para «${instanceName}». Confira a instância no manager ou use VITE_EVOLUTION_INSTANCE=zaptro.`,
        );
      }

      setQrDataUrl(qr);
      setPhase('scan_qr');
      setError(null);
      const cid = (await ensureCompany()) || waLinkDefaultCompanyId();
      if (cid) void activateInboxOnce(cid, instanceName);
      startPoll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase('disconnected');
      setEvoState('erro');
      stopPoll();
    }
  }, [applyLiveState, fetchLive, requestQr, startPoll, stopPoll, useEdgeApi, instanceName]);

  const refreshOrGenerate = useCallback(async () => {
    if (phase === 'boot' || phase === 'disconnected' || phase === 'error' || !qrDataUrl) {
      await startLink();
      return;
    }
    await refreshStatus();
  }, [phase, qrDataUrl, refreshStatus, startLink]);

  const disconnect = useCallback(async () => {
    setError(null);
    stopPoll();
    inboxActivatedRef.current = false;
    clearWaLinkSession();
    setQrDataUrl(null);
    setPhone(null);
    setPhase('disconnected');
    setEvoState('a desligar…');
    try {
      if (useEdgeApi) {
        try {
          await disconnectEvolution(instanceName);
        } catch (e) {
          if (!waLinkEdgeUnavailableError(e)) throw e;
          await logoutEvolutionInstance(instanceName);
        }
      } else {
        await logoutEvolutionInstance(instanceName);
      }
      setEvoState('disconnected');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEvoState('disconnected');
    }
  }, [instanceName, stopPoll, useEdgeApi]);

  useEffect(() => {
    if (!authReady || bootStartedRef.current) return;
    bootStartedRef.current = true;

    let cancelled = false;

    (async () => {
      const saved = readWaLinkSession();
      if (hasJwt) await ensureCompany();

      try {
        const live = await fetchLive();
        if (cancelled) return;
        if (live.connected) {
          await applyLiveState(live);
        } else {
          if (saved.connectedAt) clearWaLinkSession();
          settleDisconnected(live.state);
        }
      } catch (e) {
        if (!cancelled) {
          clearWaLinkSession();
          setError(e instanceof Error ? e.message : String(e));
          settleDisconnected('erro');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, applyLiveState, ensureCompany, fetchLive, hasJwt, instanceName, settleDisconnected]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  return {
    phase,
    qrDataUrl,
    phone,
    evoState,
    error,
    instanceName,
    companyId,
    edgeEnabled: preferEdge,
    edgeDegraded,
    useLocalProxy,
    guestMode: !hasJwt,
    authReady,
    startLink,
    refreshStatus,
    refreshOrGenerate,
    disconnect,
    isBooting: !authReady || phase === 'boot',
  };
}
