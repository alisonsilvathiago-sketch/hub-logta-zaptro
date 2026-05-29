import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileUp,
  LayoutDashboard,
  LogOut,
  Package,
  ScanLine,
  Settings,
  Truck,
  Undo2,
  Warehouse,
  Webhook,
} from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';
import { can } from '@/lib/permissions';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/products', label: 'Produtos', icon: Package, perm: 'products.read' as const },
  { to: '/app/warehouses', label: 'Depósitos', icon: Warehouse, perm: 'warehouses.read' as const },
  { to: '/app/movements', label: 'Movimentações', icon: ArrowLeftRight, perm: 'movements.read' as const },
  { to: '/app/transfers', label: 'Transferências', icon: ArrowLeftRight, perm: 'movements.read' as const },
  { to: '/app/picking', label: 'Separação', icon: ClipboardCheck },
  { to: '/app/conference', label: 'Conferência', icon: ScanLine },
  { to: '/app/inventory', label: 'Inventário', icon: Boxes, perm: 'inventory.read' as const },
  { to: '/app/returns', label: 'Devoluções', icon: Undo2 },
  { to: '/app/imports', label: 'Importações', icon: FileUp },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3, perm: 'reports.read' as const },
  { to: '/app/alerts', label: 'Alertas', icon: AlertTriangle },
  { to: '/app/integrations', label: 'Integrações', icon: Webhook, perm: 'integrations.read' as const },
  { to: '/app/settings', label: 'Configurações', icon: Settings, perm: 'settings.read' as const },
];

const Sidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-900">LogStoka</p>
            <p className="text-xs font-semibold text-slate-500">WMS Multicanal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          if (item.perm && !can(item.perm, profile?.role)) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2">
          <p className="truncate text-sm font-bold text-slate-900">{profile?.full_name || 'Usuário'}</p>
          <p className="truncate text-xs text-slate-500">{profile?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="ls-btn-secondary w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 w-full text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Voltar ao site
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
