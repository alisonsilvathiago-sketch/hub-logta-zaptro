import React from 'react';
import { MousePointer2 } from 'lucide-react';

type Props = {
  className?: string;
  size?: number;
};

/** Indica visualmente que o card/botão é clicável (canto superior direito). */
const LogstokaClickableHint: React.FC<Props> = ({ className = '', size = 11 }) => (
  <MousePointer2 size={size} className={`ls-clickable-hint${className ? ` ${className}` : ''}`} aria-hidden />
);

export default LogstokaClickableHint;
