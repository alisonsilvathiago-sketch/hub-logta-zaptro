import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare } from 'lucide-react';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import './zaptroAppModulePage.css';

const ZaptroAppFilesPage: React.FC = () => (
  <div className="zaptro-app-module-page">
    <header className="zaptro-app-module-head">
      <div>
        <h1>Arquivos</h1>
        <p>Mídias e documentos partilhados nas conversas WhatsApp.</p>
      </div>
      <Link to={ZAPTRO_APP_ROUTES.INBOX} className="zaptro-app-module-btn">
        Ir para conversas
      </Link>
    </header>

    <section className="zaptro-app-module-card">
      <div className="zaptro-app-contacts-empty" style={{ padding: '32px 16px' }}>
        <FileText size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>
          Arquivos por conversa
        </p>
        <p style={{ margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Abra uma conversa no inbox para ver anexos, imagens e documentos enviados pelo cliente ou pela equipa.
        </p>
        <Link
          to={ZAPTRO_APP_ROUTES.INBOX}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            color: '#0f172a',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <MessageSquare size={16} /> Abrir conversas
        </Link>
      </div>
    </section>
  </div>
);

export default ZaptroAppFilesPage;
