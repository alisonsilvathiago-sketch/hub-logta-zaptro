import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const AppShell: React.FC = () => (
  <div className="min-h-screen bg-slate-50">
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Operação</p>
              <h1 className="text-xl font-black text-slate-900">Centro Logístico</h1>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="ls-badge bg-emerald-50 text-emerald-700">Tempo real</span>
              <span className="ls-badge bg-slate-100 text-slate-600">API v1</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
    <MobileNav />
  </div>
);

export default AppShell;
