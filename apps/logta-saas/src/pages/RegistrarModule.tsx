import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Palette,
  Phone,
  Shield,
  Sparkles,
  User,
  Wand2,
  Zap,
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import {
  addDaysIso,
  saveOnboardingProfile,
  TRIAL_DAYS,
  type OnboardingModuleId,
  type OnboardingProfile,
  type OnboardingTeamSize,
} from '../lib/onboardingStorage';
import { saveLogtaEntitlementsToStorage } from '../lib/logtaEntitlementsClient';
import { defaultTrialEntitlements } from '@shared/lib/logtaEntitlementsContract';
import { LOGTA_SESSION_BOOT_FLAG } from '../components/SessionBootLoader';
import { setRegistrarPlanChoice } from '../lib/headerBrandingGate';
import { applyModuleActivationFromOnboarding } from '../lib/logtaModuleActivation';
import { supabase } from '../lib/supabase';

const MODULE_OPTIONS: { id: OnboardingModuleId; label: string; hint: string }[] = [
  { id: 'financeiro', label: 'Financeiro', hint: 'Contas e fluxo de caixa' },
  { id: 'crm', label: 'CRM', hint: 'Clientes e pipeline' },
  { id: 'operacoes', label: 'Operações', hint: 'Fretes e entregas' },
  { id: 'frota', label: 'Frota', hint: 'Veículos e manutenção' },
  { id: 'rastreamento', label: 'Rastreamento', hint: 'Tempo real e alertas' },
  { id: 'oficina', label: 'Oficina', hint: 'Serviços e OS' },
  { id: 'hubchat', label: 'HubChat', hint: 'Equipe e mensagens' },
  { id: 'ia', label: 'IA & Automação', hint: 'Assistente e rotinas' },
  { id: 'logdock', label: 'LogDock Drive', hint: 'Arquivos e documentos' },
  { id: 'relatorios', label: 'Relatórios', hint: 'BI e exportações' },
];

const WORK_TYPES: { id: string; label: string; hint: string }[] = [
  { id: 'cargas', label: 'Cargas', hint: 'Transporte e movimentação de cargas' },
  { id: 'entregas', label: 'Entregas', hint: 'Última milha e distribuição urbana' },
  { id: 'logistica', label: 'Logística', hint: 'Planejamento e fluxo operacional' },
  { id: 'distribuicao', label: 'Distribuição', hint: 'Redes, CDs e rotas de abastecimento' },
  { id: 'oficina', label: 'Oficina', hint: 'Manutenção, peças e ordens de serviço' },
  { id: 'rastreamento', label: 'Rastreamento', hint: 'Tempo real, alertas e histórico' },
];

const CHALLENGES = [
  { id: 'organizacao', label: 'Organização' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'entregas', label: 'Entregas' },
  { id: 'automacao', label: 'Automação' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'operacao', label: 'Operação' },
];

const TEAM_SIZES: { id: OnboardingTeamSize; label: string }[] = [
  { id: '1-5', label: '1 a 5' },
  { id: '5-20', label: '5 a 20' },
  { id: '20-50', label: '20 a 50' },
  { id: '50+', label: '50+' },
];

function buildProcessingLines(moduleIds: OnboardingModuleId[], mainChallenge: string): string[] {
  const labels = MODULE_OPTIONS.filter((m) => moduleIds.includes(m.id)).map((m) => m.label);
  const head = ['Salvando cadastro…', 'Aplicando módulos…'];
  const ch = CHALLENGES.find((c) => c.id === mainChallenge);
  const focus = ch ? [`Priorizando seu desafio: ${ch.label}…`] : [];
  const mod = labels.map((l) => `${l}…`);
  const tail = ['Quase pronto…', 'Redirecionando…'];
  return [...head, ...focus, ...mod, ...tail];
}

const BR_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });

