import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  BadgeCheck,
  AlertTriangle,
  Clock,
  FileCheck,
  Award,
  Calendar,
  ChevronRight,
  User,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import { useTenant } from '../../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { resolveRhPersonEquipeUrl } from '../../lib/rhLegacyUserRoute';
import type { RhModuleDef } from '../../types';

type CertificadosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

type CertStatus = 'Válido' | 'Vencendo em breve' | 'Vencido';

interface CertificadoRecord {
  id: string;
  colaborador: string;
  colaboradorId: string;
  tipoCertificado: string;
  dataEmissao: string;
  dataValidade: string;
  status: CertStatus;
  emissor: string;
  categoria: string;
}

const mockCertificados: CertificadoRecord[] = [
  {
    id: 'cert-001',
    colaborador: 'Marcos Oliveira',
    colaboradorId: 'emp-010',
    tipoCertificado: 'CNH - Categoria E',
    dataEmissao: '2021-03-15',
    dataValidade: '2026-03-15',
    status: 'Vencendo em breve',
    emissor: 'DETRAN-SP',
    categoria: 'Habilitação',
  },
  {
    id: 'cert-002',
    colaborador: 'Juliana Torres',
    colaboradorId: 'emp-011',
    tipoCertificado: 'MOPP - Transporte de Produtos Perigosos',
    dataEmissao: '2024-07-20',
    dataValidade: '2027-07-20',
    status: 'Válido',
    emissor: 'ANTT',
    categoria: 'Transporte',
  },
  {
    id: 'cert-003',
    colaborador: 'Diego Ferreira',
    colaboradorId: 'emp-012',
    tipoCertificado: 'NR-35 - Trabalho em Altura',
    dataEmissao: '2023-11-05',
    dataValidade: '2025-11-05',
    status: 'Vencido',
    emissor: 'Senai SP',
    categoria: 'Segurança do Trabalho',
  },
  {
    id: 'cert-004',
    colaborador: 'Amanda Nunes',
    colaboradorId: 'emp-013',
    tipoCertificado: 'ISO 9001:2015 - Auditor Interno',
    dataEmissao: '2023-04-10',
    dataValidade: '2026-04-10',
    status: 'Válido',
    emissor: 'Bureau Veritas',
    categoria: 'Qualidade',
  },
  {
    id: 'cert-005',
    colaborador: 'Roberto Alves',
    colaboradorId: 'emp-014',
    tipoCertificado: 'Primeiros Socorros e RCP',
    dataEmissao: '2024-01-22',
    dataValidade: '2026-01-22',
    status: 'Vencendo em breve',
    emissor: 'Cruz Vermelha Brasileira',
    categoria: 'Saúde e Segurança',
  },
];

const statusConfig: Record<CertStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Válido: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: BadgeCheck },
  'Vencendo em breve': { color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
  Vencido: { color: 'text-red-700', bg: 'bg-red-50', icon: Clock },
};

