import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { buildZaptroInstanceName } from '../services/evolution';
import {
  activateWhatsappInbox,
  connectWhatsapp,
  disconnect as disconnectEvolutionInstance,
  getConnectionState,
  loadWhatsappConnection,
  shouldUseEvolutionEdge,
  subscribeWhatsappConnection,
} from '../services/evolution.service';
import {
  createEvolutionInstance,
  fetchEvolutionQrCode,
  getEvolutionConnectionState,
  logoutEvolutionInstance,
} from '../services/evolution';
import {
  resolveCompanyIdForWhatsapp,
  resolveZaptroActorId,
  resolveZaptroCompanyId,
} from '../utils/zaptroSession';
import {
  logWaFlow,
  logWaFlowError,
  updateWaFlowSnapshot,
} from '../lib/whatsappFlowDiagnostic';

export type WhatsappConnectStatus =
  | 'desconectado'
  | 'aguardando_qr'
  | 'qr_escaneado'
  | 'conectado';

function isPairingState(state: string): boolean {
  const s = state.trim().toLowerCase();
  return ['connecting', 'pairing', 'loading', 'syncing'].includes(s);
}

export type UseWhatsappConnectOptions = {
  autoStart?: boolean;
  onConnected?: () => void;
  /** Empresa explícita (ex.: pós-registo em /registre). */
  fixedCompanyId?: string | null;
  /** Permite QR via Evolution directo (proxy) sem JWT — útil no onboarding antes do login. */
  allowDirectEvolution?: boolean;
};

