import React from 'react';
import { ScanLine } from 'lucide-react';

type Props = {
  onClick: () => void;
};

const IntelligentScanFab: React.FC<Props> = ({ onClick }) => (
  <button
    type="button"
    className="ls-scan-fab"
    onClick={onClick}
    aria-label="Scanner inteligente"
    title="Scanner inteligente"
  >
    <ScanLine size={22} strokeWidth={2.2} />
  </button>
);

export default IntelligentScanFab;