function ProcessingScreen({
  lines,
  onComplete,
}: {
  lines: string[];
  onComplete: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const cycle = Math.max(lines.length, 1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % cycle);
    }, 2000);
    return () => window.clearInterval(id);
  }, [cycle]);

  useEffect(() => {
    let raf = 0;
    let finished = false;
    const totalMs = Math.max(10_000, cycle * 2000);
    const start = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / totalMs) * 100);
      if (p >= 100) {
        if (!finished) {
          finished = true;
          onCompleteRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cycle]);

  const line = lines[lineIndex % cycle] ?? '…';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 90% 55% at 50% 45%, rgb(37,99,235), transparent 62%), radial-gradient(ellipse 70% 40% at 50% 100%, rgb(15,23,42), transparent 55%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-xl px-4 text-center sm:max-w-2xl">
        <p
          className="mx-auto bg-gradient-to-r from-white via-sky-300 to-blue-600 bg-clip-text text-3xl font-extrabold italic leading-tight tracking-tight text-transparent sm:text-4xl md:text-5xl"
          aria-live="polite"
        >
          {line}
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const labelClass = 'mb-1.5 block text-[11px] font-black uppercase tracking-wide text-gray-500';

export default function RegistrarModule() {
  const navigate = useNavigate();
  const { updateConfig } = useTenant();
  const [step, setStep] = useState(1);
  /** Trial: 7 etapas até módulos (dados → senha → equipe/frota → trabalha com → desafio → endereço opc. → módulos). Pago: + branding. */
  const [planChoice, setPlanChoice] = useState<'trial' | 'paid'>('trial');
  const includeBrandingStep = planChoice === 'paid';
  const maxStep = includeBrandingStep ? 8 : 7;
  const processingStep = includeBrandingStep ? 9 : 8;

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [teamSize, setTeamSize] = useState<OnboardingTeamSize | ''>('');
  const [vehiclesCount, setVehiclesCount] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [mainChallenge, setMainChallenge] = useState('');
  const [addressCep, setAddressCep] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');

  const [modules, setModules] = useState<OnboardingModuleId[]>(['operacoes', 'frota', 'financeiro']);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [companyPhotoDataUrl, setCompanyPhotoDataUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [notes, setNotes] = useState('');

  const [stepError, setStepError] = useState<string | null>(null);
  const processingCompleteRef = useRef(false);

  const toggleWork = (id: string) => {
    setWorkTypes((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const toggleModule = (id: OnboardingModuleId) => {
    setModules((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const validateStepIdentity = () => {
    if (!fullName.trim() || !companyName.trim() || !email.trim() || !phone.trim()) {
      return 'Preencha todos os campos obrigatórios.';
    }
    return null;
  };

  const validateStepCredentials = () => {
    if (!document.trim()) return 'Informe o CPF ou CNPJ.';
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (password !== password2) return 'As senhas não coincidem.';
    return null;
  };

  const validateTeamVehicles = () => {
    if (!teamSize) return 'Selecione o tamanho da equipe.';
    if (!vehiclesCount.trim()) return 'Informe a quantidade de veículos.';
    return null;
  };

  const validateWorkTypesOnly = () => {
    if (workTypes.length === 0) return 'Selecione ao menos uma opção em “Trabalha com”.';
    return null;
  };

  const validateChallengeOnly = () => {
    if (!mainChallenge) return 'Selecione o principal desafio.';
    return null;
  };

  const validateModules = () => {
    if (modules.length === 0) return 'Selecione ao menos um módulo.';
    return null;
  };

  const goNext = () => {
    setStepError(null);
    if (step === 1) {
      const e = validateStepIdentity();
      if (e) {
        setStepError(e);
        return;
      }
    }
    if (step === 2) {
      const e = validateStepCredentials();
      if (e) {
        setStepError(e);
        return;
      }
    }
    if (step === 3) {
      const e = validateTeamVehicles();
      if (e) {
        setStepError(e);
        return;
      }
    }
    if (step === 4) {
      const e = validateWorkTypesOnly();
      if (e) {
        setStepError(e);
        return;
      }
    }
    if (step === 5) {
      const e = validateChallengeOnly();
      if (e) {
        setStepError(e);
        return;
      }
    }
    if (step === 7) {
      const e = validateModules();
      if (e) {
        setStepError(e);
        return;
      }
    }
    setStep((s) => Math.min(maxStep, s + 1));
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  useEffect(() => {
    if (step !== processingStep && step > maxStep) setStep(maxStep);
  }, [maxStep, processingStep, step]);

  const finalize = async () => {
    setStepError(null);
    const eMod = validateModules();
    if (eMod) {
      setStepError(eMod);
      return;
    }
    const profile: OnboardingProfile = {
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      document: document.trim(),
      teamSize: teamSize as OnboardingTeamSize,
      vehiclesCount: vehiclesCount.trim(),
      workTypes,
      mainChallenge,
      addressCep: addressCep.trim(),
      addressStreet: addressStreet.trim(),
      addressNumber: addressNumber.trim(),
      addressComplement: addressComplement.trim(),
      modules,
      primaryColor,
      city: city.trim(),
      state: stateUf,
      website: website.trim(),
      instagram: instagram.trim(),
      notes: notes.trim(),
      logoDataUrl,
      companyPhotoDataUrl,
      completedAt: new Date().toISOString(),
      trialEndsAt: addDaysIso(TRIAL_DAYS),
    };
    setRegistrarPlanChoice(planChoice);
    saveOnboardingProfile(profile);
    applyModuleActivationFromOnboarding(profile.modules, profile.mainChallenge);
    try {
      const desafioLabel = CHALLENGES.find((c) => c.id === profile.mainChallenge)?.label;
      sessionStorage.setItem(
        'logta-modules-activated-toast',
        JSON.stringify({
          title: 'Ambiente configurado',
          message: `Módulos ativos: ${profile.modules.map((id) => MODULE_OPTIONS.find((m) => m.id === id)?.label ?? id).join(', ')}.${desafioLabel ? ` Foco inicial: ${desafioLabel} — menus e sugestões de IA foram priorizados para essa dor.` : ''} `,
        }),
      );
      sessionStorage.setItem('logta-guided-onboarding-v1', '1');
    } catch {
      /* ignore */
    }
    saveLogtaEntitlementsToStorage(
      defaultTrialEntitlements(profile.email.trim().toLowerCase(), profile.trialEndsAt),
    );
    await updateConfig({
      companyName: profile.companyName,
      primaryColor: profile.primaryColor,
      logoUrl: profile.logoDataUrl,
    });
    setStep(processingStep);
    processingCompleteRef.current = false;
  };

  const onProcessingComplete = useCallback(() => {
    if (processingCompleteRef.current) return;
    processingCompleteRef.current = true;
    try {
      sessionStorage.setItem(LOGTA_SESSION_BOOT_FLAG, '1');
    } catch {
      /* ignore */
    }
    navigate('/inicio', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sso') === '1') {
      supabase.auth.getUser().then(({ data }) => {
        const u = data.user;
        if (u?.email) setEmail(u.email);
        const meta = u?.user_metadata as Record<string, string> | undefined;
        if (meta?.full_name) setFullName(meta.full_name);
        if (meta?.name && !meta?.full_name) setFullName(meta.name);
      });
    }
  }, []);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return 'Vamos começar sua operação.';
      case 2:
        return 'Documento e segurança';
      case 3:
        return 'Equipe e frota';
      case 4:
        return 'Em que sua empresa atua?';
      case 5:
        return 'Principal desafio hoje';
      case 6:
        return 'Endereço da sede';
      case 7:
        return 'O que você deseja gerenciar?';
      case 8:
        return 'Personalize sua empresa';
      default:
        return '';
    }
  }, [step]);

  const processingLines = useMemo(
    () => buildProcessingLines(modules, mainChallenge),
    [modules, mainChallenge],
  );

  if (step === processingStep) {
    return <ProcessingScreen lines={processingLines} onComplete={onProcessingComplete} />;
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white font-sans lg:flex-row">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#0a0f1c] px-8 py-10 text-white lg:w-[42%] lg:max-w-xl lg:py-14 xl:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 100% 80% at 0% 0%, rgb(37,99,235), transparent 55%), radial-gradient(ellipse 80% 60% at 100% 100%, rgb(79,70,229), transparent 50%)',
          }}
        />
        <div className="relative z-10 space-y-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Já tenho conta
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Zap className="h-5 w-5 text-amber-300" />
            </div>
            <span className="text-sm font-black tracking-tight">LOGTA</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black leading-tight tracking-tight xl:text-4xl">
              Operação inteligente, experiência premium.
            </h1>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-white/75">
              O mesmo nível de acabamento que você espera de Stripe, Notion ou Linear — aplicado à sua logística.
            </p>
          </div>
          <ul className="space-y-4 pt-4">
            {(
              [
                { text: 'Teste grátis de 5 dias', Icon: Sparkles },
                { text: 'Sem cartão obrigatório', Icon: CreditCard },
                { text: 'Configuração automática', Icon: Wand2 },
              ] as const
            ).map(({ text, Icon }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 mt-12 text-[11px] font-medium text-white/45 lg:mt-0">
          © {new Date().getFullYear()} LOGTA · Infraestrutura segura e escalável
        </p>
      </aside>

      <main className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-6 py-8 sm:px-8 lg:min-h-[100dvh] lg:px-[119px] lg:py-10">
        <div className="my-auto flex w-full max-w-[866px] flex-col items-center py-6 pb-10">
          <div className="w-full text-center">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{stepTitle}</h2>
            <p className="mt-2 text-sm font-medium text-gray-500">
              {step === 1 && 'Seus dados e da empresa — em seguida você define a senha.'}
              {step === 2 && 'CPF ou CNPJ e uma senha forte para proteger o acesso.'}
              {step === 3 && 'Quantas pessoas e veículos na operação.'}
              {step === 4 && 'Marque uma ou mais opções — próximo: desafio principal.'}
              {step === 5 && 'Escolha o que mais pesa hoje — depois endereço opcional e módulos.'}
              {step === 6 && 'Opcional: preencha agora ou mais tarde em Configurações.'}
              {step === 7 && 'Selecione os módulos — você pode ajustar depois.'}
              {step === 8 &&
                includeBrandingStep &&
                'Identidade visual e dados de contato — exclusivo para quem contrata plano pago.'}
            </p>
          </div>

          {step === 1 && (
            <div className="mt-8 w-full max-w-md space-y-6">
              <div>
                <label className={labelClass}>Nome completo</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-11`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nome da empresa</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-11`}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Razão ou fantasia"
                    autoComplete="organization"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={`${inputClass} pl-11`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-11`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 w-full max-w-md space-y-6">
              <div>
                <label className={labelClass}>CPF ou CNPJ</label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-11`}
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="Somente números ou formatado"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Criar senha</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputClass} pl-11 pr-12`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mín. 8 caracteres"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-900"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirmar senha</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      className={`${inputClass} pl-11 pr-12`}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-900"
                      aria-label={showPassword2 ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    >
                      {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 flex w-full max-w-[866px] flex-col items-center space-y-9">
              <div className="w-full max-w-lg">
                <p className={`${labelClass} text-center`}>Quantas pessoas trabalham na empresa?</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TEAM_SIZES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTeamSize(id)}
                      className={`rounded-xl border px-3 py-3 text-center text-xs font-bold transition-all ${
                        teamSize === id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-600/20'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full max-w-lg">
                <label className={`${labelClass} text-center`}>Quantos veículos possui?</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  value={vehiclesCount}
                  onChange={(e) => setVehiclesCount(e.target.value)}
                  placeholder="Ex: 12"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-8 flex w-full max-w-[866px] flex-col items-center">
              <div className="w-full max-w-3xl">
                <p className={`${labelClass} text-center`}>Trabalha com (pode marcar vários)</p>
                <div className="mt-3 grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                  {WORK_TYPES.map(({ id, label, hint }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleWork(id)}
                      className={`flex min-h-[92px] items-start gap-3 rounded-2xl border-2 p-[19px] text-left transition-all ${
                        workTypes.includes(id)
                          ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-600/20'
                          : 'border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          workTypes.includes(id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {workTypes.includes(id) ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-gray-900">{label}</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-gray-500">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="mt-8 flex w-full max-w-lg flex-col items-center">
              <p className={`${labelClass} w-full text-center`}>Qual o principal desafio hoje?</p>
              <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                {CHALLENGES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMainChallenge(id)}
                    className={`rounded-xl border-2 px-3 py-3 text-center text-xs font-bold transition-all ${
                      mainChallenge === id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="mt-8 w-full max-w-2xl rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className={`${labelClass} !mb-0 text-left !normal-case`}>Endereço da empresa (opcional)</p>
                  <p className="mt-1 text-left text-xs font-medium text-gray-500">
                    Ajuda em documentos fiscais e rotas. Você pode completar depois nas configurações.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>CEP</label>
                  <input
                    className={inputClass}
                    value={addressCep}
                    onChange={(e) => setAddressCep(e.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Logradouro</label>
                  <input
                    className={inputClass}
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Rua, avenida…"
                  />
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input
                    className={inputClass}
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    placeholder="Nº"
                  />
                </div>
                <div>
                  <label className={labelClass}>Complemento</label>
                  <input
                    className={inputClass}
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    placeholder="Sala, bloco…"
                  />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input
                    className={inputClass}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className={labelClass}>UF</label>
                  <select className={inputClass} value={stateUf} onChange={(e) => setStateUf(e.target.value)}>
                    <option value="">UF</option>
                    {BR_UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="mt-8 grid w-full max-w-3xl shrink-0 grid-cols-1 gap-[10px] sm:grid-cols-2">
              {MODULE_OPTIONS.map(({ id, label, hint }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleModule(id)}
                  className={`flex min-h-[92px] items-start gap-3 rounded-2xl border-2 p-[19px] text-left transition-all ${
                    modules.includes(id)
                      ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-600/20'
                      : 'border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      modules.includes(id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {modules.includes(id) ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-gray-900">{label}</span>
                    <span className="mt-0.5 block text-[11px] font-medium text-gray-500">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 8 && includeBrandingStep && (
            <div className="mt-8 w-full max-w-lg space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-[13px] font-medium leading-relaxed text-blue-950">
                Etapa disponível apenas no fluxo <strong className="font-bold">Plano pago</strong>. Ajuste logo, cores e
                contatos da operação antes de entrar no sistema.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Logo da empresa</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 transition hover:border-blue-300 hover:bg-blue-50/30">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setLogoDataUrl(await fileToDataUrl(f));
                      }}
                    />
                    {logoDataUrl ? (
                      <img src={logoDataUrl} alt="" className="max-h-24 object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">Clique para enviar</span>
                    )}
                  </label>
                </div>
                <div>
                  <label className={labelClass}>Foto da empresa (opcional)</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 transition hover:border-blue-300 hover:bg-blue-50/30">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setCompanyPhotoDataUrl(await fileToDataUrl(f));
                      }}
                    />
                    {companyPhotoDataUrl ? (
                      <img src={companyPhotoDataUrl} alt="" className="max-h-24 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">Clique para enviar</span>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <label className={labelClass}>Cor principal</label>
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 text-gray-400" />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                  />
                  <input
                    className={inputClass}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#2563EB"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Cidade</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      className={`${inputClass} pl-11`}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <select
                    className={inputClass}
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                  >
                    <option value="">UF</option>
                    {BR_UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Site</label>
                <input
                  className={inputClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input
                  className={inputClass}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@suaempresa"
                />
              </div>
              <div>
                <label className={labelClass}>Observações</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Algo que devemos saber sobre sua operação?"
                />
              </div>
            </div>
          )}

          {stepError ? (
            <p className="mx-auto mt-6 w-full max-w-md rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
              {stepError}
            </p>
          ) : null}

          <div className="mt-10 flex w-full max-w-[866px] flex-col-reverse gap-[10px] sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="rounded-xl border border-gray-200 px-[26px] py-[19px] text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Voltar
            </button>
            {step < maxStep ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[55px] items-center justify-center gap-[10px] rounded-xl bg-gray-950 px-[26px] py-[19px] text-sm font-black text-white shadow-lg shadow-gray-950/25 transition hover:bg-gray-900"
              >
                {step <= 2 ? 'Continuar' : 'Próxima etapa'}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finalize}
                className="inline-flex min-h-[55px] items-center justify-center gap-[10px] rounded-xl bg-blue-600 px-[26px] py-[19px] text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
              >
                Finalizar configuração
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
