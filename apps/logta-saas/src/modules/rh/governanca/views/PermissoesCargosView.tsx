import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Shield,
  Lock,
  Users,
  Key,
  Eye,
  Settings,
  UserCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type PermissoesCargosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockPerfis = [
  {
    id: '1',
    nome: 'Administrador',
    nivel: 'Admin',
    modulos: ['RH Completo', 'Financeiro', 'Configurações', 'Logs', 'Usuários'],
    usuarios: 3,
    criadoEm: '10/01/2024',
    cor: 'red',
  },
  {
    id: '2',
    nome: 'RH Gestor',
    nivel: 'Gestor',
    modulos: ['Colaboradores', 'Ponto', 'Férias', 'Relatórios', 'Payroll'],
    usuarios: 5,
    criadoEm: '15/01/2024',
    cor: 'orange',
  },
  {
    id: '3',
    nome: 'RH Analista',
    nivel: 'Analista',
    modulos: ['Colaboradores', 'Ponto', 'Férias', 'Relatórios'],
    usuarios: 12,
    criadoEm: '20/01/2024',
    cor: 'blue',
  },
  {
    id: '4',
    nome: 'Operacional',
    nivel: 'Visualizador',
    modulos: ['Ponto', 'Escalas'],
    usuarios: 22,
    criadoEm: '25/01/2024',
    cor: 'green',
  },
  {
    id: '5',
    nome: 'Motorista Líder',
    nivel: 'Visualizador',
    modulos: ['Ponto', 'Escalas', 'Certificações'],
    usuarios: 8,
    criadoEm: '05/02/2024',
    cor: 'purple',
  },
];

const nivelClass: Record<string, string> = {
  Admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Gestor: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  Analista: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Visualizador: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

const corIcone: Record<string, string> = {
  red: 'bg-red-500/10 text-red-500',
  orange: 'bg-orange-500/10 text-orange-500',
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  purple: 'bg-purple-500/10 text-purple-500',
};

export function PermissoesCargosView({ module, hubPath, hubLabel }: PermissoesCargosViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    nivel: 'Visualizador',
    modulos: '',
    descricao: '',
  });

  const kpis = [
    {
      icon: Settings,
      title: 'Cargos Cadastrados',
      value: '18',
      trend: 'up' as const,
      trendValue: '+2 este mês',
    },
    {
      icon: Users,
      title: 'Usuários com Acesso',
      value: '45',
      trend: 'neutral' as const,
      trendValue: '3 aguardando',
    },
    {
      icon: Key,
      title: 'Perfis de Permissão',
      value: '6',
      trend: 'neutral' as const,
      trendValue: 'revisados em mar',
    },
    {
      icon: Lock,
      title: 'Acessos Bloqueados',
      value: '3',
      trend: 'down' as const,
      trendValue: '-1 esta semana',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Novo Perfil de Acesso"
      aria-label="Novo Perfil de Acesso"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const sidePanel = (
    <>
      <div className="logta-panel-card--dark logta-panel-card--retention p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">IA de Segurança</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Análise contínua de padrões de acesso e detecção de privilégios excessivos.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-red-400">⚠️ Acesso Atípico</p>
            <p className="mt-1 text-xs text-neutral-300">
              Sérgio Alves (perfil Analista) acessou módulo de Payroll 3x fora do horário comercial. Revise permissões.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-yellow-400">🔐 Sugestão de Segurança</p>
            <p className="mt-1 text-xs text-neutral-300">
              Recomendo ativar MFA para os 3 usuários com perfil Admin. Isso reduziria o risco de acesso indevido em 87%.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-orange-400">👤 Acesso Excessivo</p>
            <p className="mt-1 text-xs text-neutral-300">
              2 usuários com perfil Analista têm permissões que não foram usadas nos últimos 60 dias. Considere revogar.
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Distribuição de Acesso</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Usuários por Nível</p>
            <div className="space-y-1.5">
              {[
                { nivel: 'Admin', qtd: 3, pct: 7 },
                { nivel: 'Gestor', qtd: 5, pct: 11 },
                { nivel: 'Analista', qtd: 12, pct: 27 },
                { nivel: 'Visualizador', qtd: 25, pct: 55 },
              ].map((n) => (
                <div key={n.nivel}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-neutral-400">
                    <span>{n.nivel}</span>
                    <span>{n.qtd} usuários ({n.pct}%)</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${n.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Módulos Mais Acessados</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
              <div className="flex justify-between"><span>Ponto</span><span className="font-bold">38 usuários</span></div>
              <div className="flex justify-between"><span>Colaboradores</span><span className="font-bold">17 usuários</span></div>
              <div className="flex justify-between"><span>Relatórios</span><span className="font-bold">17 usuários</span></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Acessos Negados Recentes</p>
            <div className="space-y-1 text-xs">
              <p className="text-red-400">• Payroll – Analista (3x hoje)</p>
              <p className="text-red-400">• Configurações – Operacional (1x)</p>
              <p className="text-red-400">• Logs – Motorista Líder (2x)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8 text-left">
      <Link
        to={hubPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpis}
        mainContentTitle="Perfis de Acesso"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockPerfis.map((perfil) => (
            <div
              key={perfil.id}
              className="group rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${corIcone[perfil.cor]}`}>
                  <Shield size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{perfil.nome}</p>
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${nivelClass[perfil.nivel]}`}>
                      {perfil.nivel}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {perfil.modulos.map((m) => (
                      <span key={m} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {perfil.usuarios} usuário{perfil.usuarios !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} /> Criado em {perfil.criadoEm}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('info', `Editando perfil: ${perfil.nome}`, 'Permissões')}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                  title="Editar perfil"
                >
                  <Settings size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Perfis de Permissão"
        getTabularData={() => ({
          title: 'Perfis de Permissão',
          filenameBase: 'rh-permissoes-cargos',
          columns: ['Nome do Perfil', 'Nível', 'Módulos', 'Usuários', 'Criado em'],
          rows: mockPerfis.map((p) => [p.nome, p.nivel, p.modulos.join(', '), String(p.usuarios), p.criadoEm]),
        })}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative max-h-[min(92dvh,640px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader icon={Key} title="Novo Perfil de Acesso" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Nome do Perfil</label>
                <input
                  type="text"
                  placeholder="Ex: Supervisor de Frota"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Nível de Acesso</label>
                <select
                  value={form.nivel}
                  onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option>Admin</option>
                  <option>Gestor</option>
                  <option>Analista</option>
                  <option>Visualizador</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Módulos Permitidos</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Colaboradores', 'Ponto', 'Férias', 'Payroll', 'Relatórios', 'Certificações', 'Escalas', 'Logs', 'Configurações', 'Auditoria'].map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2">
                      <input type="checkbox" className="accent-primary" />
                      <span className="text-xs text-neutral-300">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Descrição</label>
                <textarea
                  placeholder="Descreva as responsabilidades e escopo de acesso deste perfil..."
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-neutral-700 py-3.5 text-sm font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', 'Perfil de acesso criado com sucesso!', 'Permissões');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Criar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
