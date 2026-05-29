import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

const SEOManager: React.FC<SEOProps> = ({ title, description }) => {
  useEffect(() => {
    document.title = title || 'Hub | Central de Comando';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description || 'Gestão global do ecossistema Hub.');
  }, [title, description]);

  return null;
};

export default SEOManager;
