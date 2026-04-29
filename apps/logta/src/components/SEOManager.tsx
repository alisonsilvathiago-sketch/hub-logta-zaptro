import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

const SEOManager: React.FC<SEOProps> = ({ title, description, keywords }) => {
  const location = useLocation();

  useEffect(() => {
    const defaultTitle = 'Logita Intelligence | Logística de Alta Performance';
    const defaultDescription = 'Gestão completa com Logita: CRM, Logística, Frota, Estoque, Financeiro e RH para transportadoras.';
    const defaultKeywords = 'logita, logística, crm transporte, frota, gestão de estoque, erp logistica';

    document.title = title || defaultTitle;

    const upsertMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    upsertMeta('description', description || defaultDescription);
    upsertMeta('keywords', keywords || defaultKeywords);

  }, [title, description, keywords, location]);

  return null;
};

export default SEOManager;
