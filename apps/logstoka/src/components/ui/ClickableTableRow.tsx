import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

const ClickableTableRow: React.FC<Props> = ({ to, children, className }) => {
  const navigate = useNavigate();

  return (
    <tr
      className={`ls-table-row-link${className ? ` ${className}` : ''}`}
      tabIndex={0}
      role="link"
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </tr>
  );
};

/** Evita navegação ao clicar em botões dentro da linha */
export function stopRowNavigate(e: React.MouseEvent) {
  e.stopPropagation();
}

export default ClickableTableRow;
