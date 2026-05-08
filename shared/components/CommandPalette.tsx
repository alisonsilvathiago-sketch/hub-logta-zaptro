import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  Zap,
  Briefcase,
  Truck,
  Users,
  Settings,
  Calendar,
  MessageSquare,
  CreditCard,
  Building2,
  Fuel,
  Activity,
  Shield,
  HardDrive,
  Workflow,
  Cpu,
  Plug,
  Anchor,
  Bell,
  UserCircle,
  LayoutDashboard,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlatform } from '../lib/platform';

type PaletteCmd = {
  id: string;
  title: string;
  /** Termos extras para busca (combustível, rastreamento, etc.) */
  keywords?: string;
  icon: React.ReactNode;
  path: string;
};

const ALL_COMMANDS: PaletteCmd[] = [
  { id: 'home', title: 'Início do Hub', keywords: 'painel principal', icon: <Zap size={18} />, path: '/master' },
  { id: 'resultados', title: 'Resultados e KPIs', keywords: 'dashboard métricas', icon: <LayoutDashboard size={18} />, path: '/master/resultados' },
  { id: 'crm', title: 'CRM & Expansão', keywords: 'vendas pipeline', icon: <Briefcase size={18} />, path: '/master/crm' },
  { id: 'clientes', title: 'Clientes Hub', keywords: 'carteira relacionamento', icon: <Users size={18} />, path: '/master/clientes' },
  { id: 'agenda', title: 'Agenda Hub', keywords: 'compromissos calendário', icon: <Calendar size={18} />, path: '/master/agenda' },
  { id: 'hubchat', title: 'HubChat', keywords: 'mensagens conversas', icon: <MessageSquare size={18} />, path: '/master/hubchat' },
  { id: 'logistica', title: 'Logística (painel)', keywords: 'operações cargas entregas frota', icon: <Truck size={18} />, path: '/master/logistica' },
  { id: 'logistica-controle', title: 'Logística — Monitoramento & rastreamento', keywords: 'mapa rotas veículos ao vivo', icon: <MapPin size={18} />, path: '/master/logistica/controle' },
  { id: 'logistica-combustivel', title: 'Logística — Central de combustível', keywords: 'abastecimento preço diesel gasolina', icon: <Fuel size={18} />, path: '/master/logistica/combustivel' },
  { id: 'logistica-estrategia', title: 'Logística — Inteligência estratégica', keywords: 'roi analytics operacional', icon: <Activity size={18} />, path: '/master/logistica/estrategia' },
  { id: 'financeiro', title: 'Financeiro / Billing', keywords: 'cobrança mrr receitas', icon: <CreditCard size={18} />, path: '/master/billing?tab=financeiro' },
  { id: 'planos', title: 'Planos SaaS', keywords: 'assinaturas faturamento', icon: <Zap size={18} />, path: '/master/billing/planos' },
  { id: 'empresas', title: 'Empresas — lista', keywords: 'tenant instâncias saas', icon: <Building2 size={18} />, path: '/master/companies' },
  { id: 'empresas-modulos', title: 'Empresas — Módulos & Sync', keywords: 'integração sistemas', icon: <Building2 size={18} />, path: '/master/companies/modulos-sync' },
  { id: 'empresas-metricas', title: 'Empresas — Métricas & Score', keywords: 'performance health score', icon: <Building2 size={18} />, path: '/master/companies/metricas-score' },
  { id: 'automacoes', title: 'Automações', keywords: 'workflows triggers', icon: <Workflow size={18} />, path: '/master/automacoes' },
  { id: 'ia-gateway', title: 'Gateway IA', keywords: 'modelos tokens testes llm', icon: <Cpu size={18} />, path: '/master/ia-gateway' },
  { id: 'integracoes', title: 'Integrações', keywords: 'apis conectores', icon: <Plug size={18} />, path: '/master/integracoes' },
  { id: 'integracoes-webhooks', title: 'Integrações — Webhooks', keywords: 'callbacks eventos', icon: <Plug size={18} />, path: '/master/integracoes/webhooks' },
  { id: 'logdock', title: 'LogDock (Hub)', keywords: 'logs auditoria dock', icon: <Anchor size={18} />, path: '/master/logdock' },
  { id: 'infra-saude', title: 'Infraestrutura — Visão geral', keywords: 'saúde uptime vps', icon: <Activity size={18} />, path: '/master/infrastructure/saude' },
  { id: 'infra-seg', title: 'Infraestrutura — Segurança', keywords: 'tokens firewall', icon: <Shield size={18} />, path: '/master/infrastructure/seguranca' },
  { id: 'backup', title: 'Infraestrutura — Backup & storage', keywords: 'armazenamento restore', icon: <HardDrive size={18} />, path: '/master/infrastructure/backup' },
  { id: 'notificacoes', title: 'Notificações', keywords: 'alertas centro avisos', icon: <Bell size={18} />, path: '/master/notifications' },
  { id: 'settings', title: 'Configurações globais', keywords: 'preferências sistema branding', icon: <Settings size={18} />, path: '/master/settings' },
  { id: 'equipe', title: 'Equipe Master', keywords: 'usuários hub admins membros', icon: <Users size={18} />, path: '/master/settings/equipe' },
  { id: 'perfil', title: 'Meu perfil', keywords: 'conta usuário', icon: <UserCircle size={18} />, path: '/master/account' },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const platform = getPlatform();

  const commands = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_COMMANDS;
    return ALL_COMMANDS.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.keywords && cmd.keywords.toLowerCase().includes(q))
    );
  }, [search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    setSelectedIndex((i) => {
      if (!commands.length) return 0;
      return Math.min(i, commands.length - 1);
    });
  }, [commands.length]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearch('');
      setSelectedIndex(0);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('close-all-modals', handleClose);

    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('close-all-modals', handleClose);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const len = commands.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!len) return;
      setSelectedIndex(prev => (prev + 1) % len);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!len) return;
      setSelectedIndex(prev => (prev - 1 + len) % len);
    } else if (e.key === 'Enter') {
      const selected = commands[selectedIndex];
      if (selected) {
        navigate(selected.path);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 99999
    }} onClick={() => setIsOpen(false)}>
      <div 
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          animation: 'paletteIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          gap: '16px'
        }}>
          <Search size={20} color="#94A3B8" />
          <input
            ref={inputRef}
            placeholder="O que você deseja fazer?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              fontWeight: '500',
              color: '#1E293B',
              backgroundColor: 'transparent'
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#F1F5F9',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#64748B'
          }}>
            {platform.esc}
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
          {commands.length > 0 ? (
            commands.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => { navigate(cmd.path); setIsOpen(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  gap: '16px',
                  backgroundColor: i === selectedIndex ? '#F8FAFC' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: i === selectedIndex ? '#0061FF' : '#F1F5F9',
                  color: i === selectedIndex ? 'white' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}>
                  {cmd.icon}
                </div>
                <div style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: i === selectedIndex ? '#1E293B' : '#475569' }}>
                  {cmd.title}
                </div>
                {i === selectedIndex && (
                  <ArrowRight size={16} color="#0061FF" />
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
              Nenhum comando encontrado para "{search}"
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 24px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Command size={12} /> {platform.cmd} + K para buscar
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowRight size={12} /> Enter para selecionar
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hub Intelligence
          </div>
        </div>
      </div>
      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CommandPalette;

