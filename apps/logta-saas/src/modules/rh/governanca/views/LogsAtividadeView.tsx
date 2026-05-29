import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Activity,
  Shield,
  Eye,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Search,
  Zap,
  Monitor,
  Smartphone,
  Globe,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { RhModuleDef } from '../../types';

type LogsAtividadeViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const mockLogs = [
  {
    id: '1',
    evento: 'Alteração de Salário',
    usuario: 'Ana Beatriz Costa',
    entidade: 'Colaborador',
    antes: 'R$ 4.200,00',
    depois: 'R$ 4.800,00',
    dataHora: '21/05/2025 09:14:32',
    origem: 'Web',
    alerta: true,
  },
  {
    id: '2',
    evento: 'Registro de Ponto',
    usuario: 'Carlos Mendes',
    entidade: 'Ponto',
    antes: '—',
    depois: 'Entrada: 08:02',
    dataHora: '21/05/2025 08:02:17',
    origem: 'App',
    alerta: false,
  },
  {
    id: '3',
    evento: 'Exclusão de Documento',
    usuario: 'Rafael Torres',
    entidade: 'Documentos',
    antes: 'CNH_Motorista_João.pdf',
    depois: 'Arquivo removido',
    dataHora: '21/05/2025 07:48:05',
    origem: 'Web',
    alerta: true,
  },
  {
    id: '4',
    evento: 'Criação de Colaborador',
    usuario: 'Fernanda Lima',
    entidade: 'Colaborador',
    antes: '—',
    depois: 'Lucas Oliveira (Motorista)',
    dataHora: '20/05/2025 17:30:11',
    origem: 'Web',
    alerta: false,
  },
  {
    id: '5',
    evento: 'Alteração de Cargo',
    usuario: 'Marcos Prado',
    entidade: 'Colaborador',
    antes: 'Auxiliar Logístico',
    depois: 'Coordenador de Frota',
    dataHora: '20/05/2025 16:10:44',
    origem: 'API',
    alerta: false,
  },
  {
    id: '6',
    evento: 'Acesso Negado',
    usuario: 'Desconhecido',
    entidade: 'Segurança',
    antes: 'Tentativa de login',
    depois: 'Bloqueado (3 tentativas)',
    dataHora: '20/05/2025 14:55:22',
    origem: 'Web',
    alerta: true,
  },
  {
    id: '7',
    evento: 'Aprovação de Férias',
    usuario: 'Juliana Martins',
    entidade: 'Férias',
    antes: 'Solicitação pendente',
    depois: 'Aprovada: 02/06–16/06/2025',
    dataHora: '20/05/2025 11:20:09',
    origem: 'Web',
    alerta: false,
  },
  {
    id: '8',
    evento: 'Exportação de Dados',
    usuario: 'Sérgio Alves',
    entidade: 'Relatório',
    antes: '—',
    depois: 'Folha de Pagamento Abril – 234 registros',
    dataHora: '20/05/2025 09:05:53',
    origem: 'Web',
    alerta: false,
  },
];

const origemIcon: Record<string, React.ReactNode> = {
  Web: <Monitor size={12} />,
  App: <Smartphone size={12} />,
  API: <Globe size={12} />,
};

