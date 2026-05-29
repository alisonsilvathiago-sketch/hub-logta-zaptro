import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ScanLine, Sparkles, Warehouse } from 'lucide-react';

type Props = {
  onOpenAi?: () => void;
  hideAi?: boolean;
};

const items = [
  { to: '/app', label: 'Início', icon: Sparkles, end: true },
  { to: '/app/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/app/products', label: 'Produtos', icon: Package },
  { to: '/app/conference', label: 'Conferir', icon: ScanLine },
  { to: '/app/warehouses', label: 'Depósitos', icon: Warehouse },
];

const MobileNav: React.FC<Props> = ({ onOpenAi, hideAi }) => (
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
    <div className={`grid gap-1 ${hideAi ? 'grid-cols-5' : 'grid-cols-6'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-xl px-1 py-2 text-[10px] font-bold ${
                isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-500'
              }`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
      {!hideAi && (
        <button
          type="button"
          className="flex flex-col items-center rounded-xl px-1 py-2 text-[10px] font-bold text-orange-700"
          onClick={onOpenAi}
        >
          <Sparkles size={18} />
          IA
        </button>
      )}
    </div>
  </nav>
);

export default MobileNav;
