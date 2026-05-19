import React, { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { LogtaLogDockUploadModal } from '../../../components/LogtaLogDockUploadModal';
import { LogtaEmptyState } from '../../../components/EmptyState';
import { getHubLogDockDriveUrl } from '@/lib/hub';

export function RhDocumentosView() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-8 text-left">
      <div className="logta-panel-card p-6 sm:p-8">
        <h3 className="logta-card-heading mb-2">Documentação RH · LogDock</h3>
        <p className="text-sm font-medium text-gray-500">
          CNH, exames, contratos e certificados centralizados no ecossistema Logta / LogDock.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setUploadOpen(true)} className="hub-premium-pill primary">
            <Upload size={16} /> Enviar documento
          </button>
          <a
            href={getHubLogDockDriveUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-premium-pill secondary"
          >
            <FileText size={16} /> Abrir LogDock Drive
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { title: 'CNH & Categorias', desc: 'Carteira e validade por motorista.' },
          { title: 'Exames & ASO', desc: 'Toxicológico, admissional e periódicos.' },
          { title: 'Contratos & NR', desc: 'Documentação admissional e compliance.' },
        ].map((card) => (
          <div key={card.title} className="logta-panel-card p-6">
            <h4 className="logta-card-heading mb-2">{card.title}</h4>
            <p className="text-xs font-medium text-gray-500">{card.desc}</p>
          </div>
        ))}
      </div>

      <LogtaEmptyState type="documentos" onAction={() => setUploadOpen(true)} />

      <LogtaLogDockUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar documento RH"
        category="contratos"
        accept=".pdf,.xml,.zip,image/*"
      />
    </div>
  );
}