export function CertificadosView({ module, hubPath, hubLabel }: CertificadosViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoColaborador, setNovoColaborador] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novaEmissao, setNovaEmissao] = useState('');
  const [novaValidade, setNovaValidade] = useState('');
  const [novoEmissor, setNovoEmissor] = useState('');
  const [novoArquivo, setNovoArquivo] = useState('');

  const kpis = [
    {
      icon: BadgeCheck,
      title: 'Certificados Ativos',
      value: '156',
      trend: 'up' as const,
      trendValue: '+11 este mês',
    },
    {
      icon: AlertTriangle,
      title: 'Vencendo em 30d',
      value: '12',
      trend: 'down' as const,
      trendValue: 'Requer atenção',
    },
    {
      icon: Clock,
      title: 'Vencidos',
      value: '3',
      trend: 'down' as const,
      trendValue: 'Renovação urgente',
    },
    {
      icon: FileCheck,
      title: 'Cobertura da Equipe',
      value: '94%',
      trend: 'up' as const,
      trendValue: '+2% vs. mês anterior',
    },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Adicionar Certificado"
      aria-label="Adicionar Certificado"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  const handleSalvar = () => {
    if (!novoColaborador || !novoTipo.trim()) {
      showToast('error', 'Preencha colaborador e tipo de certificado.', 'Campos obrigatórios');
      return;
    }
    showToast('success', `Certificado "${novoTipo}" adicionado com sucesso!`, 'Certificado cadastrado');
    setNovoColaborador('');
    setNovoTipo('');
    setNovaEmissao('');
    setNovaValidade('');
    setNovoEmissor('');
    setNovoArquivo('');
    setIsModalOpen(false);
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';
  const labelClass = 'mb-1.5 block text-xs font-bold text-neutral-400 uppercase tracking-wide';

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
        mainContentTitle="Certificados por Colaborador"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {mockCertificados.map((cert) => {
            const cfg = statusConfig[cert.status];
            const StatusIcon = cfg.icon;
            return (
              <button
                key={cert.id}
                type="button"
                onClick={() =>
                  navigate(
                    resolveRhPersonEquipeUrl(companyId, {
                      id: cert.colaboradorId,
                      nome: cert.colaborador,
                    }),
                  )
                }
                className="group w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BadgeCheck size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold leading-snug text-gray-900">
                        {cert.tipoCertificado}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon size={11} />
                        {cert.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={11} /> {cert.colaborador}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Award size={11} /> {cert.emissor}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={11} /> Válido até{' '}
                        {new Date(cert.dataValidade).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {cert.categoria}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-gray-400 transition-colors group-hover:text-primary"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar Certificados"
        getTabularData={() => ({
          title: 'Certificados',
          filenameBase: 'rh-certificados',
          columns: ['Colaborador', 'Certificado', 'Emissor', 'Emissão', 'Validade', 'Status', 'Categoria'],
          rows: mockCertificados.map((c) => [
            c.colaborador,
            c.tipoCertificado,
            c.emissor,
            new Date(c.dataEmissao).toLocaleDateString('pt-BR'),
            new Date(c.dataValidade).toLocaleDateString('pt-BR'),
            c.status,
            c.categoria,
          ]),
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
            className="relative max-h-[min(92dvh,680px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={BadgeCheck}
              title="Adicionar Certificado"
              onClose={() => setIsModalOpen(false)}
            />
            <div className="mt-8 space-y-4">
              <div>
                <label className={labelClass}>Colaborador</label>
                <select
                  value={novoColaborador}
                  onChange={(e) => setNovoColaborador(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecionar colaborador...</option>
                  <option value="emp-010">Marcos Oliveira</option>
                  <option value="emp-011">Juliana Torres</option>
                  <option value="emp-012">Diego Ferreira</option>
                  <option value="emp-013">Amanda Nunes</option>
                  <option value="emp-014">Roberto Alves</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo de Certificado</label>
                <input
                  type="text"
                  placeholder="Ex.: NR-35, CNH Categoria E, ISO 9001..."
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Data de Emissão</label>
                  <input
                    type="date"
                    value={novaEmissao}
                    onChange={(e) => setNovaEmissao(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data de Validade</label>
                  <input
                    type="date"
                    value={novaValidade}
                    onChange={(e) => setNovaValidade(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Emissor / Instituição</label>
                <input
                  type="text"
                  placeholder="Ex.: DETRAN-SP, Bureau Veritas, Senai..."
                  value={novoEmissor}
                  onChange={(e) => setNovoEmissor(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Arquivo do Certificado (link ou nome)</label>
                <input
                  type="text"
                  placeholder="Ex.: certificado-nr35-diego.pdf ou URL do documento"
                  value={novoArquivo}
                  onChange={(e) => setNovoArquivo(e.target.value)}
                  className={inputClass}
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
                  onClick={handleSalvar}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Salvar Certificado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