export function useWhatsappConnect(options: UseWhatsappConnectOptions = {}) {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { company } = useTenant();
  const preferEdge = shouldUseEvolutionEdge();

  const actorId = useMemo(() => resolveZaptroActorId(user, profile), [user, profile]);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);
  const [companyResolving, setCompanyResolving] = useState(
    () => !resolveZaptroCompanyId(profile, company),
  );

  const [hasSupabaseJwt, setHasSupabaseJwt] = useState(false);

  useEffect(() => {
    void supabaseZaptro.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      setHasSupabaseJwt(Boolean(id && id !== 'hub-dev-local-user'));
    });
    const { data: sub } = supabaseZaptro.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id;
      setHasSupabaseJwt(Boolean(id && id !== 'hub-dev-local-user'));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const companyId = useMemo(
    () =>
      options.fixedCompanyId?.trim() ||
      resolveZaptroCompanyId(profile, company) ||
      resolvedCompanyId,
    [profile, company, resolvedCompanyId, options.fixedCompanyId],
  );

  const directEvolutionMode = Boolean(options.allowDirectEvolution && !hasSupabaseJwt);

  const instanceName = useMemo(() => {
    if (directEvolutionMode) {
      return buildZaptroInstanceName('register-flow', companyId);
    }
    return actorId ? buildZaptroInstanceName(actorId, companyId) : null;
  }, [actorId, companyId, directEvolutionMode]);

  const role = profile?.role?.toUpperCase() ?? '';
  const isAdmin =
    role === 'MASTER' ||
    role === 'MASTER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'COMPANY_ADMIN' ||
    role === 'OWNER';

  const canGenerateQr = Boolean(
    instanceName &&
      !authLoading &&
      (directEvolutionMode || (Boolean(actorId) && isAdmin)),
  );
  const sessionReady = canGenerateQr;
  const companyPending = Boolean(actorId && !companyId && companyResolving);

  const [persistedInstance, setPersistedInstance] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsappConnectStatus>('desconectado');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartedRef = useRef(false);
  const celebratedRef = useRef(false);
  const pairingSessionRef = useRef(false);
  const hadQrShownRef = useRef(false);
  const statusRef = useRef<WhatsappConnectStatus>('desconectado');
  const activeInstanceRef = useRef<string | null>(null);
  const activeCompanyRef = useRef<string | null>(null);
  const activeUserRef = useRef<string | null>(null);

  useEffect(() => {
    statusRef.current = status;
    updateWaFlowSnapshot({ status });
  }, [status]);

  useEffect(() => {
    updateWaFlowSnapshot({ instance: instanceName, companyId: companyId ?? null });
  }, [instanceName, companyId]);

  const stopStatusPoll = useCallback(() => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  }, []);

  const syncLegacyCompanyInstance = useCallback(
    async (
      legacyCompanyId: string,
      legacyInstanceName: string,
      newStatus: 'connecting' | 'connected' | 'disconnected',
    ) => {
      await supabaseZaptro
        .from('whatsapp_instances')
        .upsert({
          company_id: legacyCompanyId,
          instance_id: legacyInstanceName,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .select();
      if (newStatus === 'connected') {
        logWaFlow('SESSION_PERSISTED', { companyId: legacyCompanyId, instance: legacyInstanceName, table: 'whatsapp_instances' });
      }
    },
    [],
  );

  type MarkConnectedOptions = {
    /** Sessão já ligada (reload / instância aberta no manager) — nunca toast */
    fromRestore?: boolean;
    /** Forçar ou bloquear toast de sucesso */
    celebrate?: boolean;
  };

  const markConnected = useCallback(
    async (opts: MarkConnectedOptions = {}) => {
      const prev = statusRef.current;
      const inst = activeInstanceRef.current;
      const cid = activeCompanyRef.current;

      let live = { connected: false, phone: null as string | null, state: 'unknown' };
      if (inst) {
        try {
          live = await getConnectionState(inst);
          updateWaFlowSnapshot({
            connection: {
              connected: live.connected,
              phone: live.phone,
              state: live.state,
            },
          });
          if (live.connected) {
            logWaFlow('EVOLUTION_CONNECTED', {
              instance: inst,
              phone: live.phone,
              state: live.state,
              fromRestore: opts.fromRestore ?? false,
            });
          }
        } catch (e) {
          logWaFlowError(e instanceof Error ? e.message : String(e), { step: 'markConnected', instance: inst });
        }
      }

      const inActiveQrFlow =
        pairingSessionRef.current && (prev === 'aguardando_qr' || prev === 'qr_escaneado');

      // QR lido — Evolution GO reporta «pairing» até confirmar no telemóvel
      if (inActiveQrFlow && !opts.fromRestore && isPairingState(live.state)) {
        setStatus('qr_escaneado');
        setQrCode(null);
        hadQrShownRef.current = true;
        setLoading(false);
        logWaFlow('QR_SCANNED', { instance: inst, state: live.state, source: 'markConnected/pairing' });
        return;
      }

      // QR lido mas ainda sem confirmação no telemóvel — mantém ecrã «escaneado»
      if (inActiveQrFlow && !opts.fromRestore && live.connected && !live.phone) {
        setStatus('qr_escaneado');
        setQrCode(null);
        setLoading(false);
        logWaFlow('QR_SCANNED', { instance: inst, state: live.state, source: 'markConnected/no-phone' });
        return;
      }

      if (!opts.fromRestore && !live.connected) return;

      setStatus('conectado');
      logWaFlow('CONNECTION_STATE_UPDATED', { status: 'conectado', prev, fromRestore: opts.fromRestore ?? false });
      logWaFlow('QR_CONNECTED', { instance: inst, phone: live.phone, fromRestore: opts.fromRestore ?? false });
      setConnectedAt(new Date().toISOString());
      setLoading(false);
      setError(null);
      setQrCode(null);
      if (live.phone) setConnectedPhone(live.phone);

      if (inst && cid) {
        await syncLegacyCompanyInstance(cid, inst, 'connected');
        // Sempre regista webhook na Edge (mesmo com VITE_EVOLUTION_USE_EDGE=false no QR).
        try {
          await activateWhatsappInbox(cid, inst);
          logWaFlow('SESSION_PERSISTED', { step: 'activateWhatsappInbox/markConnected', instance: inst });
        } catch (e) {
          logWaFlowError(e instanceof Error ? e.message : String(e), { step: 'activateWhatsappInbox', instance: inst });
          console.warn('[useWhatsappConnect] activateWhatsappInbox:', e);
        }
      }

      stopStatusPoll();

      const shouldCelebrate =
        opts.celebrate === true ||
        (opts.celebrate !== false &&
          !opts.fromRestore &&
          pairingSessionRef.current &&
          !celebratedRef.current &&
          live.connected &&
          Boolean(live.phone) &&
          prev === 'qr_escaneado');

      if (shouldCelebrate) {
        celebratedRef.current = true;
        options.onConnected?.();
      }

      if (inActiveQrFlow) {
        pairingSessionRef.current = false;
        hadQrShownRef.current = false;
      }
    },
    [stopStatusPoll, syncLegacyCompanyInstance, options.onConnected],
  );

  const startStatusPoll = useCallback(
    (pollInstance: string, _useEdge: boolean) => {
      stopStatusPoll();
      let attempts = 0;
      statusPollRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 120) {
          stopStatusPoll();
          setLoading(false);
          setError('Tempo limite. Toque em «Gerar código QR» para tentar de novo.');
          setStatus('desconectado');
          return;
        }
        try {
          const live = await getConnectionState(pollInstance);
          updateWaFlowSnapshot({
            connection: {
              connected: live.connected,
              phone: live.phone,
              state: live.state,
            },
          });
          if (live.connected) {
            logWaFlow('EVOLUTION_CONNECTED', {
              instance: pollInstance,
              phone: live.phone,
              state: live.state,
              source: 'poll',
              uiStatus: statusRef.current,
            });
          }
          if (live.connected) {
            if (
              !live.phone &&
              (statusRef.current === 'aguardando_qr' || statusRef.current === 'qr_escaneado')
            ) {
              setStatus('qr_escaneado');
              setQrCode(null);
              setLoading(false);
              logWaFlow('QR_SCANNED', { instance: pollInstance, source: 'poll/no-phone' });
            } else {
              await markConnected();
            }
          } else if (isPairingState(live.state)) {
            setStatus('qr_escaneado');
            setQrCode(null);
            hadQrShownRef.current = true;
            setLoading(false);
            logWaFlow('QR_SCANNED', { instance: pollInstance, state: live.state, source: 'poll/pairing' });
          }
        } catch (e) {
          logWaFlowError(e instanceof Error ? e.message : String(e), { step: 'statusPoll', instance: pollInstance });
        }
      }, 3000);
    },
    [markConnected, stopStatusPoll],
  );
  useEffect(() => {
    if (!companyId) return;
    supabaseZaptro
      .from('whatsapp_instances')
      .select('instance_id')
      .eq('company_id', companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.instance_id) setPersistedInstance(data.instance_id);
      });
  }, [companyId]);

  useEffect(() => {
    if (companyId || options.fixedCompanyId) {
      setCompanyResolving(false);
      return;
    }
    let cancelled = false;
    if (authLoading) return () => {
      cancelled = true;
    };
    (async () => {
      const cid = await resolveCompanyIdForWhatsapp(user, profile, company, refreshProfile);
      if (!cancelled) {
        setResolvedCompanyId(cid);
        setCompanyResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, profile, company, refreshProfile, companyId]);

  useEffect(() => {
    if (!companyResolving) return;
    const t = window.setTimeout(() => setCompanyResolving(false), 4000);
    return () => window.clearTimeout(t);
  }, [companyResolving]);

  const loadSavedState = useCallback(async () => {
    if (!actorId || !instanceName) return;

    activeInstanceRef.current = instanceName;
    activeCompanyRef.current = companyId ?? actorId;
    activeUserRef.current = actorId;

    const useEdge = preferEdge && actorId !== 'hub-dev-local-user';
    if (useEdge) {
      try {
        const live = await getConnectionState(instanceName);
        updateWaFlowSnapshot({
          connection: { connected: live.connected, phone: live.phone, state: live.state },
        });
        if (live.connected) {
          logWaFlow('EVOLUTION_CONNECTED', { instance: instanceName, source: 'loadSavedState' });
          await markConnected({ fromRestore: true, celebrate: false });
          return;
        }
      } catch (e) {
        logWaFlowError(e instanceof Error ? e.message : String(e), { step: 'loadSavedState/edge' });
      }
    }

    if (preferEdge && actorId !== 'hub-dev-local-user') {
      const row = await loadWhatsappConnection(actorId, instanceName);
      if (row?.connected) {
        setStatus('conectado');
        logWaFlow('CONNECTION_STATE_UPDATED', { status: 'conectado', source: 'whatsapp_connections row' });
        logWaFlow('SESSION_PERSISTED', { table: 'whatsapp_connections', phone: row.phone });
        setConnectedAt(row.updated_at ?? null);
        setQrCode(null);
        if (row.phone) setConnectedPhone(row.phone);
        return;
      }
    }

    if (!companyId) return;
    const { data } = await supabaseZaptro
      .from('whatsapp_instances')
      .select('status, updated_at')
      .eq('company_id', companyId)
      .maybeSingle();

    if (data?.status === 'connected') {
      let open = true;
      try {
        if (preferEdge && actorId !== 'hub-dev-local-user') {
          const r = await getConnectionState(instanceName);
          open = r.connected;
          if (r.phone) setConnectedPhone(r.phone);
        } else {
          const state = await getEvolutionConnectionState(instanceName);
          open = state === 'open';
        }
      } catch {
        open = true;
      }
      if (open) {
        setStatus('conectado');
        logWaFlow('CONNECTION_STATE_UPDATED', { status: 'conectado', source: 'whatsapp_instances row' });
        logWaFlow('SESSION_PERSISTED', { table: 'whatsapp_instances' });
        setConnectedAt(data.updated_at ?? null);
        setQrCode(null);
        return;
      }
    }
    setStatus('desconectado');
    logWaFlow('CONNECTION_STATE_UPDATED', { status: 'desconectado', source: 'loadSavedState/none' });
  }, [actorId, companyId, instanceName, preferEdge, markConnected]);



  const ensureSession = useCallback(async (): Promise<{
    actorId: string;
    companyId: string;
    instanceName: string;
    useEdge: boolean;
  } | null> => {
    if (authLoading) {
      setError('A carregar o seu perfil…');
      return null;
    }

    let cid = companyId || (await resolveCompanyIdForWhatsapp(user, profile, company, refreshProfile));

    const { data: authData } = await supabaseZaptro.auth.getSession();
    const supabaseUserId = authData.session?.user?.id?.trim() || null;
    const aid = supabaseUserId || resolveZaptroActorId(user, profile);
    if (cid && !resolvedCompanyId) setResolvedCompanyId(cid);

    if (!aid) {
      setError('Sessão inválida. Saia e entre de novo em /login.');
      return null;
    }

    if (!cid) {
      cid = aid;
    }

    const hasRealJwt = Boolean(supabaseUserId && supabaseUserId !== 'hub-dev-local-user');
    const useDirect = Boolean(options.allowDirectEvolution && !hasRealJwt);
    const useEdge =
      !useDirect &&
      preferEdge &&
      hasRealJwt &&
      import.meta.env.VITE_EVOLUTION_USE_EDGE !== 'false';

    const iid = useDirect
      ? buildZaptroInstanceName('register-flow', cid)
      : buildZaptroInstanceName(aid, cid);

    return {
      actorId: useDirect ? 'register-flow' : aid,
      companyId: cid,
      instanceName: iid,
      useEdge,
    };
  }, [authLoading, profile, company, user, refreshProfile, preferEdge, companyId, resolvedCompanyId]);

  const generateQrCode = useCallback(async () => {
    setError(null);
    const session = await ensureSession();
    if (!session) return;

    const { instanceName: activeInstance, companyId: activeCompany, useEdge, actorId: aid } =
      session;
    activeInstanceRef.current = activeInstance;
    activeCompanyRef.current = activeCompany;
    activeUserRef.current = aid;

    if (activeCompany && useEdge) {
      void activateWhatsappInbox(activeCompany, activeInstance).catch(() => {
        /* webhook pode falhar antes do QR; tenta de novo em markConnected */
      });
    }

    setLoading(true);
    setQrCode(null);
    setStatus('aguardando_qr');
    celebratedRef.current = false;
    pairingSessionRef.current = true;
    hadQrShownRef.current = false;
    stopStatusPoll();

    try {
      await supabaseZaptro.auth.refreshSession();

      let qr: string | null = null;

      if (useEdge) {
        const linked = await connectWhatsapp(activeInstance);
        if (!linked.qrDataUrl && linked.status === 'open') {
          pairingSessionRef.current = false;
          hadQrShownRef.current = false;
          await markConnected({ fromRestore: true, celebrate: false });
          return;
        }
        qr = linked.qrDataUrl;

        if (!qr) {
          const again = await getConnectionState(activeInstance);
          if (again.connected) {
            pairingSessionRef.current = false;
            hadQrShownRef.current = false;
            await markConnected({ fromRestore: true, celebrate: false });
            return;
          }
          throw new Error(
            'Sem QR: a instância «zaptro» pode já estar ligada no manager Evolution. Desligue lá ou aguarde — se já está «Conectado», a ligação está feita.',
          );
        }
      } else {
        // Proativamente verifica se já está conectado na VPS antes de tentar criar
        const state = await getEvolutionConnectionState(activeInstance).catch(() => 'close');
        if (state === 'open') {
          pairingSessionRef.current = false;
          hadQrShownRef.current = false;
          await markConnected({ fromRestore: true, celebrate: false });
          return;
        }

        // Permitimos login local em ambiente de desenvolvimento sem JWT real do Supabase
        const { qrFromCreate } = await createEvolutionInstance(activeInstance);
        qr = qrFromCreate || (await fetchEvolutionQrCode(activeInstance));
        
        if (qr === 'ALREADY_LOGGED_IN') {
          pairingSessionRef.current = false;
          hadQrShownRef.current = false;
          await markConnected({ fromRestore: true, celebrate: false });
          return;
        }
        
        if (!qr) {
          throw new Error(
            'Evolution GO não devolveu QR. Confira VITE_EVOLUTION_INSTANCE_API_KEY no .env.local ou Secrets do Supabase.',
          );
        }
      }

      setQrCode(qr);
      hadQrShownRef.current = true;
      setLoading(false);
      logWaFlow('QR_RENDERED', { instance: activeInstance, useEdge });
      if (activeCompany && activeCompany !== aid) {
        await syncLegacyCompanyInstance(activeCompany, activeInstance, 'connecting');
      }
      startStatusPoll(activeInstance, useEdge);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logWaFlowError(msg, { step: 'generateQrCode' });
      setError(msg);
      setLoading(false);
      setStatus('desconectado');
      stopStatusPoll();
    }
  }, [ensureSession, startStatusPoll, stopStatusPoll, syncLegacyCompanyInstance, markConnected]);

  const disconnectWhatsapp = useCallback(async () => {
    const iid = activeInstanceRef.current || instanceName;
    if (!iid) return;
    setLoading(true);
    try {
      const useEdge = preferEdge && activeUserRef.current !== 'hub-dev-local-user';
      if (useEdge) {
        await disconnectEvolutionInstance(iid);
      } else {
        await logoutEvolutionInstance(iid);
      }
      if (activeCompanyRef.current || companyId) {
        await syncLegacyCompanyInstance(
          activeCompanyRef.current || companyId!,
          iid,
          'disconnected',
        );
      }
      setStatus('desconectado');
      setQrCode(null);
      setConnectedAt(null);
      setConnectedPhone(null);
      celebratedRef.current = false;
      pairingSessionRef.current = false;
      hadQrShownRef.current = false;
      logWaFlow('CONNECTION_STATE_UPDATED', { status: 'desconectado', source: 'disconnect' });
    } catch (e: unknown) {
      logWaFlowError(e instanceof Error ? e.message : String(e), { step: 'disconnect' });
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      stopStatusPoll();
    }
  }, [companyId, instanceName, preferEdge, stopStatusPoll, syncLegacyCompanyInstance]);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    void loadSavedState().finally(() => {
      if (!cancelled) setInitialCheckDone(true);
    });
    return () => {
      cancelled = true;
      stopStatusPoll();
    };
  }, [sessionReady, loadSavedState, stopStatusPoll]);

  useEffect(() => {
    if (!options.autoStart || !initialCheckDone || autoStartedRef.current) return;
    if (statusRef.current === 'conectado') return;
    autoStartedRef.current = true;
    void generateQrCode();
  }, [options.autoStart, initialCheckDone, generateQrCode]);

  useEffect(() => {
    if (!actorId || !instanceName || !preferEdge || actorId === 'hub-dev-local-user') return;
    return subscribeWhatsappConnection(actorId, instanceName, (row) => {
      if (!row) return;
      logWaFlow('CONNECTION_STATE_UPDATED', {
        source: 'realtime/whatsapp_connections',
        connected: row.connected,
        status: row.status,
      });
      if (row.connected) {
        void markConnected(
          pairingSessionRef.current
            ? { fromRestore: false, celebrate: undefined }
            : { fromRestore: true, celebrate: false },
        );
        return;
      }
      const st = String(row.status ?? '').toLowerCase();
      if (st === 'connecting' || st === 'pairing' || st === 'loading') {
        setStatus('qr_escaneado');
        setQrCode(null);
        hadQrShownRef.current = true;
        setLoading(false);
        logWaFlow('QR_SCANNED', { source: 'realtime/whatsapp_connections', status: st });
      }
    });
  }, [actorId, instanceName, preferEdge, markConnected]);

  return {
    persistedInstance,
    userId: actorId,
    companyId,
    instanceName,
    status,
    qrCode,
    loading: loading || authLoading,
    error,
    connectedAt,
    connectedPhone,
    sessionReady,
    initialCheckDone,
    canGenerateQr,
    companyPending,
    usesEdge: preferEdge && hasSupabaseJwt,
    devLocalLoginActive: Boolean(
      typeof window !== 'undefined' && localStorage.getItem('hub-dev-session') && !hasSupabaseJwt,
    ),
    isConnected: status === 'conectado',
    isQrScanned: status === 'qr_escaneado',
    isAwaitingQr: status === 'aguardando_qr' || status === 'qr_escaneado',
    isAwaitingQrOnly: status === 'aguardando_qr',
    generateQrCode,
    disconnect: disconnectWhatsapp,
    refreshStatus: loadSavedState,

  };
}
