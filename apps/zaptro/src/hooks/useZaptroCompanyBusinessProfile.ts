import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import {
  companyRowToBusinessProfile,
  writeZaptroCompanyBusinessProfile,
  type ZaptroCompanyBusinessProfile,
} from '../lib/zaptroCompanyBusinessProfile';
import {
  readWaNotifDesktopDesired,
  readWaNotifSoundEnabled,
  setWaNotifDesktopDesired,
  setWaNotifSoundEnabled,
} from '../lib/zaptroWaMessageNotifications';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { syncCompanyBusinessProfileToWhatsapp } from '../lib/zaptroSyncCompanyBusinessToWa';
import { resolveConnectedWhatsappPhone } from '../lib/zaptroConnectedWhatsappPhone';
import { importWhatsappProfileToCompany } from '../lib/zaptroImportWhatsappProfile';
import { isZaptroLocalhost } from '../lib/appOrigin';
import { formatWaPhoneLine } from '../modules/wa-link/waLinkConfig';

export const ZAPTRO_COMPANY_PROFILE_EVENT = 'zaptro:company-profile-updated';

export const SEGMENT_OPTIONS = [
  'Transporte',
  'Logística',
  'E-commerce',
  'Indústria',
  'Serviços',
  'TRANSPORTE_GERAL',
] as const;

const defaultForm = (): ZaptroCompanyBusinessProfile => ({
  name: '',
  segment: 'Transporte',
  description: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  openingHours: '',
  logoUrl: null,
});

type Options = {
  /** Carrega telefone WA, importa perfil e polling enquanto activo */
  syncActive?: boolean;
};

