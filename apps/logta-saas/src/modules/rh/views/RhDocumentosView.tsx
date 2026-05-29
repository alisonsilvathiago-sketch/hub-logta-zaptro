import React, { useState } from 'react';
import { FileText, Upload, Search, Download, ExternalLink, Calendar as CalendarIcon, ShieldCheck, AlertCircle, ChevronDown } from 'lucide-react';
import { LogtaLogDockUploadModal } from '../../../components/LogtaLogDockUploadModal';
import { getHubLogDockDriveUrl } from '@/lib/hub';

export function RhDocumentosView({ motoristas = [] }: { motoristas?: any[] }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);

  // Generate synthetic documents based on the motoristas list
  const allDocuments = motoristas.flatMap(driver => {
    return [
      {
        id: `${driver.id}-cnh`,
        driverName: driver.nome || 'Motorista',
        driverId: driver.id,
        title: `CNH - ${driver.cnh_categoria || 'Categoria não informada'}`,
        type: 'CNH',
        category: 'Documentos Pessoais',
        status: driver.cnh_vencimento ? 'Ativo' : 'Pendente',
        date: driver.cnh_vencimento || 'N/A',
        icon: FileText
      },
      {
        id: `${driver.id}-aso`,
        driverName: driver.nome || 'Motorista',
        driverId: driver.id,
        title: 'Exame ASO (Admissional/Periódico)',
        type: 'ASO',
        category: 'Saúde e Exames',
        status: 'Ativo',
        date: '2025-10-15',
        icon: ShieldCheck
      },
      {
        id: `${driver.id}-contrato`,
        driverName: driver.nome || 'Motorista',
        driverId: driver.id,
        title: 'Contrato de Trabalho / Prestação',
        type: 'Contrato',
        category: 'Contratos e NR',
        status: 'Ativo',
        date: driver.created_at ? new Date(driver.created_at).toISOString().split('T')[0] : '2024-01-01',
        icon: FileText
      }
    ];
  });

  const filteredDocs = allDocuments.filter(doc => 
    doc.driverName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by Driver Name
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.driverName]) acc[doc.driverName] = [];
    acc[doc.driverName].push(doc);
    return acc;
  }, {} as Record<string, typeof allDocuments>);

  const groupedEntries = Object.entries(groupedDocs);
  const displayedEntries = groupedEntries.slice(0, limit);

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h3 className="logta-card-heading mb-2">Central de Documentos RH</h3>
          <p className="text-sm font-medium text-gray-500">
            Todos os documentos (CNH, ASO, Contratos) separados por colaborador. Integrado ao LogDock.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button type="button" onClick={() => setUploadOpen(true)} className="hub-premium-pill primary">
            <Upload size={16} /> Enviar documento
          </button>
          <a href={getHubLogDockDriveUrl()} target="_blank" rel="noopener noreferrer" className="hub-premium-pill secondary">
            <ExternalLink size={16} /> LogDock Drive
          </a>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            placeholder="Pesquisar por colaborador, tipo de documento ou segmento..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50" 
            type="search" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden sm:block text-xs font-black text-gray-400 uppercase tracking-wide shrink-0">
            Mostrando {displayedEntries.length} de {groupedEntries.length}
          </div>
          <select 
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 shadow-sm outline-none cursor-pointer"
          >
            <option value={10}>10 colaboradores</option>
            <option value={25}>25 colaboradores</option>
            <option value={50}>50 colaboradores</option>
            <option value={100}>100 colaboradores</option>
            <option value={9999}>Mostrar Todos</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {displayedEntries.map(([driverName, docs]) => (
          <div key={driverName} className="logta-panel-card p-6 md:p-8">
            <h4 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-4">{driverName}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => (
                <a 
                  key={doc.id}
                  href={`${getHubLogDockDriveUrl()}?q=${doc.driverName.replace(/\s+/g, '+')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 hover:bg-white hover:border-primary/30 hover:shadow-md transition-all group block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <doc.icon size={18} />
                    </div>
                    {doc.status === 'Pendente' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500 bg-red-50 px-2 py-1 rounded-md">
                        <AlertCircle size={12} /> Pendente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <ShieldCheck size={12} /> OK
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{doc.category}</p>
                  <p className="text-sm font-bold text-gray-900 mb-3 line-clamp-2">{doc.title}</p>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> {doc.date}</span>
                    <Download size={14} className="hover:text-primary transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {groupedEntries.length > limit && (
          <div className="flex justify-center pt-4 pb-8">
            <button 
              onClick={() => setLimit(prev => prev + 10)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50 shadow-sm transition-all"
            >
              Carregar mais colaboradores
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>
        )}

        {groupedEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">Nenhum documento encontrado.</p>
          </div>
        )}
      </div>

      <LogtaLogDockUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar documento RH"
        category="contratos"
        accept=".pdf,.xml,.zip,image/*"
      >
        <div className="mb-6 space-y-4 text-left">
          <div>
            <label className="mb-2 block text-xs font-bold text-neutral-400 uppercase tracking-wide">Vincular Colaborador</label>
            <select className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm outline-none transition-all focus:border-primary cursor-pointer">
              <option value="">Selecione um motorista...</option>
              {motoristas.map(m => (
                <option key={m.id} value={m.id}>{m.nome || 'Sem Nome'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-neutral-400 uppercase tracking-wide">Tipo de Documento</label>
            <select className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-sm outline-none transition-all focus:border-primary cursor-pointer">
              <option value="cnh">CNH</option>
              <option value="aso">Exame ASO (Admissional/Periódico)</option>
              <option value="contrato">Contrato de Trabalho / Prestação</option>
              <option value="outro">Outro / Comprovante</option>
            </select>
          </div>
        </div>
      </LogtaLogDockUploadModal>
    </div>
  );
}
