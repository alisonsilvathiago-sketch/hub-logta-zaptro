import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, AlertTriangle } from 'lucide-react';
import type { AgendaAlert } from '../types';

type Props = {
  open: boolean;
  alerts: AgendaAlert[];
  onClose: () => void;
  onDismiss: (id: string) => void;
};

export function AgendaIntelligencePopup({ open, alerts, onClose, onDismiss }: Props) {
  if (!open || !alerts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-gray-700 bg-[#18191B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-xs font-black uppercase text-white">IA Agenda Logta</span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto p-4">
          {alerts.slice(0, 4).map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left">
              <div className="mb-1 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs font-bold text-white">{a.title}</p>
              </div>
              <p className="text-[11px] font-medium text-gray-400">{a.message}</p>
              <div className="mt-2 flex gap-2">
                {a.actionPath ? (
                  <Link
                    to={a.actionPath}
                    onClick={onClose}
                    className="text-[10px] font-black uppercase text-primary"
                  >
                    Ver detalhe
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDismiss(a.id)}
                  className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-300"
                >
                  Dispensar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
