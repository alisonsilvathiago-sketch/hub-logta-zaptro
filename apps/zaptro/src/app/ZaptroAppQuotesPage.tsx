import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ZaptroQuotesListContent } from '../pages/ZaptroQuotesList';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';
import './zaptroAppQuotes.css';

const ZaptroAppQuotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const embedOverlay = searchParams.get('embed') === '1';

  return (
    <ZaptroAppModuleShell fullBleed={embedOverlay}>
      <ZaptroQuotesListContent />
    </ZaptroAppModuleShell>
  );
};

export default ZaptroAppQuotesPage;
