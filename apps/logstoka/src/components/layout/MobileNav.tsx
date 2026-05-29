import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ScanLine, Warehouse } from 'lucide-react';

const items = [
  { to: '/app', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/app/products', label: 'Produtos', icon: Package },
  { to: '/app/conference', label: 'Conferir', icon: ScanLine },
  { to: '/app/warehouses', label: 'Depósitos', icon: Warehouse },
];

const MobileNav: React.FC = () => (
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
    <div className="grid grid-cols-4 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-xl px-2 py-2 text-[10px] font-bold ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'
              }`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </div>
  </nav>
);

export default MobileNav;