export function useZaptroCompanyBusinessProfile(options: Options = {}) {
  const { syncActive = true } = options;
  const { profile, refreshProfile } = useAuth();
  const { company, setCompany } = useTenant();

  const [logoBusy, setLogoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [companyForm, setCompanyForm] = useState(defaultForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoCacheBust, setLogoCacheBust] = useState(0);
  const logoPreviewRef = useRef<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState({ sound: true, visual: true });
  const [connectedWaPhone, setConnectedWaPhone] = useState<string | null>(null);
  const [waPhoneLoading, setWaPhoneLoading] = useState(false);
  const [waProfileSyncing, setWaProfileSyncing] = useState(false);
  const waImportBusyRef = useRef(false);

  const reloadFormFromCompany = useCallback(() => {
    if (!company) return;
    if (logoPreviewRef.current || logoBusy) return;
    const row = company as Record<string, unknown>;
    const bp = companyRowToBusinessProfile(row);
    setCompanyForm({
      ...bp,
      phone: connectedWaPhone || bp.phone,
      logoUrl:
        bp.logoUrl ||
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('zaptro_company_logo_url')?.trim() || null
          : null),
    });
  }, [company, logoBusy, connectedWaPhone]);

  useEffect(() => {
    reloadFormFromCompany();
  }, [reloadFormFromCompany]);

  useEffect(() => {
    const onUpdated = () => reloadFormFromCompany();
    window.addEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onUpdated);
    return () => window.removeEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onUpdated);
  }, [reloadFormFromCompany]);

  useEffect(() => {
    if (!syncActive) return;
    let cancelled = false;
    const loadWaPhone = async () => {
      setWaPhoneLoading(true);
      try {
        const p = await resolveConnectedWhatsappPhone({
          userId: profile?.id,
          companyId: company?.id,
        });
        if (cancelled) return;
        setConnectedWaPhone(p);
        if (p) setCompanyForm((prev) => ({ ...prev, phone: p }));
      } finally {
        if (!cancelled) setWaPhoneLoading(false);
      }
    };
    void loadWaPhone();
    const onFocus = () => void loadWaPhone();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [syncActive, profile?.id, company?.id]);

  const runWhatsappProfileImport = useCallback(
    async (silent = true) => {
      const cid = company?.id || profile?.company_id;
      if (!cid || waImportBusyRef.current) return;
      waImportBusyRef.current = true;
      setWaProfileSyncing(true);
      try {
        const result = await importWhatsappProfileToCompany({
          companyId: cid,
          userId: profile?.id,
          setCompany,
          silent,
        });
        if (result.imported) {
          setLogoCacheBust((n) => n + 1);
          window.dispatchEvent(new Event(ZAPTRO_COMPANY_PROFILE_EVENT));
          if (!silent) {
            notifyZaptro('success', 'Perfil sincronizado', result.messages[0] || 'Dados do WhatsApp actualizados.');
          }
        } else if (!silent && result.messages.length) {
          notifyZaptro('warning', 'Sincronização', result.messages.join(' '));
        }
      } finally {
        waImportBusyRef.current = false;
        setWaProfileSyncing(false);
      }
    },
    [company?.id, profile?.company_id, profile?.id, setCompany],
  );

  useEffect(() => {
    const cid = company?.id || profile?.company_id;
    if (!syncActive || !cid) return;
    void runWhatsappProfileImport(true);
    const pollId = window.setInterval(() => void runWhatsappProfileImport(true), 12000);
    const onWaEvent = () => void runWhatsappProfileImport(true);
    window.addEventListener('zaptro:wa-profile-synced', onWaEvent);
    window.addEventListener('zaptro:wa-connected', onWaEvent);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener('zaptro:wa-profile-synced', onWaEvent);
      window.removeEventListener('zaptro:wa-connected', onWaEvent);
    };
  }, [syncActive, company?.id, profile?.company_id, runWhatsappProfileImport]);

  useEffect(() => {
    return () => {
      if (logoPreviewRef.current) {
        URL.revokeObjectURL(logoPreviewRef.current);
        logoPreviewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setNotifPrefs({
        sound: profile.wa_notify_sound ?? readWaNotifSoundEnabled(),
        visual: profile.wa_notify_visual ?? readWaNotifDesktopDesired(),
      });
    }
  }, [profile]);

  const companyInitial = companyForm.name?.[0]?.toUpperCase() || 'E';

  const displayLogoSrc = useMemo(() => {
    if (logoPreview) return logoPreview;
    const url = companyForm.logoUrl?.trim();
    if (!url) return null;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${logoCacheBust}`;
  }, [logoPreview, companyForm.logoUrl, logoCacheBust]);

  const clearLogoPreview = useCallback(() => {
    if (logoPreviewRef.current) {
      URL.revokeObjectURL(logoPreviewRef.current);
      logoPreviewRef.current = null;
    }
    setLogoPreview(null);
  }, []);

  const setLogoPreviewFromFile = useCallback(
    (file: File) => {
      clearLogoPreview();
      const blob = URL.createObjectURL(file);
      logoPreviewRef.current = blob;
      setLogoPreview(blob);
    },
    [clearLogoPreview],
  );

  const syncPublicProfileCache = useCallback((form: ZaptroCompanyBusinessProfile) => {
    writeZaptroCompanyBusinessProfile(form);
    if (form.logoUrl) {
      try {
        localStorage.setItem('zaptro_company_logo_url', form.logoUrl);
      } catch {
        /* ignore */
      }
    }
    window.dispatchEvent(new Event(ZAPTRO_COMPANY_PROFILE_EVENT));
  }, []);

  const uploadLogo = useCallback(
    async (file: File) => {
      if (!company?.id || !profile?.id) return;
      setLogoBusy(true);
      try {
        const up = await uploadFile({
          file,
          companyId: company.id,
          category: 'branding',
          userId: profile.id,
          entityType: 'zaptro',
        });
        const pub = supabase.storage.from('hub-drive').getPublicUrl(up.path);
        const url = pub?.data?.publicUrl || '';
        if (!url) return;

        const { data, error } = await supabase
          .from('companies')
          .update({ logo_url: url })
          .eq('id', company.id)
          .select()
          .single();
        if (!error && data && setCompany) setCompany(data as typeof company);
        clearLogoPreview();
        setLogoCacheBust(Date.now());
        let nextForWa!: ZaptroCompanyBusinessProfile;
        setCompanyForm((prev) => {
          nextForWa = { ...prev, logoUrl: url };
          syncPublicProfileCache(nextForWa);
          return nextForWa;
        });
        if (company?.id) {
          const wa = await syncCompanyBusinessProfileToWhatsapp(company.id, profile?.id, nextForWa);
          if (wa.synced) {
            notifyZaptro('success', 'Foto atualizada', wa.messages.join(' · ') || 'Logo e WhatsApp atualizados.');
          } else {
            notifyZaptro('success', 'Foto salva no Zaptro', wa.messages[0] || 'Logo guardada localmente.');
          }
        } else {
          notifyZaptro('success', 'Foto atualizada', 'Logo da empresa salva.');
        }
      } catch {
        clearLogoPreview();
        notifyZaptro('error', 'Erro', 'Não foi possível enviar a imagem.');
      } finally {
        setLogoBusy(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [company, profile?.id, setCompany, clearLogoPreview, syncPublicProfileCache],
  );

  const saveCompanyProfile = useCallback(async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const prevSettings =
        (company as { settings?: Record<string, unknown> }).settings &&
        typeof (company as { settings?: Record<string, unknown> }).settings === 'object'
          ? { ...(company as { settings: Record<string, unknown> }).settings }
          : {};

      const payload: Record<string, unknown> = {
        name: companyForm.name.trim(),
        phone: (connectedWaPhone || companyForm.phone).trim(),
        email: companyForm.email.trim(),
        address: companyForm.address.trim(),
        segment: companyForm.segment,
        category: companyForm.segment,
        description: companyForm.description.trim(),
        website: companyForm.website.trim() || null,
        opening_hours: companyForm.openingHours.trim() || null,
        settings: {
          ...prevSettings,
          business_city: companyForm.city.trim(),
          business_state: companyForm.state.trim(),
        },
      };

      const { data, error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', company.id)
        .select()
        .single();

      if (error) throw error;
      if (data && setCompany) setCompany(data as typeof company);
      syncPublicProfileCache(companyForm);

      const wa = await syncCompanyBusinessProfileToWhatsapp(company.id, profile?.id, companyForm);
      const localHint = isZaptroLocalhost() ? ' (localhost → Evolution via /evolution-api)' : '';
      if (wa.synced) {
        notifyZaptro('success', 'Salvo e sincronizado', `${wa.messages.join(' · ')}${localHint}`);
      } else {
        notifyZaptro('success', 'Salvo no Zaptro', `${wa.messages[0] || 'Dados guardados.'}${localHint}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      notifyZaptro('error', 'Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [company, companyForm, connectedWaPhone, profile?.id, setCompany, syncPublicProfileCache]);

  const saveNotifications = useCallback(async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabaseZaptro
        .from('profiles')
        .update({
          wa_notify_sound: notifPrefs.sound,
          wa_notify_visual: notifPrefs.visual,
        })
        .eq('id', profile.id);
      if (error) throw error;
      setWaNotifSoundEnabled(notifPrefs.sound);
      setWaNotifDesktopDesired(notifPrefs.visual);
      await refreshProfile();
      notifyZaptro('success', 'Salvo', 'Preferências de notificação atualizadas.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      notifyZaptro('error', 'Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [notifPrefs, profile?.id, refreshProfile]);

  const displayWaPhone = connectedWaPhone || companyForm.phone.trim() || '';
  const displayWaPhoneFormatted = displayWaPhone
    ? formatWaPhoneLine(displayWaPhone)
    : waPhoneLoading
      ? 'A carregar…'
      : 'Ligue o WhatsApp em Configurações';

  const copyPhone = useCallback(() => {
    if (!displayWaPhone) return;
    void navigator.clipboard?.writeText(formatWaPhoneLine(displayWaPhone));
    notifyZaptro('success', 'Copiado', 'Telefone copiado.');
  }, [displayWaPhone]);

  const waAccountLabel =
    companyForm.accountType === 'business'
      ? 'WhatsApp Business'
      : companyForm.accountType === 'personal'
        ? 'WhatsApp'
        : 'WhatsApp';

  return {
    company,
    companyForm,
    setCompanyForm,
    companyInitial,
    displayLogoSrc,
    displayName: companyForm.name || 'Perfil da empresa',
    waAccountLabel,
    waProfileSyncing,
    logoBusy,
    saving,
    fileRef,
    notifPrefs,
    setNotifPrefs,
    uploadLogo,
    setLogoPreviewFromFile,
    saveCompanyProfile,
    saveNotifications,
    displayWaPhone,
    displayWaPhoneFormatted,
    copyPhone,
    runWhatsappProfileImport,
  };
}
