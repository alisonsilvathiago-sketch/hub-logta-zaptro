import React, { useLayoutEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { readPrintHtml } from '@/lib/openPrintDocument';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import '@/pages/printConferenceDocument.css';

const PrintConferenceDocumentPage: React.FC = () => {
  const [params] = useSearchParams();
  const key = params.get('key');
  const html = key ? readPrintHtml(key) : null;

  useLayoutEffect(() => {
    if (!html) return;
    document.open();
    document.write(html);
    document.close();
  }, [html]);

  if (!key) {
    return (
      <div className="ls-print-doc-missing">
        <h1>Documento não encontrado</h1>
        <p>Volte à operação e clique em <strong>Imprimir</strong> novamente.</p>
        <Link to={LOGSTOKA_ROUTES.OPERATIONAL_WORK}>Abrir operação</Link>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="ls-print-doc-missing">
        <h1>Documento expirado ou indisponível</h1>
        <p>
          Abra a lista (Foco hoje, Não enviados, etc.) e clique em <strong>Imprimir</strong> de novo.
        </p>
        <Link to={LOGSTOKA_ROUTES.HOME}>Ir para início</Link>
      </div>
    );
  }

  return (
    <div className="ls-print-doc-loading">
      <p>Abrindo lista para conferência…</p>
    </div>
  );
};

export default PrintConferenceDocumentPage;
