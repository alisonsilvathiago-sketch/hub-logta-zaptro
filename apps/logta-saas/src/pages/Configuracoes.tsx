import React from 'react';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
  Building2,
  Palette,
  Globe,
  DollarSign,
  FileText,
  Bell,
  Shield,
  Settings,
  Upload,
  CreditCard,
  Lock,
  CheckCircle2,
  QrCode,
  Plus,
  Webhook,
  KeyRound,
  ShieldCheck,
  ScrollText,
  ListOrdered,
  Activity,
  Copy,
  AlertTriangle,
  BookOpen,
  Users,
  Plug,
  Link2,
  ExternalLink,
  Trash2,
  Cpu,
  Truck,
  Zap,
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { ALL_ONBOARDING_MODULE_IDS, MAIN_CHALLENGE_IDS, type MainChallengeId } from '../lib/logtaModuleActivation';
import type { OnboardingModuleId } from '../lib/onboardingStorage';
import {
  fileToDataUrl,
  loadEmpresaProfile,
  saveEmpresaProfile,
} from '../lib/empresaProfileStorage';

// --- Sub-Views ---

const ConfiguracaoInteligenteView = () => {
  const { config, updateConfig } = useTenant();
  const [activeModules, setActiveModules] = React.useState<string[]>(config.activeModules || []);
  const [mainChallenge, setMainChallenge] = React.useState<string | null>(config.mainChallenge);
  const [saving, setSaving] = React.useState(false);

  const toggleModule = (id: string) => {
    setActiveModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await updateConfig({
      activeModules,
      mainChallenge,
    });
    setSaving(false);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Estrutura do sistema atualizada com sucesso! O painel será reorganizado.', 'Sistema Inteligente');
    }
  };

  const moduleLabels: Record<string, string> = {
    financeiro: 'Financeiro',
    crm: 'CRM / Comercial',
    operacoes: 'Operações Logísticas',
    frota: 'Gestão de Frota',
    rastreamento: 'Rastreamento GPS',
    oficina: 'Oficina Mecânica',
    hubchat: 'Hub Chat Equipe',
    ia: 'IA & Automação',
    logdock: 'LogDock (Docs)',
    relatorios: 'Relatórios BI',
  };

  const challengeLabels: Record<string, string> = {
    organizacao: 'Organizar a Operação',
    financeiro: 'Controlar o Financeiro',
    entregas: 'Aumentar Entregas',
    automacao: 'Automatizar Processos',
    clientes: 'Vender para mais Clientes',
    operacao: 'Escalabilidade Operacional',
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Módulos Ativos */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Ativação de Módulos</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Personalize as ferramentas da sua LOGTA</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_ONBOARDING_MODULE_IDS.map(modId => (
              <button
                key={modId}
                onClick={() => toggleModule(modId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  activeModules.includes(modId)
                    ? 'border-primary bg-primary/5 text-gray-900'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeModules.includes(modId) ? 'bg-primary' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold">{moduleLabels[modId] || modId}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desafio Principal */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Desafio Principal</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Define a prioridade da IA e do Menu</p>
            </div>
          </div>

          <div className="space-y-2">
            {MAIN_CHALLENGE_IDS.map(chId => (
              <button
                key={chId}
                onClick={() => setMainChallenge(chId)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${
                  mainChallenge === chId
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                }`}
              >
                <span className="text-xs font-bold">{challengeLabels[chId] || chId}</span>
                {mainChallenge === chId && <CheckCircle2 size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Efeito em Tempo Real</p>
          <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
            Ao salvar, o menu lateral, os dashboards e as automações serão reorganizados instantaneamente para todos os usuários da empresa.
          </p>
        </div>
      </div>

      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-10 py-5 bg-gray-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-normal shadow-xl shadow-gray-900/20 hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {saving ? 'Atualizando Estrutura...' : 'Atualizar Sistema Agora'}
        </button>
      </div>
    </div>
  );
};

const EmpresaView = () => {
  const { config, updateConfig } = useTenant();
  const companyId = config.id ?? 'logta-demo-company';
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [profile, setProfile] = React.useState(() => loadEmpresaProfile(companyId));

  React.useEffect(() => {
    const loaded = loadEmpresaProfile(companyId);
    if (!loaded.logoDataUrl && config.logoUrl) {
      setProfile({ ...loaded, logoDataUrl: config.logoUrl });
    } else {
      setProfile(loaded);
    }
  }, [companyId, config.logoUrl]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const logoDataUrl = await fileToDataUrl(file);
    setProfile((prev) => ({ ...prev, logoDataUrl }));
    void updateConfig({ logoUrl: logoDataUrl });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    saveEmpresaProfile(companyId, profile);
    void updateConfig({
      companyName: profile.nomeFantasia || profile.razaoSocial,
      logoUrl: profile.logoDataUrl,
    });
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Dados cadastrais da empresa salvos com sucesso!', 'Dados Salvos');
    } else {
      alert('Dados salvos com sucesso!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-stretch gap-6 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:flex-row lg:gap-10 lg:rounded-[40px] lg:p-10">
        <div className="flex flex-shrink-0 flex-col items-center gap-4 sm:items-start lg:items-start">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleLogoChange(e)}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="group flex h-36 w-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition-all hover:border-primary hover:text-primary sm:h-40 sm:w-40 lg:h-40 lg:w-40 lg:rounded-[32px]"
          >
            {profile.logoDataUrl ? (
              <img src={profile.logoDataUrl} alt="Logo da empresa" className="h-full w-full object-contain p-3" />
            ) : (
              <>
                <Upload size={28} className="mb-2 transition-transform group-hover:-translate-y-1 sm:h-8 sm:w-8" />
                <span className="px-3 text-center text-[9px] font-black uppercase tracking-normal sm:text-[10px]">
                  Upload logo
                </span>
              </>
            )}
          </button>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Razão Social</label>
            <input
              type="text"
              value={profile.razaoSocial}
              onChange={(e) => setProfile({ ...profile, razaoSocial: e.target.value })}
              className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Nome Fantasia</label>
            <input
              type="text"
              value={profile.nomeFantasia}
              onChange={(e) => setProfile({ ...profile, nomeFantasia: e.target.value })}
              className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">CNPJ</label>
            <input
              type="text"
              value={profile.cnpj}
              onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
              className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Endereço Completo</label>
            <input
              type="text"
              value={profile.endereco}
              onChange={(e) => setProfile({ ...profile, endereco: e.target.value })}
              className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="w-full cursor-pointer rounded-2xl bg-gray-900 px-6 py-4 text-[10px] font-black uppercase tracking-normal text-white shadow-xl shadow-gray-900/20 transition-all hover:bg-gray-800 sm:w-auto sm:rounded-[24px] sm:px-10 sm:py-5 sm:text-[11px]"
        >
          Salvar dados da empresa
        </button>
      </div>
    </div>
  );
};

const WhiteLabelView = () => {
  const handleSaveBranding = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Configurações de marca e White Label aplicadas com sucesso!', 'Marca Atualizada');
    } else {
      alert('Configurações salvas!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-[24px] p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10 space-y-8">
          <h3 className="logta-card-heading">Cores & Tema</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Cor Primária (Sistema)</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D7FF00] shadow-sm border border-gray-100" />
                <input type="text" defaultValue="#D7FF00" className="flex-1 px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Tema Padrão</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button type="button" className="flex-1 rounded-[20px] bg-gray-900 py-4 text-[10px] font-black uppercase tracking-normal text-white">Dark Mode</button>
                <button type="button" className="flex-1 rounded-[20px] bg-gray-100 py-4 text-[10px] font-black uppercase tracking-normal text-gray-500 transition-colors hover:text-gray-900">Light Mode</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[24px] p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10 space-y-8">
          <h3 className="logta-card-heading">Marca (White Label)</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Nome da Plataforma</label>
              <input type="text" defaultValue="Logta Carrier System" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-4 rounded-[24px] bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Remover "Powered by Zaptro"</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-gray-500">Exclusivo plano Enterprise</p>
              </div>
              <div className="relative h-6 w-12 shrink-0 cursor-pointer self-end rounded-full bg-primary sm:self-auto">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-gray-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={handleSaveBranding}
          className="w-full cursor-pointer rounded-2xl bg-primary px-6 py-4 text-[10px] font-black uppercase tracking-normal text-gray-900 shadow-xl shadow-primary/20 transition-all hover:opacity-90 sm:w-auto sm:rounded-[24px] sm:px-10 sm:py-5 sm:text-[11px]"
        >
          Aplicar Branding
        </button>
      </div>
    </div>
  );
};

const DEMO_API_KEY = 'logta_sk_live_demo_7f3a9c2e1b8d4a6e';

const LOGTA_API_BASE_DEMO = 'https://api.logta.app/v1';
const LOGTA_WEBHOOK_INGRESS_DEMO = 'https://hooks.logta.app/ingress/ca12a071-98a4-4f2e-b0c1-9d8e7f6a5b4c';

const CONNECTOR_PRESETS = [
  {
    id: 'erp',
    label: 'ERP / TMS',
    hint: 'SAP, Bling, Omie, sistema próprio — pedidos, NF-e e cadastros.',
    Icon: Building2,
  },
  {
    id: 'cobranca',
    label: 'Cobrança & PIX',
    hint: 'Asaas, Gerencianet, bancos — boletos, carnês e conciliação.',
    Icon: CreditCard,
  },
  {
    id: 'rastreio',
    label: 'Rastreamento GPS',
    hint: 'Telemetria, cerca virtual e posição de frota em tempo real.',
    Icon: Activity,
  },
  {
    id: 'mensageria',
    label: 'Mensageria',
    hint: 'E-mail transacional, WhatsApp Business, Slack.',
    Icon: Bell,
  },
  {
    id: 'custom',
    label: 'API personalizada',
    hint: 'Qualquer sistema com REST — URL, chave e cabeçalhos.',
    Icon: Globe,
  },
] as const;

type ConnectorId = (typeof CONNECTOR_PRESETS)[number]['id'];

type ConnectorStored = { baseUrl: string; apiKey: string; clientSecret: string; enabled: boolean };

const CONNECTORS_STORAGE_KEY = 'logta-integration-connectors';

function loadConnectors(): Record<ConnectorId, ConnectorStored> {
  const empty = (): ConnectorStored => ({
    baseUrl: '',
    apiKey: '',
    clientSecret: '',
    enabled: false,
  });
  const base: Record<ConnectorId, ConnectorStored> = {
    erp: empty(),
    cobranca: empty(),
    rastreio: empty(),
    mensageria: empty(),
    custom: empty(),
  };
  try {
    const raw = localStorage.getItem(CONNECTORS_STORAGE_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<Record<ConnectorId, ConnectorStored>>;
    CONNECTOR_PRESETS.forEach(({ id }) => {
      if (p[id]) base[id] = { ...empty(), ...p[id] };
    });
    return base;
  } catch {
    return base;
  }
}

function saveConnectors(data: Record<ConnectorId, ConnectorStored>) {
  try {
    localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const IntegracoesView = () => {
  const [sub, setSub] = React.useState<
    'inicio' | 'conectores' | 'api' | 'seguranca' | 'webhooks' | 'logs_req' | 'logs_wh'
  >('inicio');
  const [copied, setCopied] = React.useState(false);
  const [connectors, setConnectors] = React.useState<Record<ConnectorId, ConnectorStored>>(loadConnectors);
  const [openConnector, setOpenConnector] = React.useState<ConnectorId | null>(null);
  const [webhookDraft, setWebhookDraft] = React.useState({ url: '', event: 'carga.finalizada' });
  const [webhookList, setWebhookList] = React.useState<{ id: string; url: string; event: string }[]>(() => {
    try {
      const raw = localStorage.getItem('logta-integration-webhooks');
      if (!raw) return [];
      return JSON.parse(raw) as { id: string; url: string; event: string }[];
    } catch {
      return [];
    }
  });

  const persistWebhooks = (list: { id: string; url: string; event: string }[]) => {
    setWebhookList(list);
    try {
      localStorage.setItem('logta-integration-webhooks', JSON.stringify(list));
    } catch {
      /* ignore */
    }
  };

  const copyKey = () => {
    void navigator.clipboard.writeText(DEMO_API_KEY);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    (window as any).showToast?.('success', 'Chave copiada para a área de transferência.', 'Integrações');
  };

  const copyText = (label: string, text: string) => {
    void navigator.clipboard.writeText(text);
    (window as any).showToast?.('success', `${label} copiado.`, 'Integrações');
  };

  const updateConnector = (id: ConnectorId, patch: Partial<ConnectorStored>) => {
    setConnectors((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveConnectors(next);
      return next;
    });
  };

  const subTabs = [
    { id: 'inicio' as const, label: 'Início', Icon: Activity },
    { id: 'conectores' as const, label: 'Conectores', Icon: Plug },
    { id: 'api' as const, label: 'Chaves de API', Icon: KeyRound },
    { id: 'seguranca' as const, label: 'Mecanismos de segurança', Icon: ShieldCheck },
    { id: 'webhooks' as const, label: 'Webhooks', Icon: Webhook },
    { id: 'logs_req' as const, label: 'Logs de Requisições', Icon: ScrollText },
    { id: 'logs_wh' as const, label: 'Logs de Webhooks', Icon: ListOrdered },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Integrações</h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Prepare sua operação para ERPs, gateways, rastreamento e webhooks: URLs base, chaves e conectores — pronto para
          plugar APIs reais no backend.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Você possui 1 fila de webhooks pausada (simulação)</p>
          <p className="mt-1 text-xs font-medium text-amber-900/90">
            Verifique as configurações de Webhooks e os problemas em Logs de Webhooks. Filas podem pausar após várias
            falhas de entrega.
          </p>
        </div>
      </div>

      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {subTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSub(id)}
            className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-colors ${
              sub === id
                ? 'border border-b-0 border-gray-200 bg-white text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon size={15} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-[320px] rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {sub === 'inicio' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <Link2 className="h-4 w-4 text-primary" />
                    URLs da Logta para o seu TI
                  </h3>
                  <p className="mt-1 text-xs font-medium text-gray-600">
                    Use na documentação do parceiro. Em produção, o domínio final virá do Hub / certificado do tenant.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">API REST (base)</p>
                  <div className="mt-2 flex gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-2 py-1.5 font-mono text-[11px] text-gray-800">
                      {LOGTA_API_BASE_DEMO}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText('URL da API', LOGTA_API_BASE_DEMO)}
                      className="shrink-0 rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Webhook ingress (Logta → parceiro)</p>
                  <div className="mt-2 flex gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-2 py-1.5 font-mono text-[11px] text-gray-800">
                      {LOGTA_WEBHOOK_INGRESS_DEMO}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText('URL de webhook', LOGTA_WEBHOOK_INGRESS_DEMO)}
                      className="shrink-0 rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900">
                Ambiente de testes
                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-700">
                  Novo
                </span>
              </h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600">
                Use chaves e URLs de sandbox para validar automações sem afetar produção.
              </p>
              <button
                type="button"
                className="mt-4 rounded-xl border-2 border-primary bg-white px-4 py-2 text-xs font-black text-primary transition hover:bg-primary/5"
              >
                → Acessar documentação
              </button>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-sm font-black text-gray-900">Wallet / Tenant ID</h3>
              <p className="mt-2 text-xs font-medium text-gray-600">
                Identificador único da conta para repasses e auditoria no Hub.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  readOnly
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-[11px] text-gray-800"
                  value="ca12a071-98a4-4f2e-b0c1-9d8e7f6a5b4c"
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText('ca12a071-98a4-4f2e-b0c1-9d8e7f6a5b4c');
                    (window as any).showToast?.('success', 'ID copiado.', 'Integrações');
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white"
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
            </div>
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
                <BookOpen className="h-8 w-8 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Documentação</p>
                  <p className="mt-1 text-xs text-gray-500">Endpoints REST, eventos e exemplos de payload.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
                <Users className="h-8 w-8 shrink-0 text-violet-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Comunidade dev</p>
                  <p className="mt-1 text-xs text-gray-500">Dúvidas sobre webhooks e filas de entrega.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sub === 'conectores' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-600">
              Cadastre credenciais do <strong className="font-bold text-gray-800">sistema externo</strong> que vai
              conversar com a Logta. Os valores ficam neste navegador até o backend oficial persistir no tenant.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONNECTOR_PRESETS.map(({ id, label, hint, Icon }) => {
                const c = connectors[id];
                const expanded = openConnector === id;
                return (
                  <div
                    key={id}
                    className={`flex flex-col rounded-2xl border-2 p-4 transition-colors ${
                      c.enabled ? 'border-primary/40 bg-primary/5' : 'border-gray-100 bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <Icon className="h-5 w-5 text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-gray-900">{label}</p>
                        <p className="mt-0.5 text-[11px] font-medium leading-snug text-gray-500">{hint}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          c.enabled ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {c.enabled ? 'Ativo' : 'Não configurado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenConnector(expanded ? null : id)}
                        className="ml-auto text-xs font-bold text-primary hover:underline"
                      >
                        {expanded ? 'Fechar' : 'Configurar'}
                      </button>
                    </div>
                    {expanded ? (
                      <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400">URL base do parceiro</label>
                          <input
                            type="url"
                            placeholder="https://api.fornecedor.com/v1"
                            value={c.baseUrl}
                            onChange={(e) => updateConnector(id, { baseUrl: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400">API Key / token</label>
                          <input
                            type="password"
                            autoComplete="off"
                            placeholder="Cole a chave fornecida pelo sistema externo"
                            value={c.apiKey}
                            onChange={(e) => updateConnector(id, { apiKey: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400">Client secret (opcional)</label>
                          <input
                            type="password"
                            autoComplete="off"
                            placeholder="OAuth / HMAC — se aplicável"
                            value={c.clientSecret}
                            onChange={(e) => updateConnector(id, { clientSecret: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={c.enabled}
                            onChange={(e) => updateConnector(id, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                          Marcar como ativo (quando credenciais estiverem válidas)
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="flex items-start gap-2 text-xs text-gray-500">
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              A orquestração real (criptografia, rotação e auditoria) será feita no servidor; esta tela é o contrato de
              campos que o produto precisa.
            </p>
          </div>
        )}

        {sub === 'api' && (
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium text-gray-600">
              Gere e revogue chaves para integrações server-to-server. Nunca exponha a chave no front-end.
            </p>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <label className="text-[10px] font-black uppercase tracking-wide text-gray-400">Chave secreta (demo)</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="block min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-900 ring-1 ring-gray-200">
                  {DEMO_API_KEY}
                </code>
                <button
                  type="button"
                  onClick={copyKey}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white"
                >
                  <Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-900">Nova chave de produção</p>
              <p className="mt-1 text-xs text-gray-500">
                Geração e revogação com escopos (fretes.read, financeiro.write…) ficarão no Hub quando a API pública estiver
                ligada.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 rounded-xl bg-gray-100 px-4 py-2 text-xs font-black text-gray-400"
              >
                Gerar chave (em breve)
              </button>
            </div>
          </div>
        )}

        {sub === 'seguranca' && (
          <p className="text-sm text-gray-600">
            IP allowlist, assinatura HMAC e rotação de chaves — em produção, configure no Hub Master com o time de
            infraestrutura.
          </p>
        )}

        {sub === 'webhooks' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cadastre a <strong className="font-semibold text-gray-800">URL do seu sistema</strong> para receber eventos
              da Logta (HTTPS). Retry exponencial e filas pausam após falhas repetidas — espelhado em gateways como Asaas.
            </p>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Novo endpoint</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">URL HTTPS</label>
                  <input
                    type="url"
                    placeholder="https://seu-sistema.com.br/webhooks/logta"
                    value={webhookDraft.url}
                    onChange={(e) => setWebhookDraft((d) => ({ ...d, url: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Evento</label>
                  <select
                    value={webhookDraft.event}
                    onChange={(e) => setWebhookDraft((d) => ({ ...d, event: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 sm:min-w-[180px]"
                  >
                    <option value="carga.finalizada">carga.finalizada</option>
                    <option value="entrega.atualizada">entrega.atualizada</option>
                    <option value="cte.autorizado">cte.autorizado</option>
                    <option value="financeiro.recebimento">financeiro.recebimento</option>
                    <option value="frota.viagem.iniciada">frota.viagem.iniciada</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const u = webhookDraft.url.trim();
                  if (!u.startsWith('https://')) {
                    (window as any).showToast?.('error', 'Informe uma URL HTTPS válida.', 'Webhooks');
                    return;
                  }
                  const id = `wh_${Date.now()}`;
                  persistWebhooks([...webhookList, { id, url: u, event: webhookDraft.event }]);
                  setWebhookDraft({ url: '', event: webhookDraft.event });
                  (window as any).showToast?.('success', 'Endpoint salvo localmente — sincronize com o backend depois.', 'Webhooks');
                }}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white"
              >
                Adicionar endpoint
              </button>
            </div>
            {webhookList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-6 text-center text-sm font-medium text-gray-500">
                Nenhum endpoint ainda — adicione acima ou registre via API quando o serviço estiver no ar.
              </div>
            ) : (
              <ul className="space-y-2">
                {webhookList.map((w) => (
                  <li
                    key={w.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <code className="text-[11px] font-mono text-gray-800">{w.url}</code>
                      <p className="mt-1 text-[10px] font-black uppercase text-primary">{w.event}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => persistWebhooks(webhookList.filter((x) => x.id !== w.id))}
                      className="inline-flex items-center gap-1 self-end text-xs font-bold text-red-600 sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(sub === 'logs_req' || sub === 'logs_wh') && (
          <p className="text-sm text-gray-600">
            Histórico de chamadas e entregas aparecerá aqui quando o backend de auditoria estiver ligado ao projeto.
          </p>
        )}
      </div>
    </div>
  );
};

const DominioView = () => {
  const handleVerify = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Domínio verificado e certificado SSL validado com sucesso!', 'Domínio Ativo');
    } else {
      alert('Domínio verificado com sucesso!');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10">
        <h3 className="mb-6 text-lg font-bold tracking-tight text-gray-900 sm:mb-8 sm:text-xl">Domínio Personalizado</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Domínio de Acesso (White Label)</label>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-4">
              <input type="text" placeholder="app.suaempresa.com.br" defaultValue="app.logta.com.br" className="min-w-0 flex-1 rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={handleVerify} className="w-full shrink-0 cursor-pointer rounded-[20px] bg-gray-900 px-6 py-4 text-[10px] font-black uppercase tracking-normal text-white sm:w-auto">Verificar</button>
            </div>
          </div>
          
          <div className="p-6 bg-green-50 border border-green-100 rounded-[28px] flex items-start gap-4">
            <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="text-sm font-bold text-green-900 mb-1">Domínio Ativo e Protegido</p>
              <p className="text-[10px] text-green-700 font-bold uppercase tracking-normal leading-relaxed">O certificado SSL (HTTPS) foi gerado e o domínio está apontando corretamente para nossos servidores.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">E-mail Remetente Padrão (SMTP)</label>
            <input type="email" defaultValue="no-reply@logta.com.br" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FinanceiroView = ({ onAddClick }: any) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
    <div className="space-y-6 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
      <div>
        <h3 className="logta-card-heading">Métodos de Faturamento</h3>
        <p className="text-xs text-gray-400 font-medium mt-1">Configure suas contas bancárias e credenciais para receber pagamentos de clientes.</p>
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="w-full min-h-[51px] px-5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={16} /> Forma de Pagamento
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white border border-gray-200 rounded-[24px] p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10 space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <QrCode size={24} />
          </div>
          <h3 className="logta-card-heading">Recebimento via PIX</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Tipo de Chave</label>
            <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
              <option>CNPJ</option>
              <option>E-mail</option>
              <option>Chave Aleatória</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Chave PIX</label>
            <input type="text" defaultValue="12.345.678/0001-99" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[24px] p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10 space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <h3 className="logta-card-heading">Dados Bancários (Boletos/TED)</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Banco</label>
            <input type="text" defaultValue="341 - Itaú Unibanco" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Agência</label>
            <input type="text" defaultValue="0001" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Conta Corrente</label>
            <input type="text" defaultValue="12345-6" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FiscalView = () => {
  const handleSaveFiscal = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Configurações fiscais e Certificado Digital salvos com sucesso!', 'Faturamento Ativo');
    } else {
      alert('Configurações fiscais salvas com sucesso!');
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-200 rounded-[24px] p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10 w-full flex flex-1 flex-col min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 flex-1 min-h-0 md:items-stretch">
          <div className="space-y-6 flex flex-col">
            <h3 className="logta-card-heading mb-6">Emissão (CT-e / MDF-e)</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Regime Tributário</label>
              <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
                <option>Lucro Presumido</option>
                <option>Simples Nacional</option>
                <option>Lucro Real</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Série CT-e</label>
                <input type="text" defaultValue="1" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-normal ml-2">Série MDF-e</label>
                <input type="text" defaultValue="1" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <div className="flex min-h-[240px] flex-col space-y-6 md:min-h-0">
            <h3 className="logta-card-heading mb-6 shrink-0">Certificado Digital</h3>
            <div className="flex min-h-[180px] flex-1 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10 sm:min-h-[200px] sm:rounded-[32px] sm:p-8 md:min-h-0">
              <FileText size={32} className="mx-auto mb-4 text-primary shrink-0" />
              <p className="text-sm font-bold text-gray-900">Upload Certificado A1 (.pfx)</p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mt-2">Válido até 12/2027</p>
            </div>
          </div>
        </div>
        <div className="mt-auto flex shrink-0 justify-stretch border-t border-gray-100 pt-4 sm:justify-end">
          <button
            type="button"
            onClick={handleSaveFiscal}
            className="w-full cursor-pointer rounded-2xl bg-gray-900 px-6 py-4 text-[10px] font-black uppercase tracking-normal text-white shadow-xl shadow-gray-900/20 transition-all hover:bg-gray-800 sm:w-auto sm:rounded-[24px] sm:px-10 sm:py-5 sm:text-[11px]"
          >
            Salvar Parâmetros Fiscais
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificacoesView = () => (
  <div className="flex min-h-full w-full flex-1 flex-col animate-in fade-in duration-500">
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10">
      <h3 className="mb-6 shrink-0 text-lg font-bold tracking-tight text-gray-900 sm:mb-8 sm:text-xl">Canais de Alerta</h3>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-4">
          {[
            { title: 'Alertas de Frete (Novo CT-e)', desc: 'E-mail + WhatsApp para equipe base' },
            { title: 'Vencimento Financeiro', desc: 'Resumo diário por E-mail' },
            { title: 'Manutenção de Frota', desc: 'Alerta instantâneo no WhatsApp' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-[24px] bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:rounded-[28px]">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-gray-500">{item.desc}</p>
              </div>
              <div className="relative h-6 w-12 shrink-0 cursor-pointer self-end rounded-full bg-primary sm:self-auto">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-gray-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SegurancaView = () => (
  <div className="flex min-h-full w-full flex-1 flex-col animate-in fade-in duration-500">
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10">
      <h3 className="mb-6 shrink-0 text-lg font-bold tracking-tight text-gray-900 sm:mb-8 sm:text-xl">Políticas de Segurança</h3>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[24px] bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-6">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Autenticação em Dois Fatores (2FA)</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-gray-500">Obrigatório para todos os usuários</p>
            </div>
            <div className="relative h-6 w-12 shrink-0 cursor-pointer self-end rounded-full bg-gray-300 sm:self-auto">
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Tempo de Sessão (Inatividade)</label>
            <select className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
              <option>4 horas</option>
              <option>8 horas</option>
              <option>12 horas</option>
              <option>Manter conectado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SistemaView = () => (
  <div className="flex min-h-full w-full flex-1 flex-col animate-in fade-in duration-500">
    <div className="flex min-h-0 w-full flex-1 flex-col rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:rounded-[40px] lg:p-10">
      <h3 className="mb-6 shrink-0 text-lg font-bold tracking-tight text-gray-900 sm:mb-8 sm:text-xl">Configuração Global</h3>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Fuso Horário Padrão</label>
            <select className="w-full rounded-[20px] border-none bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20">
              <option>America/Sao_Paulo (UTC-3)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="ml-2 text-[10px] font-black uppercase tracking-normal text-gray-400">Moeda Base</label>
            <input
              type="text"
              disabled
              defaultValue="BRL (R$)"
              className="w-full cursor-not-allowed rounded-[20px] border-none bg-gray-100 px-5 py-4 text-sm font-bold text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

const Configuracoes = () => {
  const location = useLocation();
  const path = location.pathname;
  const [isAddPaymentOpen, setIsAddPaymentOpen] = React.useState(false);
  const [addSuccess, setAddSuccess] = React.useState(false);

  const tabs = [
    { id: 'inteligente', label: 'Configuração Inteligente', shortLabel: 'IA / Smart', Icon: Zap, path: '/admin-settings/inteligente' },
    { id: 'empresa', label: 'Empresa', shortLabel: 'Empresa', Icon: Building2, path: '/admin-settings/empresa' },
    { id: 'whitelabel', label: 'Marca', shortLabel: 'Marca', Icon: Palette, path: '/admin-settings/whitelabel' },
    { id: 'dominio', label: 'Domínio', shortLabel: 'Domínio', Icon: Globe, path: '/admin-settings/dominio' },
    { id: 'financeiro', label: 'Financeiro', shortLabel: 'Financ.', Icon: DollarSign, path: '/admin-settings/financeiro' },
    { id: 'fiscal', label: 'Fiscal', shortLabel: 'Fiscal', Icon: FileText, path: '/admin-settings/fiscal' },
    { id: 'notificacoes', label: 'Alertas', shortLabel: 'Alertas', Icon: Bell, path: '/admin-settings/notificacoes' },
    { id: 'seguranca', label: 'Segurança', shortLabel: 'Segur.', Icon: Shield, path: '/admin-settings/seguranca' },
    { id: 'sistema', label: 'Sistema', shortLabel: 'Sistema', Icon: Settings, path: '/admin-settings/sistema' },
    {
      id: 'integracoes',
      label: 'Integrações',
      shortLabel: 'Integr.',
      Icon: Webhook,
      path: '/admin-settings/integracoes',
    },
  ];

  return (
    <div className="logta-page flex h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden text-left animate-in fade-in duration-700">
      <div className="mb-6 flex flex-shrink-0 flex-col gap-1 lg:mb-10">
        <h1 className="logta-page-title">Configurações do Sistema</h1>
        <p className="mt-1 text-xs font-medium text-gray-400">Gerencie a identidade, parâmetros fiscais e segurança da sua plataforma.</p>
      </div>
      
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        {/* Navegação: mobile = scroll horizontal; lg = coluna fixa */}
        <nav
          aria-label="Seções de configuração"
          className="scrollbar-hide flex w-full min-w-0 flex-none flex-row gap-1 overflow-x-auto rounded-[24px] border border-gray-100 bg-gray-50/50 p-1.5 lg:h-fit lg:w-72 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:overflow-x-visible lg:p-2"
        >
          {tabs.map(tab => {
            const TabIcon = tab.Icon;
            const isActive = path.includes(tab.path);
            return (
              <Link 
                key={tab.id}
                to={tab.path}
                className={`flex shrink-0 items-center gap-2 rounded-[18px] px-[13px] py-3 text-[10px] font-black uppercase tracking-normal transition-all lg:w-full lg:gap-3 lg:rounded-[22px] lg:px-6 lg:py-4 lg:text-xs ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5 lg:shadow-xl' 
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                }`}
              >
                <TabIcon size={17} className={`shrink-0 lg:h-[18px] lg:w-[18px] ${isActive ? 'text-primary' : 'text-gray-400'}`} /> 
                <span className="whitespace-nowrap lg:hidden">{tab.shortLabel}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-8 lg:pr-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Routes>
            <Route index element={<Navigate to="inteligente" replace />} />
            <Route path="inteligente" element={<ConfiguracaoInteligenteView />} />
            <Route path="empresa" element={<EmpresaView />} />
            <Route path="whitelabel" element={<WhiteLabelView />} />
            <Route path="dominio" element={<DominioView />} />
            <Route path="financeiro" element={<FinanceiroView onAddClick={() => setIsAddPaymentOpen(true)} />} />
            <Route path="fiscal" element={<FiscalView />} />
            <Route path="notificacoes" element={<NotificacoesView />} />
            <Route path="seguranca" element={<SegurancaView />} />
            <Route path="sistema" element={<SistemaView />} />
            <Route path="integracoes" element={<IntegracoesView />} />
          </Routes>
        </div>
      </div>

      {/* Adicionar Forma de Pagamento Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddPaymentOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#18191B] rounded-[32px] shadow-2xl border border-neutral-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden text-white">
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <h3 className="text-xl font-bold text-white">Nova Forma de Pagamento</h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            {addSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Método Adicionado!</h4>
                  <p className="text-xs text-neutral-400 mt-1">O novo meio de pagamento foi integrado ao seu painel financeiro.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setAddSuccess(true);
                setTimeout(() => {
                  setAddSuccess(false);
                  setIsAddPaymentOpen(false);
                }, 2000);
              }} className="p-8 space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Nome do Método</label>
                  <input required placeholder="Ex: Cartão de Crédito ou Boleto Banco XYZ" className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Categoria</label>
                    <select className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option className="bg-neutral-900" value="gateway">Gateway (Asaas/Stripe)</option>
                      <option className="bg-neutral-900" value="pix">PIX Manual</option>
                      <option className="bg-neutral-900" value="bank">Conta Bancária Direta</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Prazo de Recebimento</label>
                    <select className="w-full bg-[#18191B] border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white">
                      <option className="bg-neutral-900" value="immediate">Imediato (D+0)</option>
                      <option className="bg-neutral-900" value="next_day">Próximo Dia (D+1)</option>
                      <option className="bg-neutral-900" value="thirty_days">30 Dias (D+30)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Chave de API ou Dados de Integração</label>
                  <input required type="password" placeholder="••••••••••••••••••••••••" className="w-full bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl outline-none focus:border-primary text-sm font-semibold text-white placeholder-neutral-500" />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[51px] px-5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer mt-2 flex items-center justify-center"
                >
                  Ativar Forma de Pagamento
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