const origemClass: Record<string, string> = {
  Web: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  App: 'bg-green-500/10 text-green-400 border border-green-500/20',
  API: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

const usuarios = ['Ana Beatriz Costa', 'Carlos Mendes', 'Rafael Torres', 'Fernanda Lima', 'Marcos Prado', 'Juliana Martins', 'Sérgio Alves'];
const modulos = ['Colaborador', 'Ponto', 'Documentos', 'Segurança', 'Férias', 'Relatório', 'Salário'];

export function LogsAtividadeView({ module, hubPath, hubLabel }: LogsAtividadeViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    de: '',
    ate: '',
    modulo: '',
    usuario: '',
    tipoAcao: '',
  });

  const kpis = [
    {
      icon: Activity,
      title: 'Eventos Hoje',
      value: '847',
      trend: 'up' as const,
      trendValue: '+112 vs. ontem',
    },
    {
      icon: User,
      title: 'Usuários Ativos',
      value: '23',
      trend: 'neutral' as const,
      trendValue: 'nas últimas 8h',
    },
    {
      icon: Shield,
      title: 'Alertas de Segurança',
      value: '2',
      trend: 'down' as const,
      trendValue: '-1 vs. ontem',
    },
    {
      icon: FileText,
      title: 'Dados Alterados',
      value: '156',
      trend: 'up' as const,
      trendValue: '+23 hoje',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Filtrar Logs"
      aria-label="Filtrar Logs"
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
          <span className="text-sm font-bold text-white">IA de Auditoria</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-neutral-400">
          Monitorando comportamentos e detectando anomalias em tempo real.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-red-400">🚨 Anomalia Detectada</p>
            <p className="mt-1 text-xs text-neutral-300">
              3 tentativas de login falhas para usuário "desconhecido" às 14h55. IP: 189.xxx.xx.21. Acesso bloqueado automaticamente.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-yellow-400">⚠️ Padrão Suspeito</p>
            <p className="mt-1 text-xs text-neutral-300">
              Rafael Torres excluiu 3 documentos em menos de 5 minutos. Ação incomum — nível de risco elevado.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-blue-400">📊 Pico de Atividade</p>
            <p className="mt-1 text-xs text-neutral-300">
              Horário de maior volume: 08h–10h (312 eventos). Menor atividade: 13h–14h (45 eventos).
            </p>
          </div>
        </div>
      </div>

      <div className="logta-panel-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Métricas do Sistema</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Eventos por Módulo</p>
            <div className="space-y-1.5">
              {[
                { nome: 'Ponto', count: 312 },
                { nome: 'Colaborador', count: 198 },
                { nome: 'Relatório', count: 134 },
              ].map((m) => (
                <div key={m.nome} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-neutral-400">{m.nome}</span>
                  <span className="font-bold text-gray-800 dark:text-white">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">Usuários Mais Ativos</p>
            <div className="space-y-1">
              {[
                { nome: 'Ana Beatriz', eventos: 89 },
                { nome: 'Fernanda Lima', eventos: 74 },
                { nome: 'Carlos Mendes', eventos: 61 },
              ].map((u) => (
                <div key={u.nome} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-neutral-400">{u.nome}</span>
                  <span className="font-bold text-gray-800 dark:text-white">{u.eventos} eventos</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">IPs Recentes</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-neutral-400">
              <p>192.168.1.10 – Escritório (matriz)</p>
              <p>177.xxx.xx.34 – VPN corporativa</p>
              <p className="text-red-400">189.xxx.xx.21 – 🚨 Bloqueado</p>
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
        mainContentTitle="Log de Auditoria"
        mainContentAction={mainContentAction}
        sidePanel={sidePanel}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-2">
          {mockLogs.map((log) => (
            <div
              key={log.id}
              className={`rounded-2xl border p-4 transition-shadow hover:shadow-sm ${
                log.alerta
                  ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5'
                  : 'border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'
              }`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    log.alerta ? 'bg-red-100 dark:bg-red-500/10' : 'bg-primary/10'
                  }`}
                >
                  {log.alerta ? (
                    <AlertTriangle size={16} className="text-red-500" />
                  ) : (
                    <Eye size={16} className="text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{log.evento}</p>
                    {log.alerta && (
                      <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        ALERTA
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${origemClass[log.origem]}`}>
                      {origemIcon[log.origem]} {log.origem}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <User size={11} /> {log.usuario}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> {log.entidade}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {log.dataHora}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                      Antes: {log.antes}
                    </span>
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-primary">
                      Depois: {log.depois}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Logs de Atividade"
        getTabularData={() => ({
          title: 'Logs de Atividade',
          filenameBase: 'rh-logs-atividade',
          columns: ['Evento', 'Usuário', 'Entidade', 'Antes', 'Depois', 'Data/Hora', 'Origem'],
          rows: mockLogs.map((l) => [l.evento, l.usuario, l.entidade, l.antes, l.depois, l.dataHora, l.origem]),
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
            <LogtaModalHeader icon={Search} title="Filtrar Logs" onClose={() => setIsModalOpen(false)} />

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-400">De</label>
                  <input
                    type="date"
                    value={form.de}
                    onChange={(e) => setForm((f) => ({ ...f, de: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Até</label>
                  <input
                    type="date"
                    value={form.ate}
                    onChange={(e) => setForm((f) => ({ ...f, ate: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Módulo / Entidade</label>
                <select
                  value={form.modulo}
                  onChange={(e) => setForm((f) => ({ ...f, modulo: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Todos os módulos</option>
                  {modulos.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Usuário</label>
                <select
                  value={form.usuario}
                  onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Todos os usuários</option>
                  {usuarios.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-400">Tipo de Ação</label>
                <select
                  value={form.tipoAcao}
                  onChange={(e) => setForm((f) => ({ ...f, tipoAcao: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Todas as ações</option>
                  <option>Criação</option>
                  <option>Alteração</option>
                  <option>Exclusão</option>
                  <option>Acesso Negado</option>
                  <option>Exportação</option>
                  <option>Aprovação</option>
                </select>
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
                    showToast('success', 'Filtros aplicados com sucesso!', 'Logs Filtrados');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
